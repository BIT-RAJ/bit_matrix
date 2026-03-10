import { useState } from 'react'
import { generateCoverLetter } from '../utils/api.js'
import { showToast } from './Toast.jsx'
import './CoverLetter.css'

function CoverLetter({ resumeText, jobRole, onBack }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [data, setData] = useState(null)
    const [companyName, setCompanyName] = useState('')
    const [generated, setGenerated] = useState(false)

    const handleGenerate = async () => {
        try {
            setLoading(true)
            setError('')
            const result = await generateCoverLetter(resumeText, jobRole, companyName)
            setData(result)
            setGenerated(true)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const copyLetter = () => {
        navigator.clipboard.writeText(data.coverLetter)
        showToast('Cover letter copied to clipboard!', 'success')
    }

    const downloadLetter = () => {
        const blob = new Blob([data.coverLetter], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cover_letter.txt'
        a.click()
        URL.revokeObjectURL(url)
        showToast('Cover letter downloaded!', 'success')
    }

    if (loading) {
        return (
            <div className="cover-wrapper">
                <div className="cover-loading animate-in">
                    <div className="analyzing-spinner"></div>
                    <h2>Crafting Your Cover Letter</h2>
                    <p>Our AI is writing a personalized cover letter from your resume...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="cover-wrapper">
            <div className="cover-container">
                <div className="cover-header animate-in">
                    <div>
                        <h1 className="cover-title">✉️ Cover Letter Generator</h1>
                        <p className="cover-subtitle">Generate a tailored cover letter from your resume</p>
                    </div>
                    <button className="btn-secondary" onClick={onBack}>← Back to Results</button>
                </div>

                {!generated ? (
                    <div className="cover-setup animate-in stagger-1">
                        <div className="cover-form glass">
                            <div className="cover-field">
                                <label htmlFor="company-input">Company Name (optional)</label>
                                <input
                                    type="text"
                                    id="company-input"
                                    className="cover-input"
                                    placeholder="e.g. Google, Microsoft, Startup Inc..."
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div className="cover-field">
                                <label>Target Role</label>
                                <p className="cover-role-display">{jobRole || 'General application'}</p>
                            </div>
                            <button className="btn-primary cover-generate-btn" onClick={handleGenerate} id="generate-cover-btn">
                                ✨ Generate Cover Letter
                            </button>
                        </div>

                        {error && (
                            <div className="error-message animate-in">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="cover-result animate-in stagger-1">
                        <div className="cover-letter-card glass">
                            <div className="cover-letter-actions">
                                <button className="btn-secondary" onClick={copyLetter}>📋 Copy</button>
                                <button className="btn-secondary" onClick={downloadLetter}>⬇ Download</button>
                                <button className="btn-secondary" onClick={() => { setGenerated(false); setData(null) }}>
                                    🔄 Regenerate
                                </button>
                            </div>
                            <div className="cover-letter-text">
                                {data.coverLetter.split('\n').map((line, i) => (
                                    <p key={i}>{line || <br />}</p>
                                ))}
                            </div>
                        </div>

                        {data.keyPoints && data.keyPoints.length > 0 && (
                            <div className="cover-extras glass animate-in stagger-2">
                                <h3>🎯 Key Points Highlighted</h3>
                                <ul className="cover-points">
                                    {data.keyPoints.map((p, i) => (
                                        <li key={i}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.customizationTips && data.customizationTips.length > 0 && (
                            <div className="cover-extras glass animate-in stagger-3">
                                <h3>💡 Customization Tips</h3>
                                <ul className="cover-points">
                                    {data.customizationTips.map((t, i) => (
                                        <li key={i}>{t}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CoverLetter
