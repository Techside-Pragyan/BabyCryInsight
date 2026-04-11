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
  
  const fileInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

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
      setResult(response.data)
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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          BabyCryInsight
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          AI-powered infant cry analysis to help you understand your baby's needs.
        </motion.p>
      </header>

      <div className="main-content">
        <motion.div 
          className="card"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2>Voice Capture</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Record the baby's cry live or upload a recorded sample.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recording Interface */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1rem',
                padding: '2rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '1.5rem',
                border: isRecording ? '2px solid #ef4444' : '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
            >
              <motion.button
                className="btn"
                style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '50%',
                  background: isRecording ? '#ef4444' : 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                  padding: 0
                }}
                whileTap={{ scale: 0.9 }}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square fill="white" size={32} /> : <Mic size={32} />}
              </motion.button>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', margin: 0 }}>
                  {isRecording ? "Recording..." : "Capture Live Cry"}
                </p>
                {isRecording && (
                   <motion.div 
                    animate={{ opacity: [1, 0.4, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ color: '#ef4444', fontSize: '0.875rem', fontWeight: 700, marginTop: '0.25rem' }}
                   >
                     🔴 LIVE SENSING
                   </motion.div>
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>— OR —</div>

            {/* Upload Area */}
            <div 
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
              style={{ padding: '1.5rem' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept=".wav,.mp3,.m4a"
              />
              {file && !isRecording ? (
                <div>
                  <CheckCircle size={24} color="#22c55e" style={{ margin: '0 auto 0.5rem' }} />
                  <p style={{ fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{file.name}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                   <Upload size={20} color="#60a5fa" />
                   <span>Upload File</span>
                </div>
              )}
            </div>
          </div>

          <button 
            className="btn" 
            style={{ marginTop: '2rem' }}
            disabled={!file || loading || isRecording}
            onClick={handleUpload}
          >
            {loading ? <Loader2 className="loading-spinner" /> : <Activity size={20} />}
            {loading ? 'Analyzing...' : 'Analyze Cry Patterns'}
          </button>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ marginTop: '1rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <AlertCircle size={16} />
              <span style={{ fontSize: '0.875rem' }}>{error}</span>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div 
              className="card result-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="result-header">
                <div>
                  <h2 style={{ margin: 0 }}>Analysis Complete</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 1.5rem' }}>Pattern recognition results</p>
                </div>
                <div className="reason-tag">{result.prediction}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Confidence Score</span>
                  <span>{result.confidence}%</span>
                </div>
                <div className="confidence-bar">
                  <motion.div 
                    className="confidence-fill" 
                    initial={{ width: 0 }}
                    animate={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>

              <div className="suggestion-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <CheckCircle size={20} color="#60a5fa" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Expert Suggestion</h3>
                </div>
                <p style={{ margin: 0, color: '#cbd5e1' }}>
                  {result.suggestion}
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                 <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <Music size={16} style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Processed</div>
                    <div style={{ fontWeight: 600 }}>{result.details.duration_sec.toFixed(2)}s</div>
                 </div>
                 <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <Info size={16} style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sample rate</div>
                    <div style={{ fontWeight: 600 }}>22.05 kHz</div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && (
          <motion.div 
            className="card"
            style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', opacity: 0.5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
          >
            <Activity size={64} style={{ marginBottom: '1.5rem' }} />
            <h3>Awaiting Input</h3>
            <p>Record a cry or upload a file to start analysis.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default App

