import { useState } from 'react'
import { compareWithJD, rewriteResume, estimateSalary, getCareerPaths, optimizeLinkedIn, generateEmail } from '../utils/api.js'
import { showToast } from './Toast.jsx'
import './ToolsHub.css'

const TOOLS = [
    { id: 'jd', icon: '🎯', label: 'JD Match', desc: 'Compare resume against job description' },
    { id: 'rewrite', icon: '✏️', label: 'AI Rewriter', desc: 'Rewrite your entire resume' },
    { id: 'salary', icon: '💰', label: 'Salary', desc: 'Estimate salary range' },
    { id: 'career', icon: '🛤️', label: 'Career Paths', desc: 'Explore career progression' },
    { id: 'linkedin', icon: '💼', label: 'LinkedIn+', desc: 'Full profile optimization' },
    { id: 'email', icon: '📧', label: 'Email Writer', desc: 'Generate professional emails' },
]

function ToolsHub({ resumeText, jobRole, onBack }) {
    const [activeTool, setActiveTool] = useState(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    // Form states
    const [jdText, setJdText] = useState('')
    const [rewriteStyle, setRewriteStyle] = useState('Professional')
    const [location, setLocation] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [emailType, setEmailType] = useState('Follow-up')
    const [recipientRole, setRecipientRole] = useState('')

    const reset = () => { setResult(null); setError(''); }

    const copy = (text, label) => {
        navigator.clipboard.writeText(text)
        showToast(`${label} copied!`, 'success')
    }

    const runTool = async (toolId) => {
        try {
            setLoading(true); setError(''); setResult(null)
            let data
            switch (toolId) {
                case 'jd':
                    if (!jdText.trim()) { setError('Please paste a job description'); setLoading(false); return }
                    data = await compareWithJD(resumeText, jdText)
                    break
                case 'rewrite':
                    data = await rewriteResume(resumeText, jobRole, rewriteStyle)
                    break
                case 'salary':
                    data = await estimateSalary(resumeText, jobRole, location)
                    break
                case 'career':
                    data = await getCareerPaths(resumeText, jobRole)
                    break
                case 'linkedin':
                    data = await optimizeLinkedIn(resumeText, jobRole)
                    break
                case 'email':
                    data = await generateEmail(resumeText, emailType, recipientRole, companyName)
                    break
            }
            setResult(data)
            showToast('Results ready!', 'success')
        } catch (err) {
            setError(err.message)
            showToast(err.message, 'error')
        } finally { setLoading(false) }
    }

    if (!activeTool) {
        return (
            <div className="tools-wrapper">
                <div className="tools-container">
                    <div className="tools-header animate-in">
                        <div>
                            <h1 className="tools-title">🧰 Advanced Tools</h1>
                            <p className="tools-subtitle">Powerful AI-powered career tools built from your resume</p>
                        </div>
                        <button className="btn-secondary" onClick={onBack}>← Back to Results</button>
                    </div>
                    <div className="tools-grid animate-in stagger-1">
                        {TOOLS.map(t => (
                            <button key={t.id} className="tool-card glass" onClick={() => { setActiveTool(t.id); reset() }}>
                                <span className="tool-card-icon">{t.icon}</span>
                                <h3 className="tool-card-label">{t.label}</h3>
                                <p className="tool-card-desc">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const toolMeta = TOOLS.find(t => t.id === activeTool)

    return (
        <div className="tools-wrapper">
            <div className="tools-container">
                <div className="tools-header animate-in">
                    <div>
                        <h1 className="tools-title">{toolMeta.icon} {toolMeta.label}</h1>
                        <p className="tools-subtitle">{toolMeta.desc}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-secondary" onClick={() => { setActiveTool(null); reset() }}>← All Tools</button>
                        <button className="btn-secondary" onClick={onBack}>← Results</button>
                    </div>
                </div>

                {/* JD Compare */}
                {activeTool === 'jd' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <label className="tool-label">Paste Job Description</label>
                        <textarea className="tool-textarea" rows={8} placeholder="Paste the full job description here..." value={jdText} onChange={e => setJdText(e.target.value)} />
                        <button className="btn-primary" onClick={() => runTool('jd')} disabled={loading}>{loading ? '⏳ Comparing...' : '🎯 Compare'}</button>
                    </div>
                )}
                {activeTool === 'jd' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="jd-score-card glass">
                            <div className="jd-score-ring">
                                <svg viewBox="0 0 120 120" width="100" height="100">
                                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-glass)" strokeWidth="8" />
                                    <circle cx="60" cy="60" r="52" fill="none" stroke={result.matchScore >= 70 ? 'var(--success)' : result.matchScore >= 40 ? 'var(--warning)' : 'var(--danger)'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(result.matchScore / 100) * 327} 327`} transform="rotate(-90 60 60)" />
                                </svg>
                                <span className="jd-score-value">{result.matchScore}%</span>
                            </div>
                            <p className="jd-score-summary">{result.matchSummary}</p>
                        </div>
                        <div className="jd-cols">
                            <div className="jd-col glass">
                                <h3 className="success-text">✅ Matched Skills</h3>
                                <div className="tag-list">{(result.matchedSkills || []).map((s, i) => <span className="kw-tag kw-found" key={i}>{s}</span>)}</div>
                            </div>
                            <div className="jd-col glass">
                                <h3 className="danger-text">❌ Missing Skills</h3>
                                <div className="tag-list">{(result.missingSkills || []).map((s, i) => <span className="kw-tag kw-missing" key={i}>{s}</span>)}</div>
                            </div>
                        </div>
                        {result.tailoringTips?.length > 0 && (
                            <div className="tips-card glass">
                                <h3>💡 Tailoring Tips</h3>
                                <ul>{result.tailoringTips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                            </div>
                        )}
                        <button className="btn-secondary" onClick={reset}>🔄 Compare Again</button>
                    </div>
                )}

                {/* Rewriter */}
                {activeTool === 'rewrite' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <label className="tool-label">Style</label>
                        <select className="tool-select" value={rewriteStyle} onChange={e => setRewriteStyle(e.target.value)}>
                            <option>Professional</option><option>Creative</option><option>Executive</option><option>Technical</option><option>Concise</option>
                        </select>
                        <button className="btn-primary" onClick={() => runTool('rewrite')} disabled={loading}>{loading ? '⏳ Rewriting...' : '✏️ Rewrite Resume'}</button>
                    </div>
                )}
                {activeTool === 'rewrite' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="rewrite-header">
                            <span className="improvement-badge">📈 ~{result.improvementScore}% Improved</span>
                            <button className="btn-secondary" onClick={() => copy(result.rewrittenResume, 'Resume')}>📋 Copy</button>
                        </div>
                        <div className="rewrite-card glass">
                            <pre className="rewrite-text">{result.rewrittenResume}</pre>
                        </div>
                        {result.changesSummary?.length > 0 && (
                            <div className="tips-card glass"><h3>📝 Changes Made</h3><ul>{result.changesSummary.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                        )}
                        <button className="btn-secondary" onClick={reset}>🔄 Rewrite Again</button>
                    </div>
                )}

                {/* Salary */}
                {activeTool === 'salary' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <label className="tool-label">Location (optional)</label>
                        <input className="tool-input" placeholder="e.g. San Francisco, New York, Remote..." value={location} onChange={e => setLocation(e.target.value)} />
                        <button className="btn-primary" onClick={() => runTool('salary')} disabled={loading}>{loading ? '⏳ Estimating...' : '💰 Estimate Salary'}</button>
                    </div>
                )}
                {activeTool === 'salary' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="salary-cards">
                            <div className="salary-card glass"><span className="salary-label">Level</span><span className="salary-val">{result.estimatedLevel}</span></div>
                            <div className="salary-card glass"><span className="salary-label">Experience</span><span className="salary-val">{result.yearsExperience} yrs</span></div>
                        </div>
                        <div className="salary-range glass">
                            <h3>💰 Estimated Range ({result.salaryRange?.currency || 'USD'})</h3>
                            <div className="salary-bar-outer">
                                <div className="salary-bar-inner">
                                    <span className="salary-marker low">${(result.salaryRange?.low || 0).toLocaleString()}</span>
                                    <span className="salary-marker mid">${(result.salaryRange?.mid || 0).toLocaleString()}</span>
                                    <span className="salary-marker high">${(result.salaryRange?.high || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <div className="tips-card glass"><h3>💡 Negotiation Tips</h3><ul>{(result.negotiationTips || []).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                        <p className="market-insight glass">{result.marketInsights}</p>
                    </div>
                )}

                {/* Career Paths */}
                {activeTool === 'career' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <p className="tool-desc">We'll analyze your resume and suggest career progression paths.</p>
                        <button className="btn-primary" onClick={() => runTool('career')} disabled={loading}>{loading ? '⏳ Analyzing...' : '🛤️ Explore Paths'}</button>
                    </div>
                )}
                {activeTool === 'career' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="career-level glass"><span>Current Level:</span> <strong>{result.currentLevel}</strong></div>
                        {(result.paths || []).map((p, i) => (
                            <div className="career-path-card glass" key={i}>
                                <div className="career-path-header">
                                    <h3>{p.title}</h3>
                                    <span className="career-timeline">⏱️ {p.timeline}</span>
                                </div>
                                <div className="career-path-body">
                                    <div><strong>Steps:</strong><ul>{(p.steps || []).map((s, j) => <li key={j}>{s}</li>)}</ul></div>
                                    <div><strong>Skills Needed:</strong><div className="tag-list">{(p.requiredSkills || []).map((s, j) => <span className="kw-tag kw-found" key={j}>{s}</span>)}</div></div>
                                    <div><strong>Potential Roles:</strong><div className="tag-list">{(p.potentialRoles || []).map((r, j) => <span className="kw-tag kw-missing" key={j}>{r}</span>)}</div></div>
                                    {p.salaryGrowth && <p className="salary-growth">📈 Salary Growth: {p.salaryGrowth}</p>}
                                </div>
                            </div>
                        ))}
                        {result.certifications?.length > 0 && (
                            <div className="tips-card glass"><h3>🎓 Recommended Certifications</h3><ul>{result.certifications.map((c, i) => <li key={i}><strong>{c.name}</strong> — {c.value}</li>)}</ul></div>
                        )}
                        <p className="market-insight glass">{result.generalAdvice}</p>
                    </div>
                )}

                {/* LinkedIn */}
                {activeTool === 'linkedin' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <p className="tool-desc">Generate an optimized LinkedIn headline, about section, and profile tips.</p>
                        <button className="btn-primary" onClick={() => runTool('linkedin')} disabled={loading}>{loading ? '⏳ Optimizing...' : '💼 Optimize Profile'}</button>
                    </div>
                )}
                {activeTool === 'linkedin' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="li-card glass">
                            <h3>📝 Headline</h3>
                            <p className="li-headline">{result.headline}</p>
                            <button className="btn-secondary btn-sm" onClick={() => copy(result.headline, 'Headline')}>📋 Copy</button>
                        </div>
                        <div className="li-card glass">
                            <h3>📖 About Section</h3>
                            <div className="li-about">{(result.about || '').split('\n').map((l, i) => <p key={i}>{l || <br />}</p>)}</div>
                            <button className="btn-secondary btn-sm" onClick={() => copy(result.about, 'About')}>📋 Copy</button>
                        </div>
                        <div className="li-card glass">
                            <h3>🔑 Top Skills</h3>
                            <div className="tag-list">{(result.skills || []).map((s, i) => <span className="kw-tag kw-found" key={i}>{s}</span>)}</div>
                        </div>
                        <div className="li-card glass">
                            <h3>⭐ Featured Section Ideas</h3>
                            <ul>{(result.featuredSection || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
                        </div>
                        <div className="tips-card glass"><h3>🌐 Networking Tips</h3><ul>{(result.connectivityTips || []).map((t, i) => <li key={i}>{t}</li>)}</ul></div>
                    </div>
                )}

                {/* Email */}
                {activeTool === 'email' && !result && (
                    <div className="tool-form glass animate-in stagger-1">
                        <label className="tool-label">Email Type</label>
                        <select className="tool-select" value={emailType} onChange={e => setEmailType(e.target.value)}>
                            <option>Follow-up</option><option>Networking</option><option>Thank You</option><option>Cold Outreach</option><option>Referral Request</option><option>Application</option>
                        </select>
                        <label className="tool-label">Company (optional)</label>
                        <input className="tool-input" placeholder="e.g. Google" value={companyName} onChange={e => setCompanyName(e.target.value)} />
                        <label className="tool-label">Recipient Role (optional)</label>
                        <input className="tool-input" placeholder="e.g. Hiring Manager, Recruiter" value={recipientRole} onChange={e => setRecipientRole(e.target.value)} />
                        <button className="btn-primary" onClick={() => runTool('email')} disabled={loading}>{loading ? '⏳ Writing...' : '📧 Generate Email'}</button>
                    </div>
                )}
                {activeTool === 'email' && result && (
                    <div className="tool-result animate-in stagger-1">
                        <div className="email-card glass">
                            <div className="email-subject"><strong>Subject:</strong> {result.subject}</div>
                            <div className="email-body">{(result.body || '').split('\n').map((l, i) => <p key={i}>{l || <br />}</p>)}</div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <button className="btn-secondary" onClick={() => copy(`Subject: ${result.subject}\n\n${result.body}`, 'Email')}>📋 Copy</button>
                            </div>
                        </div>
                        {result.alternatives?.length > 0 && (
                            <div className="tips-card glass"><h3>🔄 Alternative Approaches</h3>
                                {result.alternatives.map((alt, i) => (
                                    <div key={i} className="alt-email"><strong>Subject:</strong> {alt.subject}<br /><em>Opening:</em> {alt.opening}</div>
                                ))}
                            </div>
                        )}
                        {result.tips?.length > 0 && <div className="tips-card glass"><h3>💡 Email Tips</h3><ul>{result.tips.map((t, i) => <li key={i}>{t}</li>)}</ul></div>}
                        <button className="btn-secondary" onClick={reset}>🔄 Generate Another</button>
                    </div>
                )}

                {/* Loading / Error */}
                {loading && (
                    <div className="tool-loading animate-in">
                        <div className="analyzing-spinner"></div>
                        <p>AI is working on it...</p>
                    </div>
                )}
                {error && <div className="error-message animate-in">⚠️ {error}</div>}
            </div>
        </div>
    )
}

export default ToolsHub
