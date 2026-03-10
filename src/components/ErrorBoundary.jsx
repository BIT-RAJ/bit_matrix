import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
        if (this.props.onReset) this.props.onReset()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-boundary-content glass">
                        <div className="error-boundary-icon">💥</div>
                        <h2>Something went wrong</h2>
                        <p className="error-boundary-msg">
                            {this.state.error?.message || 'An unexpected error occurred'}
                        </p>
                        <div className="error-boundary-actions">
                            <button className="btn-primary" onClick={this.handleReset}>
                                🔄 Try Again
                            </button>
                            <button className="btn-secondary" onClick={() => window.location.reload()}>
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
