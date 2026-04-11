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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Activity color="#2563eb" size={24} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>AI Diagnostic</h2>
          </div>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
            Capture a live cry sample for immediate interpretation using our validated neural models.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Recording Interface */}
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '1.25rem',
                padding: '2.5rem',
                background: isRecording ? '#fff1f2' : '#f8fafc',
                borderRadius: '1.25rem',
                border: isRecording ? '2px solid #fda4af' : '2px solid #e2e8f0',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <motion.button
                className="btn"
                style={{ 
                  width: '72px', 
                  height: '72px', 
                  borderRadius: '100%',
                  background: isRecording ? '#e11d48' : '#0f172a',
                  padding: 0,
                  boxShadow: isRecording ? '0 0 20px rgba(225, 29, 72, 0.3)' : 'none'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={isRecording ? stopRecording : startRecording}
              >
                {isRecording ? <Square fill="#fff" size={24} /> : <Mic size={28} />}
              </motion.button>
              
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 700, fontSize: '1rem', color: isRecording ? '#e11d48' : '#0f172a', margin: 0 }}>
                  {isRecording ? "Sensing Audio..." : "Start Live Session"}
                </p>
                {isRecording && (
                   <motion.div 
                    animate={{ opacity: [1, 0.3, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ color: '#e11d48', fontSize: '0.75rem', fontWeight: 800, marginTop: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                   >
                     • Processing Stream
                   </motion.div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#94a3b8' }}>
               <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
               <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>or analyze file</span>
               <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
            </div>

            {/* Upload Area */}
            <div 
              className="upload-area"
              onClick={() => fileInputRef.current.click()}
              style={{ padding: '1.25rem' }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept=".wav,.mp3,.m4a"
              />
              {file && !isRecording ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} color="#059669" />
                  <p style={{ fontWeight: 600, color: '#0f172a', margin: 0, fontSize: '0.875rem' }}>{file.name}</p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                   <Upload size={18} />
                   <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Import Audio Data</span>
                </div>
              )}
            </div>
          </div>

          <button 
            className="btn" 
            style={{ marginTop: '2.5rem', background: '#2563eb', padding: '1rem' }}
            disabled={!file || loading || isRecording}
            onClick={handleUpload}
          >
            {loading ? <Loader2 className="loading-spinner" /> : <Activity size={20} />}
            {loading ? 'Interpreting...' : 'Run Neural Analysis'}
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
              style={{ borderTop: '4px solid #2563eb' }}
            >
              <div className="result-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Diagnostic Report</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 1.5rem', fontSize: '0.875rem' }}>Reference ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <div className="reason-tag">{result.prediction}</div>
              </div>

              <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#475569' }}>NEURAL CONFIDENCE</span>
                  <span style={{ fontWeight: 800, color: '#2563eb' }}>{result.confidence}%</span>
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
                  <CheckCircle size={20} color="#2563eb" />
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Recommended Care</h3>
                </div>
                <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '0.925rem' }}>
                  {result.suggestion}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Sample Length</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{result.details.duration_sec.toFixed(2)}s</div>
                 </div>
                 <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Analysis Mode</div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>CNN-v4</div>
                 </div>
              </div>
              
              <p style={{ fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center', marginTop: '1rem' }}>
                Disclaimer: This AI tool is for informational purposes and does not replace medical advice.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !loading && (
          <motion.div 
            className="card"
            style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: '#f8fafc', border: '2px dashed #e2e8f0', boxShadow: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Activity size={48} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: '#64748b', margin: 0 }}>Awaiting Stream</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Initiate a session to analyze biometric data.</p>
          </motion.div>
        )}
      </div>

      <section style={{ width: '100%', maxWidth: '1100px', marginTop: '4rem', padding: '4rem 2rem', background: '#ffffff', borderRadius: '2rem', border: '1px solid #e2e8f0' }}>
         <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 800 }}>Clinical Foundation</h2>
            <p style={{ color: '#64748b' }}>Leveraging state-of-the-art signal processing for early intervention.</p>
         </div>
         
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ padding: '1.5rem' }}>
               <div style={{ color: '#2563eb', marginBottom: '1rem' }}><Activity size={32} /></div>
               <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Acoustic Biomarkers</h4>
               <p style={{ color: '#64748b', fontSize: '0.875rem' }}>We extract MFCC and Mel-Frequency patterns to detect physiological distress signals.</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
               <div style={{ color: '#2563eb', marginBottom: '1rem' }}><CheckCircle size={32} /></div>
               <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Validated Accuracy</h4>
               <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Our model is benchmarked against public datasets like Donate-A-Cry for robust performance.</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
               <div style={{ color: '#2563eb', marginBottom: '1rem' }}><Info size={32} /></div>
               <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Instant Insights</h4>
               <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Real-time interpretation provides parents with immediate actionable guidance.</p>
            </div>
         </div>
      </section>

      <footer style={{ marginTop: '5rem', padding: '2rem', textAlign: 'center', color: '#94a3b8', borderTop: '1px solid #e2e8f0', width: '100%' }}>
         <p style={{ fontSize: '0.875rem' }}>© 2026 BabyCryInsight Technologies. Inspired by Ubenwa Health Research.</p>
         <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>RESEARCH PAPERS</span>
            <span>PRIVACY POLICY</span>
            <span>TERMS OF USE</span>
         </div>
      </footer>
    </div>
  )
}

export default App


