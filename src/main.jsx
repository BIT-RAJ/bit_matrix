import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
                console.log('[PWA] Service worker registered:', registration.scope)

                // Check for updates every 60 seconds
                setInterval(() => registration.update(), 60 * 1000)

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
                                console.log('[PWA] New version available — refresh to update.')
                            }
                        })
                    }
                })
            },
            (err) => console.warn('[PWA] Service worker registration failed:', err)
        )
    })
}
