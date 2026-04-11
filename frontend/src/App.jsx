import React, { useState, useRef } from 'react'
import axios from 'axios'
import { Upload, Activity, Info, CheckCircle, Loader2, Music, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

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

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use the proxy defined in vite.config.js
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
          <h2>Upload Audio</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            Upload a .wav or .mp3 recording of the baby's cry.
          </p>

          <div 
            className="upload-area"
            onClick={() => fileInputRef.current.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }}
              accept=".wav,.mp3,.m4a"
            />
            <Upload size={48} color="#60a5fa" style={{ marginBottom: '1rem' }} />
            {file ? (
              <div>
                <p style={{ fontWeight: 600, color: '#e2e8f0' }}>{file.name}</p>
                <p style={{ fontSize: '0.875rem' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <p>Click or drag audio file here</p>
            )}
          </div>

          <button 
            className="btn" 
            style={{ marginTop: '2rem' }}
            disabled={!file || loading}
            onClick={handleUpload}
          >
            {loading ? <Loader2 className="loading-spinner" style={{ animation: 'spin 1s linear infinite' }} /> : <Activity size={20} />}
            {loading ? 'Analyzing...' : 'Start Detection'}
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
                  <h2 style={{ margin: 0 }}>Prediction Result</h2>
                  <p style={{ color: '#64748b', margin: '0.25rem 0 1.5rem' }}>Based on audio patterns</p>
                </div>
                <div className="reason-tag">{result.prediction}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>Confidence</span>
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
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Suggested Action</h3>
                </div>
                <p style={{ margin: 0, color: '#cbd5e1' }}>
                  {result.suggestion}
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem' }}>
                 <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <Music size={16} style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Duration</div>
                    <div style={{ fontWeight: 600 }}>{result.details.duration_sec.toFixed(2)}s</div>
                 </div>
                 <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '1rem', textAlign: 'center' }}>
                    <Info size={16} style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sample Rate</div>
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
            <p>Upload a file to see identification results here.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default App
