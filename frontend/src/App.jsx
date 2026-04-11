import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { Upload, Activity, Info, CheckCircle, Loader2, Music, AlertCircle, Mic, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('cry_history')
    return saved ? JSON.parse(saved) : []
  })
  const [activities, setActivities] = useState(() => {
    const saved = localStorage.getItem('daily_activities')
    return saved ? JSON.parse(saved) : { feeding: [], sleep: [], diaper: [] }
  })
  
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  useEffect(() => {
    localStorage.setItem('cry_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('daily_activities', JSON.stringify(activities))
  }, [activities])

  const logActivity = (type) => {
    const newActivity = { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setActivities(prev => ({
      ...prev,
      [type]: [newActivity, ...prev[type]].slice(0, 5) // Keep last 5
    }))
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size too large. Please upload less than 10MB.")
        return
      }
      setFile(selectedFile)
      setError(null)
      setResult(null)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const recordedFile = new File([audioBlob], `recording_${Date.now()}.wav`, { type: 'audio/wav' })
        setFile(recordedFile)
        setIsRecording(false)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setError(null)
      setResult(null)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Microphone access denied or not available.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const newResult = response.data
      setResult(newResult)
      
      // Add to history
      setHistory(prev => [{
        id: Date.now(),
        prediction: newResult.prediction,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: newResult.confidence
      }, ...prev].slice(0, 10))

    } catch (err) {
      console.error(err)
      setError(err.response?.data?.detail || "Failed to process audio. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          AYA
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Cry Translator & Baby Tracker 🍼✨
        </motion.p>
      </header>

      <div className="main-content">
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '2rem' }}>🎨</span>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f43f5e' }}>Cry Translator</h2>
          </div>
          <p style={{ color: '#947b7b', marginBottom: '2.5rem', fontSize: '1.1rem', fontWeight: 500 }}>
            Curious about those tears? Record a sample and we'll translate it!
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Recording Interface */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1.5rem',
                padding: '3rem',
                background: isRecording ? '#fff1f2' : '#fffaf5',
                borderRadius: '2.5rem',
                border: isRecording ? '4px solid #fecdd3' : '4px solid transparent',
              }}
            >
              <motion.button
                className="btn"
                style={{ width: '90px', height: '90px', borderRadius: '50%', background: isRecording ? '#e11d48' : '#f43f5e', padding: 0 }}
                animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square fill="#fff" size={32} /> : <Mic size={40} />}
              </motion.button>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800, fontSize: '1.25rem', color: isRecording ? '#e11d48' : '#f43f5e', margin: 0 }}>
                  {isRecording ? "Listening..." : "Tell me more"}
                </p>
              </div>
            </div>

            {/* Upload Area */}
            <div className="upload-area" onClick={() => fileInputRef.current.click()}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".wav,.mp3,.m4a" />
              {file && !isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <CheckCircle size={24} color="#f43f5e" />
                  <p style={{ fontWeight: 800, color: '#f43f5e', margin: 0 }}>{file.name}</p>
                </div>
              ) : (
                <span style={{ fontWeight: 800 }}>Or upload a recording</span>
              )}
            </div>
          </div>

          <button className="btn" style={{ marginTop: '3rem', width: '100%' }} disabled={!file || loading || isRecording} onClick={handleUpload}>
            {loading ? <Loader2 className="loading-spinner" /> : 'Translate 🪄'}
          </button>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <AnimatePresence>
            {result && (
              <motion.div className="card result-card" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <div className="result-header">
                  <h2 style={{ margin: 0, color: '#f43f5e' }}>Baby says...</h2>
                  <div className="reason-tag">{result.prediction}</div>
                </div>
                <div className="suggestion-box">
                  <p style={{ margin: 0, color: '#4b3d3d', fontSize: '1.1rem', fontWeight: 500 }}>{result.suggestion}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity Tracker */}
          <motion.div className="card" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}>
            <h2 style={{ marginBottom: '1.5rem', color: '#f43f5e' }}>Daily Tracker 📊</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <button className="btn" style={{ background: '#fef3c7', color: '#d97706', flexDirection: 'column', padding: '1.5rem 0' }} onClick={() => logActivity('feeding')}>
                <span style={{ fontSize: '1.5rem' }}>🍼</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>FEED</span>
              </button>
              <button className="btn" style={{ background: '#e0e7ff', color: '#4f46e5', flexDirection: 'column', padding: '1.5rem 0' }} onClick={() => logActivity('sleep')}>
                <span style={{ fontSize: '1.5rem' }}>💤</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>SLEEP</span>
              </button>
              <button className="btn" style={{ background: '#dcfce7', color: '#16a34a', flexDirection: 'column', padding: '1.5rem 0' }} onClick={() => logActivity('diaper')}>
                <span style={{ fontSize: '1.5rem' }}>🧷</span>
                <span style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>DIAPER</span>
              </button>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
               <h4 style={{ margin: '0 0 1rem', color: '#947b7b' }}>Recent Activity</h4>
               {['feeding', 'sleep', 'diaper'].map(type => (
                 activities[type].length > 0 && (
                   <div key={type} style={{ fontSize: '0.875rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 700 }}>{type.toUpperCase()}</span>
                      <span>Last at {activities[type][0].time}</span>
                   </div>
                 )
               ))}
            </div>
          </motion.div>

          {/* Translation History */}
          {history.length > 0 && (
            <motion.div className="card" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}>
              <h2 style={{ marginBottom: '1.5rem', color: '#f43f5e' }}>Cry History 📜</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {history.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fffaf5', borderRadius: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, color: '#fb7185' }}>{item.prediction}</span>
                      <div style={{ fontSize: '0.75rem', color: '#947b7b' }}>Confident: {item.confidence}%</div>
                    </div>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
