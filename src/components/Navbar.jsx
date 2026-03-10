import './Navbar.css'

function Navbar({ page, onReset, onBackToResults, theme, toggleTheme }) {
    return (
        <nav className="navbar glass" id="main-navbar">
            <div className="navbar-inner">
                <button className="navbar-brand" onClick={onReset} id="nav-logo">
                    <span className="brand-icon">&#9883;</span>
                    <span className="brand-text">ResumeAI</span>
                    <span className="brand-pro">Pro</span>
                </button>

                <div className="navbar-actions">
                    <button className="theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} id="theme-toggle">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {(page === 'interview' || page === 'coverletter' || page === 'tools') && (
                        <button className="btn-secondary" onClick={onBackToResults} id="nav-back-results">
                            ← Results
                        </button>
                    )}
                    {page !== 'upload' && page !== 'analyzing' && (
                        <button className="btn-secondary" onClick={onReset} id="nav-new-analysis">
                            + New Analysis
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default Navbar
