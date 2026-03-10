import { useState, useRef, useEffect } from 'react'
import { uploadResume, analyzeResume } from '../utils/api.js'
import './Landing.css'

function Landing({ page, setPage, resumeText, setResumeText, jobRole, setJobRole, onAnalysisComplete, error, setError }) {
    const [dragActive, setDragActive] = useState(false)
    const [fileName, setFileName] = useState('')
    const [inputMode, setInputMode] = useState('file')
    const [pastedText, setPastedText] = useState('')
    const [progressStep, setProgressStep] = useState(0)
    const fileInputRef = useRef(null)

    // Animated progress during analysis
    useEffect(() => {
        if (page === 'analyzing') {
            const timers = [
                setTimeout(() => setProgressStep(1), 800),
                setTimeout(() => setProgressStep(2), 2500),
                setTimeout(() => setProgressStep(3), 5000),
            ]
            return () => timers.forEach(clearTimeout)
        } else {
            setProgressStep(0)
        }
    }, [page])

    const handleDrag = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
        else if (e.type === 'dragleave') setDragActive(false)
    }

    const processFile = async (file) => {
        try {
            setError('')
            setFileName(file.name)
            setPage('analyzing')
            const { text } = await uploadResume(file)
            setResumeText(text)
            const analysis = await analyzeResume(text, jobRole)
            onAnalysisComplete(analysis)
        } catch (err) {
            setError(err.message)
            setPage('upload')
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0])
        }
    }

    const handleFileInput = (e) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0])
        }
    }

    const handleTextSubmit = async () => {
        if (!pastedText.trim() || pastedText.trim().length < 20) {
            setError('Please paste at least 20 characters of resume text.')
            return
        }
        try {
            setError('')
            setPage('analyzing')
            setResumeText(pastedText.trim())
            const analysis = await analyzeResume(pastedText.trim(), jobRole)
            onAnalysisComplete(analysis)
        } catch (err) {
            setError(err.message)
            setPage('upload')
        }
    }

    const wordCount = pastedText.trim() ? pastedText.trim().split(/\s+/).length : 0

    if (page === 'analyzing') {
        const steps = [
            { label: 'Extracting content', icon: '📄' },
            { label: 'Analyzing structure', icon: '🔍' },
            { label: 'Generating suggestions', icon: '💡' },
            { label: 'Building recommendations', icon: '🚀' },
        ]

        return (
            <div className="landing-wrapper">
                <div className="analyzing-container animate-in">
                    <div className="analyzing-spinner"></div>
                    <h2 className="analyzing-title">Analyzing Your Resume</h2>
                    <p className="analyzing-subtitle">
                        Our AI is reviewing your resume for improvements, skill gaps, and actionable feedback...
                    </p>
                    {fileName && <p className="analyzing-file">📎 {fileName}</p>}
                    <div className="analyzing-steps">
                        {steps.map((step, i) => (
                            <div className={`step ${i <= progressStep ? 'active' : ''} ${i < progressStep ? 'done' : ''}`} key={i}>
                                <span className="step-dot">{i < progressStep ? '✓' : step.icon}</span>
                                <span>{step.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="analyzing-progress-track">
                        <div className="analyzing-progress-fill" style={{ width: `${((progressStep + 1) / 4) * 100}%` }} />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="landing-wrapper">
            <div className="landing-bg">
                <div className="bg-orb bg-orb-1"></div>
                <div className="bg-orb bg-orb-2"></div>
                <div className="bg-orb bg-orb-3"></div>
            </div>

            <div className="landing-content">
                {/* Hero */}
                <div className="hero animate-in">
                    <div className="hero-badge">
                        <span className="hero-badge-dot"></span>
                        AI-Powered Resume Analysis
                    </div>
                    <h1 className="hero-title">
                        Transform Your Resume<br />
                        <span className="hero-gradient">Into a Job Magnet</span>
                    </h1>
                    <p className="hero-subtitle">
                        Upload your resume and get instant AI-powered feedback — improved bullet points,
                        skill gap analysis, ATS scoring, and personalized interview prep.
                    </p>
                </div>

                {/* Job Role Input */}
                <div className="job-role-row animate-in stagger-1">
                    <label htmlFor="job-role-input" className="job-role-label">Target Job Role (optional)</label>
                    <input
                        type="text"
                        id="job-role-input"
                        className="job-role-input"
                        placeholder="e.g. Frontend Developer, Data Scientist, Product Manager..."
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                    />
                </div>

                {/* Mode toggle */}
                <div className="mode-toggle animate-in stagger-2">
                    <button
                        className={`mode-btn ${inputMode === 'file' ? 'active' : ''}`}
                        onClick={() => setInputMode('file')}
                        id="mode-file"
                    >
                        📄 Upload File
                    </button>
                    <button
                        className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                        onClick={() => setInputMode('text')}
                        id="mode-text"
                    >
                        ✍️ Paste Text
                    </button>
                </div>

                {/* Upload zone */}
                {inputMode === 'file' ? (
                    <div
                        className={`upload-zone animate-in stagger-3 ${dragActive ? 'drag-active' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        id="upload-zone"
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileInput}
                            accept=".pdf,.doc,.docx,.txt"
                            hidden
                            id="file-input"
                        />
                        <div className="upload-icon">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path d="M24 4L24 32" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                                <path d="M16 12L24 4L32 12" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 28V38C8 40.2 9.8 42 12 42H36C38.2 42 40 40.2 40 38V28" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" />
                                <defs><linearGradient id="grad" x1="0" y1="0" x2="48" y2="48"><stop offset="0%" stopColor="#6c5ce7" /><stop offset="100%" stopColor="#a29bfe" /></linearGradient></defs>
                            </svg>
                        </div>
                        <p className="upload-text">
                            <strong>Drag & drop</strong> your resume here or <strong>click to browse</strong>
                        </p>
                        <p className="upload-hint">Supports PDF, DOC, DOCX, and TXT files (max 10 MB)</p>
                    </div>
                ) : (
                    <div className="text-input-zone animate-in stagger-3">
                        <textarea
                            className="resume-textarea"
                            placeholder="Paste your resume text here..."
                            value={pastedText}
                            onChange={(e) => setPastedText(e.target.value)}
                            rows={12}
                            id="resume-textarea"
                        />
                        <div className="textarea-footer">
                            <span className="word-count">
                                {wordCount} word{wordCount !== 1 ? 's' : ''} · {pastedText.length} characters
                            </span>
                            <button
                                className="btn-primary submit-text-btn"
                                onClick={handleTextSubmit}
                                disabled={!pastedText.trim()}
                                id="submit-text-btn"
                            >
                                🚀 Analyze Resume
                            </button>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="error-message animate-in" id="error-message">
                        <span>⚠️</span> {error}
                    </div>
                )}

                {/* Features */}
                <div className="features-grid animate-in stagger-4">
                    {[
                        { icon: '🎯', title: 'Action Verb Bullets', desc: 'Transform weak bullets into powerful impact statements' },
                        { icon: '🤖', title: 'ATS Compatibility', desc: 'Check if your resume passes Applicant Tracking Systems' },
                        { icon: '🧩', title: 'Skill Gap Analysis', desc: 'Identify missing skills for your target role' },
                        { icon: '📊', title: 'Section Scoring', desc: 'Get scored feedback on each resume section' },
                        { icon: '🎤', title: 'Interview Simulator', desc: 'Practice with AI-generated personalized questions' },
                        { icon: '✉️', title: 'Cover Letter', desc: 'Generate a tailored cover letter from your resume' },
                    ].map((f, i) => (
                        <div className="feature-card glass" key={i}>
                            <span className="feature-icon">{f.icon}</span>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Landing
