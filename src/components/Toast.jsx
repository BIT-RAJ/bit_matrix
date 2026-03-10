import { useState, useEffect, useCallback } from 'react'
import './Toast.css'

let toastIdCounter = 0
let addToastFn = null

// Global function to show toasts from anywhere
export function showToast(message, type = 'info', duration = 3000) {
    if (addToastFn) {
        addToastFn({ id: ++toastIdCounter, message, type, duration })
    }
}

function Toast() {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((toast) => {
        setToasts(prev => [...prev, toast])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id))
        }, toast.duration)
    }, [])

    useEffect(() => {
        addToastFn = addToast
        return () => { addToastFn = null }
    }, [addToast])

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <div className="toast-container" id="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type} animate-in`}
                    onClick={() => removeToast(toast.id)}
                >
                    <span className="toast-icon">
                        {toast.type === 'success' ? '✅' :
                            toast.type === 'error' ? '❌' :
                                toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
                </div>
            ))}
        </div>
    )
}

export default Toast
