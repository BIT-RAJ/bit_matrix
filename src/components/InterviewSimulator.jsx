import { useState, useEffect } from 'react'
import { generateInterviewQuestions, gradeAnswer } from '../utils/api.js'
import { showToast } from './Toast.jsx'
import './InterviewSimulator.css'

function InterviewSimulator({ resumeText, jobRole, onBack }) {
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswers, setUserAnswers] = useState({})
    const [revealed, setRevealed] = useState({})
    const [followUpRevealed, setFollowUpRevealed] = useState({})
    const [filter, setFilter] = useState('All')
    const [completedCount, setCompletedCount] = useState(0)

    // Grading states
    const [isGrading, setIsGrading] = useState({})
    const [grades, setGrades] = useState({})

    useEffect(() => {
        fetchQuestions()
    }, [])

    const fetchQuestions = async () => {
        try {
            setLoading(true)
            setError('')
            const data = await generateInterviewQuestions(resumeText, jobRole)
            setQuestions(data.questions || [])
            setCurrentIndex(0)
            setUserAnswers({})
            setRevealed({})
            setFollowUpRevealed({})
            setCompletedCount(0)
            showToast('Interview questions generated!', 'success')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredQuestions = filter === 'All'
        ? questions
        : questions.filter(q => q.category === filter)

    const currentQ = filteredQuestions[currentIndex]

    const handleNext = () => {
        if (currentIndex < filteredQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
    }

    const toggleReveal = (id) => {
        setRevealed(prev => {
            const newState = { ...prev, [id]: !prev[id] }
            if (newState[id] && userAnswers[id]) {
                setCompletedCount(c => Math.min(c + 1, questions.length))
            }
            return newState
        })
    }

    const handleGradeAnswer = async (qId, questionText) => {
        const answer = userAnswers[qId]
        if (!answer || answer.trim().split(/\s+/).length < 5) {
            showToast('Please type a longer answer to get graded.', 'warning')
            return
        }
        try {
            setIsGrading(prev => ({ ...prev, [qId]: true }))
            const result = await gradeAnswer(questionText, answer, resumeText)
            setGrades(prev => ({ ...prev, [qId]: result }))
            showToast('Answer graded!', 'success')
            setCompletedCount(c => Math.min(c + 1, questions.length))
        } catch (err) {
            showToast(err.message, 'error')
        } finally {
            setIsGrading(prev => ({ ...prev, [qId]: false }))
        }
    }

    const toggleFollowUp = (id) => {
        setFollowUpRevealed(prev => ({ ...prev, [id]: !prev[id] }))
    }

    const handleAnswerChange = (id, val) => {
        setUserAnswers(prev => ({ ...prev, [id]: val }))
    }

    const difficultyColor = (diff) => {
        if (diff === 'Easy') return 'diff-easy'
        if (diff === 'Hard') return 'diff-hard'
        return 'diff-medium'
    }

    if (loading) {
        return (
            <div className="interview-wrapper">
                <div className="interview-loading animate-in">
                    <div className="analyzing-spinner"></div>
                    <h2>Generating Interview Questions</h2>
                    <p>Our AI is crafting personalized questions from your resume...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="interview-wrapper">
                <div className="interview-error animate-in">
                    <p className="error-message"><span>⚠️</span> {error}</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-primary" onClick={fetchQuestions}>🔄 Retry</button>
                        <button className="btn-secondary" onClick={onBack}>← Back</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="interview-wrapper">
            <div className="interview-container">
                {/* Header */}
                <div className="interview-header animate-in">
                    <div>
                        <h1 className="interview-title">🎤 Interview Simulator</h1>
                        <p className="interview-subtitle">Practice with AI-generated questions based on your resume</p>
                    </div>
                    <button className="btn-secondary" onClick={fetchQuestions}>
                        🔄 Generate New
                    </button>
                </div>

                {/* Stats */}
                <div className="interview-stats animate-in stagger-1">
                    <div className="stat-pill glass">
                        <span className="stat-pill-value">{questions.length}</span>
                        <span className="stat-pill-label">Questions</span>
                    </div>
                    <div className="stat-pill glass">
                        <span className="stat-pill-value">{Object.keys(userAnswers).filter(k => userAnswers[k]).length}</span>
                        <span className="stat-pill-label">Answered</span>
                    </div>
                    <div className="stat-pill glass">
                        <span className="stat-pill-value">{Object.keys(revealed).filter(k => revealed[k]).length}</span>
                        <span className="stat-pill-label">Reviewed</span>
                    </div>
                </div>

                {/* Category filter */}
                <div className="category-filter animate-in stagger-2">
                    {['All', 'Technical', 'Behavioral', 'Situational'].map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                            onClick={() => { setFilter(cat); setCurrentIndex(0) }}
                        >
                            {cat} {cat !== 'All' && (
                                <span className="filter-count">
                                    {questions.filter(q => q.category === cat).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Progress */}
                <div className="progress-bar-wrapper animate-in stagger-3">
                    <div className="progress-info">
                        <span>Question {currentIndex + 1} of {filteredQuestions.length}</span>
                        <span className="progress-pct">
                            {Math.round(((currentIndex + 1) / filteredQuestions.length) * 100)}%
                        </span>
                    </div>
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentIndex + 1) / filteredQuestions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question card */}
                {currentQ && (
                    <div className="question-card glass animate-in stagger-4" key={`${currentQ.id}-${currentIndex}`}>
                        <div className="question-top">
                            <div className="question-badges">
                                <span className={`badge badge-${currentQ.category.toLowerCase()}`}>
                                    {currentQ.category}
                                </span>
                                {currentQ.difficulty && (
                                    <span className={`badge ${difficultyColor(currentQ.difficulty)}`}>
                                        {currentQ.difficulty}
                                    </span>
                                )}
                            </div>
                            <span className="question-number">#{currentIndex + 1}</span>
                        </div>

                        <h2 className="question-text">{currentQ.question}</h2>

                        {/* User answer */}
                        <div className="answer-section">
                            <label className="answer-label">Your Answer</label>
                            <textarea
                                className="answer-textarea"
                                rows={5}
                                placeholder="Type your answer here to practice..."
                                value={userAnswers[currentQ.id] || ''}
                                onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                id={`answer-${currentQ.id}`}
                            />
                            {userAnswers[currentQ.id] && (
                                <div className="answer-footer">
                                    <span className="answer-word-count">
                                        {userAnswers[currentQ.id].trim().split(/\s+/).filter(Boolean).length} words
                                    </span>
                                    {!grades[currentQ.id] && (
                                        <button
                                            className="btn-primary btn-grade"
                                            onClick={() => handleGradeAnswer(currentQ.id, currentQ.question)}
                                            disabled={isGrading[currentQ.id]}
                                        >
                                            {isGrading[currentQ.id] ? '⏳ Grading...' : '✨ Grade Answer'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {grades[currentQ.id] && (
                            <div className="grade-result animate-in">
                                <div className="grade-header">
                                    <div className="grade-score" data-grade={grades[currentQ.id].grade.charAt(0)}>
                                        {grades[currentQ.id].grade} <span>({grades[currentQ.id].score}/10)</span>
                                    </div>
                                    {grades[currentQ.id].tip && <div className="grade-tip">💡 {grades[currentQ.id].tip}</div>}
                                </div>
                                <div className="grade-cols">
                                    <div className="grade-col glass">
                                        <h4 className="success-text">👍 Strengths</h4>
                                        <ul>{grades[currentQ.id].strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                    <div className="grade-col glass">
                                        <h4 className="danger-text">📉 Improvements</h4>
                                        <ul>{grades[currentQ.id].improvements.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                </div>
                                <div className="revised-answer glass">
                                    <h4>✍️ Improved Version</h4>
                                    <p>{grades[currentQ.id].revisedAnswer}</p>
                                </div>
                            </div>
                        )}

                        {/* Suggested answer */}
                        <div className="suggested-section">
                            <button
                                className="reveal-btn"
                                onClick={() => toggleReveal(currentQ.id)}
                                id={`reveal-${currentQ.id}`}
                            >
                                {revealed[currentQ.id] ? '🙈 Hide' : '👁️ Reveal'} Suggested Answer
                            </button>
                            {revealed[currentQ.id] && (
                                <div className="suggested-answer animate-in">
                                    <p>{currentQ.suggestedAnswer}</p>
                                    {currentQ.tip && (
                                        <p className="answer-tip">💡 <strong>Tip:</strong> {currentQ.tip}</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Follow-up question */}
                        {currentQ.followUp && (
                            <div className="followup-section">
                                <button
                                    className="reveal-btn followup-btn"
                                    onClick={() => toggleFollowUp(currentQ.id)}
                                >
                                    {followUpRevealed[currentQ.id] ? '🙈 Hide' : '🔗 Show'} Follow-Up Question
                                </button>
                                {followUpRevealed[currentQ.id] && (
                                    <div className="followup-content animate-in">
                                        <p className="followup-q">❓ {currentQ.followUp}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="question-nav">
                            <button
                                className="btn-secondary"
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                            >
                                ← Previous
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleNext}
                                disabled={currentIndex === filteredQuestions.length - 1}
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InterviewSimulator
