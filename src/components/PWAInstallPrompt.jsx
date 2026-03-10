import { useState, useEffect } from 'react'
import './PWAInstallPrompt.css'

let deferredPrompt = null

// Capture the install prompt globally before React mounts
if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        deferredPrompt = e
        // Dispatch custom event so the component can pick it up
        window.dispatchEvent(new Event('pwa-installable'))
    })
}

function PWAInstallPrompt() {
    const [show, setShow] = useState(false)
    const [installing, setInstalling] = useState(false)
    const [installed, setInstalled] = useState(false)

    useEffect(() => {
        // Check if already dismissed or installed
        const dismissed = localStorage.getItem('pwa_install_dismissed')
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches
            || window.navigator.standalone === true

        if (isStandalone || dismissed === 'true') return

        // If prompt was already captured before component mounted
        if (deferredPrompt) {
            setShow(true)
            return
        }

        const handleInstallable = () => {
            if (!localStorage.getItem('pwa_install_dismissed')) {
                setShow(true)
            }
        }

        window.addEventListener('pwa-installable', handleInstallable)

        // Listen for successful install
        window.addEventListener('appinstalled', () => {
            setInstalled(true)
            setTimeout(() => setShow(false), 2500)
            deferredPrompt = null
        })

        return () => {
            window.removeEventListener('pwa-installable', handleInstallable)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        setInstalling(true)
        try {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            if (outcome === 'accepted') {
                setInstalled(true)
                setTimeout(() => setShow(false), 2500)
            } else {
                setShow(false)
            }
        } catch {
            setShow(false)
        }
        deferredPrompt = null
        setInstalling(false)
    }

    const handleDismiss = () => {
        setShow(false)
        localStorage.setItem('pwa_install_dismissed', 'true')
    }

    if (!show) return null

    return (
        <div className="pwa-overlay" onClick={handleDismiss}>
            <div className="pwa-popup glass animate-in" onClick={(e) => e.stopPropagation()}>
                {installed ? (
                    <div className="pwa-installed">
                        <div className="pwa-installed-icon">✅</div>
                        <h3>App Installed!</h3>
                        <p>ResumeAI Pro has been added to your device.</p>
                    </div>
                ) : (
                    <>
                        <button className="pwa-close" onClick={handleDismiss} aria-label="Close">×</button>
                        <div className="pwa-icon-wrapper">
                            <div className="pwa-app-icon">
                                <span>&#9883;</span>
                            </div>
                        </div>
                        <h3 className="pwa-title">Install ResumeAI Pro</h3>
                        <p className="pwa-desc">
                            Add this app to your home screen for quick access, offline support, and a native app experience.
                        </p>
                        <div className="pwa-features">
                            <div className="pwa-feature">
                                <span className="pwa-feature-icon">⚡</span>
                                <span>Faster loading</span>
                            </div>
                            <div className="pwa-feature">
                                <span className="pwa-feature-icon">📱</span>
                                <span>Works offline</span>
                            </div>
                            <div className="pwa-feature">
                                <span className="pwa-feature-icon">🔔</span>
                                <span>Native feel</span>
                            </div>
                        </div>
                        <div className="pwa-actions">
                            <button
                                className="pwa-install-btn"
                                onClick={handleInstall}
                                disabled={installing}
                            >
                                {installing ? '⏳ Installing...' : '📲 Install App'}
                            </button>
                            <button className="pwa-dismiss-btn" onClick={handleDismiss}>
                                Not now
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default PWAInstallPrompt
