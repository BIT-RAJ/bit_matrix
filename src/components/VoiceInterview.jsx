import { useState, useEffect, useRef, useCallback } from 'react'
import { startVoiceInterview, sendVoiceResponse } from '../utils/api.js'
import { showToast } from './Toast.jsx'
import './VoiceInterview.css'

// ── Speech helpers ──────────────────────────────────────────
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const speechSynthesis = window.speechSynthesis

function getPreferredVoice() {
    const voices = speechSynthesis?.getVoices() || []
    // Prefer a natural-sounding English voice
    return (
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.lang.startsWith('en') && v.localService === false) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] ||
        null
    )
}

function VoiceInterview({ resumeText, jobRole, onBack }) {
    // ── State ───────────────────────────────────────────────
    const [phase, setPhase] = useState('setup')        // setup | loading | interview | finished
    const [difficulty, setDifficulty] = useState('Medium')
    const [questionNum, setQuestionNum] = useState(0)
    const [totalQuestions] = useState(8)
    const [candidateName, setCandidateName] = useState('')
    const [conversation, setConversation] = useState([]) // {role:'ai'|'user', text, timestamp}
    const [currentQuestion, setCurrentQuestion] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false)
    const [isThinking, setIsThinking] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [timer, setTimer] = useState(0)
    const [score, setScore] = useState(null)
    const [finalFeedback, setFinalFeedback] = useState(null)
    const [error, setError] = useState('')
    const [voiceSupported, setVoiceSupported] = useState(true)
    const [useTextMode, setUseTextMode] = useState(false)
    const [textInput, setTextInput] = useState('')
    const [aiSpeakEnabled, setAiSpeakEnabled] = useState(true)

    // Refs
    const recognitionRef = useRef(null)
    const timerRef = useRef(null)
    const chatEndRef = useRef(null)
    const conversationRef = useRef([])

    // Keep ref in sync with state
    useEffect(() => { conversationRef.current = conversation }, [conversation])

    // ── Voice support check ─────────────────────────────────
    useEffect(() => {
        if (!SpeechRecognition) {
            setVoiceSupported(false)
            setUseTextMode(true)
        }
        // Pre-load voices
        if (speechSynthesis) {
            speechSynthesis.getVoices()
            speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices()
        }
    }, [])

    // ── Auto-scroll chat ────────────────────────────────────
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversation, interimTranscript])

    // ── Timer ───────────────────────────────────────────────
    useEffect(() => {
        if (phase === 'interview') {
            timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [phase])

    const formatTime = (s) => {
        const m = Math.floor(s / 60)
        const sec = s % 60
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    }

    // ── TTS ─────────────────────────────────────────────────
    const speak = useCallback((text) => {
        return new Promise((resolve) => {
            if (!aiSpeakEnabled || !speechSynthesis) { resolve(); return }
            // Cancel any in-progress speech
            speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.voice = getPreferredVoice()
            utterance.rate = 1.0
            utterance.pitch = 1.0
            utterance.volume = 1.0
            utterance.onstart = () => setIsSpeaking(true)
            utterance.onend = () => { setIsSpeaking(false); resolve() }
            utterance.onerror = () => { setIsSpeaking(false); resolve() }
            speechSynthesis.speak(utterance)
        })
    }, [aiSpeakEnabled])

    // ── STT ─────────────────────────────────────────────────
    const startListening = useCallback(() => {
        if (!SpeechRecognition || useTextMode) return
        try {
            const recognition = new SpeechRecognition()
            recognition.continuous = true
            recognition.interimResults = true
            recognition.lang = 'en-US'
            recognition.maxAlternatives = 1

            recognition.onresult = (event) => {
                let interim = ''
                let final = ''
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const t = event.results[i][0].transcript
                    if (event.results[i].isFinal) final += t + ' '
                    else interim = t
                }
                if (final) setTranscript(prev => (prev + ' ' + final).trim())
                setInterimTranscript(interim)
            }

            recognition.onerror = (e) => {
                if (e.error !== 'aborted' && e.error !== 'no-speech') {
                    console.warn('Speech recognition error:', e.error)
                }
            }

            recognition.onend = () => {
                // Only restart if still in listening mode
                if (recognitionRef.current) {
                    try { recognitionRef.current.start() } catch { /* already started */ }
                }
            }

            recognition.start()
            recognitionRef.current = recognition
            setIsListening(true)
            setTranscript('')
            setInterimTranscript('')
        } catch (err) {
            console.error('Failed to start speech recognition:', err)
            setUseTextMode(true)
        }
    }, [useTextMode])

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            const ref = recognitionRef.current
            recognitionRef.current = null
            try { ref.stop() } catch { /* ignore */ }
        }
        setIsListening(false)
        setInterimTranscript('')
    }, [])

    // ── Cleanup ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            stopListening()
            speechSynthesis?.cancel()
            clearInterval(timerRef.current)
        }
    }, [stopListening])

    // ── Start Interview ─────────────────────────────────────
    const handleStart = async () => {
        try {
            setPhase('loading')
            setError('')
            const data = await startVoiceInterview(resumeText, jobRole)

            setCandidateName(data.candidateName || '')
            setDifficulty(data.difficulty || 'Medium')
            setQuestionNum(1)

            const introText = data.interviewerIntro || ''
            const questionText = data.firstQuestion || ''
            const fullText = introText + (introText ? '\n\n' : '') + questionText

            setCurrentQuestion(questionText)
            setConversation([{ role: 'ai', text: fullText, timestamp: Date.now() }])

            setPhase('interview')
            await speak(fullText)
        } catch (err) {
            setError(err.message)
            setPhase('setup')
        }
    }

    // ── Submit Answer ───────────────────────────────────────
    const submitAnswer = async (answerText) => {
        if (!answerText || !answerText.trim()) {
            showToast('Please provide an answer first.', 'warning')
            return
        }

        const answer = answerText.trim()

        // Add user message to conversation
        const updatedConv = [...conversationRef.current, { role: 'user', text: answer, timestamp: Date.now() }]
        setConversation(updatedConv)
        setTranscript('')
        setTextInput('')
        setIsThinking(true)

        try {
            const data = await sendVoiceResponse(
                resumeText,
                jobRole,
                updatedConv.map(c => ({ role: c.role === 'ai' ? 'interviewer' : 'candidate', text: c.text })),
                answer,
                difficulty,
                questionNum
            )

            setDifficulty(data.difficulty || difficulty)
            setQuestionNum(data.questionNumber || questionNum + 1)

            if (data.isComplete) {
                // Interview finished
                const closingText = data.response || 'Thank you for the interview!'
                setConversation(prev => [...prev, { role: 'ai', text: closingText, timestamp: Date.now() }])
                setScore(data.finalScore || null)
                setFinalFeedback(data.finalFeedback || null)
                setIsThinking(false)
                await speak(closingText)
                setPhase('finished')
                clearInterval(timerRef.current)
                return
            }

            const aiText = (data.response || '') + (data.nextQuestion ? '\n\n' + data.nextQuestion : '')
            setCurrentQuestion(data.nextQuestion || '')
            setConversation(prev => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }])
            setIsThinking(false)
            await speak(aiText)
        } catch (err) {
            setIsThinking(false)
            showToast('Failed to get response: ' + err.message, 'error')
        }
    }

    const handleMicToggle = () => {
        if (isListening) {
            stopListening()
            // Auto-submit after stopping
            if (transcript.trim()) {
                submitAnswer(transcript)
            }
        } else {
            // Cancel AI speech if playing
            speechSynthesis?.cancel()
            setIsSpeaking(false)
            startListening()
        }
    }

    const handleTextSubmit = () => {
        if (textInput.trim()) submitAnswer(textInput)
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleTextSubmit()
        }
    }

    const handleSkip = () => {
        stopListening()
        submitAnswer("I'd prefer to skip this question and move on.")
    }

    const handleEndEarly = () => {
        stopListening()
        speechSynthesis?.cancel()
        clearInterval(timerRef.current)
        setPhase('finished')
        setScore(null)
        setFinalFeedback({ summary: 'Interview ended early. Complete all questions for a full evaluation.', strengths: [], improvements: ['Try to answer all questions for comprehensive feedback.'] })
    }

    const difficultyColor = (d) => {
        if (d === 'Easy') return 'var(--success)'
        if (d === 'Hard') return 'var(--danger)'
        return 'var(--warning)'
    }

    // ═══════════════════════════════════════════════════════
    //  SETUP SCREEN
    // ═══════════════════════════════════════════════════════
    if (phase === 'setup') {
        return (
            <div className="vi-wrapper">
                <div className="vi-setup animate-in">
                    <div className="vi-setup-header">
                        <button className="btn-secondary" onClick={onBack}>← Back</button>
                    </div>
                    <div className="vi-setup-hero">
                        <div className="vi-mic-icon-large">🎙️</div>
                        <h1 className="vi-setup-title">Real-Time AI Mock Interview</h1>
                        <p className="vi-setup-subtitle">
                            Experience a live interview powered by AI. The interviewer will ask personalized
                            questions based on your resume, give follow-ups, and adjust difficulty in real-time.
                        </p>
                    </div>

                    <div className="vi-setup-features">
                        <div className="vi-feature glass">
                            <span className="vi-feature-icon">🗣️</span>
                            <h3>Voice Interaction</h3>
                            <p>Speak naturally — the AI listens and responds like a real interviewer</p>
                        </div>
                        <div className="vi-feature glass">
                            <span className="vi-feature-icon">🧠</span>
                            <h3>Resume-Based Questions</h3>
                            <p>Questions drawn from YOUR resume — projects, skills, and experience</p>
                        </div>
                        <div className="vi-feature glass">
                            <span className="vi-feature-icon">🔄</span>
                            <h3>Follow-Up Questions</h3>
                            <p>The AI digs deeper based on your answers, just like a real recruiter</p>
                        </div>
                        <div className="vi-feature glass">
                            <span className="vi-feature-icon">📊</span>
                            <h3>Difficulty Adjustment</h3>
                            <p>Automatically adapts question difficulty based on your performance</p>
                        </div>
                    </div>

                    {!voiceSupported && (
                        <div className="vi-warning glass">
                            ⚠️ Your browser doesn't support speech recognition. You can still use <strong>text mode</strong> to type your answers.
                        </div>
                    )}

                    <div className="vi-setup-options glass">
                        <label className="vi-option-row">
                            <span>AI Voice Responses</span>
                            <button
                                className={`vi-toggle ${aiSpeakEnabled ? 'active' : ''}`}
                                onClick={() => setAiSpeakEnabled(!aiSpeakEnabled)}
                            >
                                <span className="vi-toggle-thumb" />
                            </button>
                        </label>
                        <label className="vi-option-row">
                            <span>Input Mode</span>
                            <div className="vi-mode-switch">
                                <button
                                    className={`vi-mode-btn ${!useTextMode ? 'active' : ''}`}
                                    onClick={() => setUseTextMode(false)}
                                    disabled={!voiceSupported}
                                >
                                    🎤 Voice
                                </button>
                                <button
                                    className={`vi-mode-btn ${useTextMode ? 'active' : ''}`}
                                    onClick={() => setUseTextMode(true)}
                                >
                                    ⌨️ Text
                                </button>
                            </div>
                        </label>
                    </div>

                    {error && <div className="error-message animate-in"><span>⚠️</span> {error}</div>}

                    <button className="btn-primary vi-start-btn" onClick={handleStart}>
                        🎙️ Start Interview
                    </button>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════════════════
    //  LOADING SCREEN
    // ═══════════════════════════════════════════════════════
    if (phase === 'loading') {
        return (
            <div className="vi-wrapper">
                <div className="vi-loading animate-in">
                    <div className="analyzing-spinner"></div>
                    <h2>Preparing Your Interview</h2>
                    <p>Bit-HireMatrix is reviewing your resume and preparing personalized questions...</p>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════════════════
    //  FINISHED SCREEN
    // ═══════════════════════════════════════════════════════
    if (phase === 'finished') {
        return (
            <div className="vi-wrapper">
                <div className="vi-finished animate-in">
                    <div className="vi-finished-header">
                        <h1>🎉 Interview Complete!</h1>
                        <p className="vi-finished-subtitle">
                            {candidateName ? `Great job, ${candidateName}!` : 'Great job!'} Here's your performance summary.
                        </p>
                    </div>

                    <div className="vi-finished-stats">
                        <div className="vi-stat-card glass">
                            <span className="vi-stat-value">{formatTime(timer)}</span>
                            <span className="vi-stat-label">Duration</span>
                        </div>
                        <div className="vi-stat-card glass">
                            <span className="vi-stat-value">{questionNum}</span>
                            <span className="vi-stat-label">Questions</span>
                        </div>
                        {score !== null && (
                            <div className="vi-stat-card glass">
                                <span className="vi-stat-value vi-score" data-score={score >= 7 ? 'high' : score >= 4 ? 'mid' : 'low'}>
                                    {score}/10
                                </span>
                                <span className="vi-stat-label">Score</span>
                            </div>
                        )}
                        <div className="vi-stat-card glass">
                            <span className="vi-stat-value" style={{ color: difficultyColor(difficulty) }}>{difficulty}</span>
                            <span className="vi-stat-label">Final Difficulty</span>
                        </div>
                    </div>

                    {finalFeedback && (
                        <div className="vi-feedback-section">
                            {finalFeedback.summary && (
                                <div className="vi-feedback-card glass">
                                    <h3>📋 Overall Feedback</h3>
                                    <p>{finalFeedback.summary}</p>
                                </div>
                            )}
                            <div className="vi-feedback-cols">
                                {finalFeedback.strengths?.length > 0 && (
                                    <div className="vi-feedback-card glass">
                                        <h3 className="success-text">💪 Strengths</h3>
                                        <ul>{finalFeedback.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                                {finalFeedback.improvements?.length > 0 && (
                                    <div className="vi-feedback-card glass">
                                        <h3 className="danger-text">📈 Areas to Improve</h3>
                                        <ul>{finalFeedback.improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                            {finalFeedback.tips?.length > 0 && (
                                <div className="vi-feedback-card glass">
                                    <h3>💡 Tips for Next Time</h3>
                                    <ul>{finalFeedback.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Conversation transcript */}
                    <details className="vi-transcript-details glass">
                        <summary>📜 Full Transcript ({conversation.length} messages)</summary>
                        <div className="vi-transcript-content">
                            {conversation.map((msg, i) => (
                                <div key={i} className={`vi-transcript-msg vi-transcript-${msg.role}`}>
                                    <strong>{msg.role === 'ai' ? '🤖 Interviewer' : '👤 You'}:</strong>
                                    <p>{msg.text}</p>
                                </div>
                            ))}
                        </div>
                    </details>

                    <div className="vi-finished-actions">
                        <button className="btn-primary" onClick={() => { setPhase('setup'); setConversation([]); setTimer(0); setQuestionNum(0); setScore(null); setFinalFeedback(null); }}>
                            🔄 Try Again
                        </button>
                        <button className="btn-secondary" onClick={onBack}>← Back to Results</button>
                    </div>
                </div>
            </div>
        )
    }

    // ═══════════════════════════════════════════════════════
    //  LIVE INTERVIEW SCREEN
    // ═══════════════════════════════════════════════════════
    return (
        <div className="vi-wrapper">
            <div className="vi-interview-container">
                {/* Top bar */}
                <div className="vi-topbar glass animate-in">
                    <div className="vi-topbar-left">
                        <span className="vi-live-badge">
                            <span className="vi-live-dot"></span>
                            LIVE
                        </span>
                        <span className="vi-timer">{formatTime(timer)}</span>
                    </div>
                    <div className="vi-topbar-center">
                        <span className="vi-question-counter">
                            Question {questionNum} / {totalQuestions}
                        </span>
                        <span className="vi-difficulty-badge" style={{ color: difficultyColor(difficulty), borderColor: difficultyColor(difficulty) }}>
                            {difficulty}
                        </span>
                    </div>
                    <div className="vi-topbar-right">
                        <button className="vi-topbar-btn" onClick={handleSkip} title="Skip question">⏭️</button>
                        <button className="vi-topbar-btn vi-end-btn" onClick={handleEndEarly} title="End interview">✕</button>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="vi-progress">
                    <div className="vi-progress-fill" style={{ width: `${(questionNum / totalQuestions) * 100}%` }} />
                </div>

                {/* Chat area */}
                <div className="vi-chat">
                    {conversation.map((msg, i) => (
                        <div key={i} className={`vi-bubble vi-bubble-${msg.role} animate-in`}>
                            <div className="vi-bubble-avatar">
                                {msg.role === 'ai' ? '🤖' : '👤'}
                            </div>
                            <div className="vi-bubble-content">
                                <div className="vi-bubble-name">
                                    {msg.role === 'ai' ? 'Bit-HireMatrix' : (candidateName || 'You')}
                                </div>
                                <div className="vi-bubble-text">
                                    {msg.text.split('\n').map((line, j) => (
                                        <p key={j}>{line || '\u00A0'}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Thinking indicator */}
                    {isThinking && (
                        <div className="vi-bubble vi-bubble-ai animate-in">
                            <div className="vi-bubble-avatar">🤖</div>
                            <div className="vi-bubble-content">
                                <div className="vi-bubble-name">Bit-HireMatrix</div>
                                <div className="vi-thinking-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Live transcript while listening */}
                    {isListening && (transcript || interimTranscript) && (
                        <div className="vi-bubble vi-bubble-user vi-bubble-live animate-in">
                            <div className="vi-bubble-avatar">👤</div>
                            <div className="vi-bubble-content">
                                <div className="vi-bubble-name">{candidateName || 'You'} <span className="vi-typing-label">speaking...</span></div>
                                <div className="vi-bubble-text">
                                    <p>{transcript}{interimTranscript && <span className="vi-interim">{interimTranscript}</span>}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* AI speaking indicator */}
                {isSpeaking && (
                    <div className="vi-speaking-indicator animate-in">
                        <div className="vi-waveform">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i} className="vi-wave-bar" style={{ animationDelay: `${i * 0.1}s` }}></span>
                            ))}
                        </div>
                        <span>AI is speaking...</span>
                        <button className="vi-skip-speech" onClick={() => { speechSynthesis?.cancel(); setIsSpeaking(false) }}>Skip ⏭️</button>
                    </div>
                )}

                {/* Input area */}
                <div className="vi-input-area glass">
                    {useTextMode ? (
                        <div className="vi-text-input-row">
                            <textarea
                                className="vi-text-input"
                                rows={2}
                                placeholder="Type your answer..."
                                value={textInput}
                                onChange={e => setTextInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isThinking || isSpeaking}
                            />
                            <button
                                className="btn-primary vi-send-btn"
                                onClick={handleTextSubmit}
                                disabled={!textInput.trim() || isThinking || isSpeaking}
                            >
                                Send →
                            </button>
                        </div>
                    ) : (
                        <div className="vi-voice-controls">
                            <div className="vi-mic-area">
                                <button
                                    className={`vi-mic-btn ${isListening ? 'listening' : ''} ${isSpeaking || isThinking ? 'disabled' : ''}`}
                                    onClick={handleMicToggle}
                                    disabled={isSpeaking || isThinking}
                                    title={isListening ? 'Stop & Submit' : 'Start Speaking'}
                                >
                                    <span className="vi-mic-icon">{isListening ? '⏹️' : '🎤'}</span>
                                    {isListening && <span className="vi-mic-pulse"></span>}
                                    {isListening && <span className="vi-mic-pulse vi-pulse-2"></span>}
                                </button>
                                <span className="vi-mic-label">
                                    {isListening ? 'Listening... Tap to submit' : isThinking ? 'AI is thinking...' : isSpeaking ? 'AI is speaking...' : 'Tap to answer'}
                                </span>
                            </div>
                            {/* Fallback text option */}
                            <button className="vi-mode-switch-btn" onClick={() => setUseTextMode(true)} title="Switch to text input">
                                ⌨️
                            </button>
                        </div>
                    )}

                    {useTextMode && voiceSupported && (
                        <button className="vi-mode-switch-btn vi-mode-switch-bottom" onClick={() => setUseTextMode(false)} title="Switch to voice">
                            🎤 Use Voice
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default VoiceInterview
