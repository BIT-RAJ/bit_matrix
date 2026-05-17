import { useState, useCallback, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import Toast from './components/Toast.jsx'
import Navbar from './components/Navbar.jsx'
import Landing from './components/Landing.jsx'
import AnalysisResults from './components/AnalysisResults.jsx'
import InterviewSimulator from './components/InterviewSimulator.jsx'
import CoverLetter from './components/CoverLetter.jsx'
import ToolsHub from './components/ToolsHub.jsx'
import VoiceInterview from './components/VoiceInterview.jsx'
import AnimatedBackground from './components/AnimatedBackground.jsx'
import PWAInstallPrompt from './components/PWAInstallPrompt.jsx'
import { saveToHistory, getTheme, setTheme } from './utils/api.js'
import './App.css'

function App() {
    // Pages: upload | analyzing | results | interview | coverletter | tools | voiceinterview
    const [page, setPage] = useState('upload')
    const [resumeText, setResumeText] = useState('')
    const [jobRole, setJobRole] = useState('')
    const [analysis, setAnalysis] = useState(null)
    const [error, setError] = useState('')
    const [theme, setThemeState] = useState(getTheme())

    useEffect(() => {
        setTheme(theme)
    }, [theme])

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark'
        setThemeState(next)
    }

    const handleAnalysisComplete = useCallback((data) => {
        setAnalysis(data)
        setPage('results')
        saveToHistory({
            jobRole,
            overallScore: data.overallScore,
            atsScore: data.atsScore,
            scoreSummary: data.scoreSummary,
            resumePreview: resumeText.substring(0, 200),
        })
    }, [jobRole, resumeText])

    const handleStartInterview = () => setPage('interview')
    const handleStartCoverLetter = () => setPage('coverletter')
    const handleStartTools = () => setPage('tools')
    const handleStartVoiceInterview = () => setPage('voiceinterview')
    const handleBackToResults = () => setPage('results')

    const handleReset = () => {
        setResumeText('')
        setJobRole('')
        setAnalysis(null)
        setError('')
        setPage('upload')
    }

    return (
        <ErrorBoundary onReset={handleReset}>
            <AnimatedBackground />
            <Navbar
                page={page}
                onReset={handleReset}
                onBackToResults={handleBackToResults}
                theme={theme}
                toggleTheme={toggleTheme}
            />
            <main className="app-main">
                <div className={`page-transition ${page}`}>
                    {(page === 'upload' || page === 'analyzing') && (
                        <Landing
                            page={page}
                            setPage={setPage}
                            resumeText={resumeText}
                            setResumeText={setResumeText}
                            jobRole={jobRole}
                            setJobRole={setJobRole}
                            onAnalysisComplete={handleAnalysisComplete}
                            error={error}
                            setError={setError}
                        />
                    )}
                    {page === 'results' && (
                        <AnalysisResults
                            analysis={analysis}
                            resumeText={resumeText}
                            onStartInterview={handleStartInterview}
                            onStartCoverLetter={handleStartCoverLetter}
                            onStartTools={handleStartTools}
                            onStartVoiceInterview={handleStartVoiceInterview}
                        />
                    )}
                    {page === 'interview' && (
                        <InterviewSimulator
                            resumeText={resumeText}
                            jobRole={jobRole}
                            onBack={handleBackToResults}
                        />
                    )}
                    {page === 'coverletter' && (
                        <CoverLetter
                            resumeText={resumeText}
                            jobRole={jobRole}
                            onBack={handleBackToResults}
                        />
                    )}
                    {page === 'tools' && (
                        <ToolsHub
                            resumeText={resumeText}
                            jobRole={jobRole}
                            onBack={handleBackToResults}
                            onStartVoiceInterview={handleStartVoiceInterview}
                        />
                    )}
                    {page === 'voiceinterview' && (
                        <VoiceInterview
                            resumeText={resumeText}
                            jobRole={jobRole}
                            onBack={handleBackToResults}
                        />
                    )}
                </div>
            </main>
            <Toast />
            <PWAInstallPrompt />
        </ErrorBoundary>
    )
}

export default App
