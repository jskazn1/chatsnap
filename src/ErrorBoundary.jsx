import { Component } from 'react'
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi'

/**
 * ErrorBoundary — catches uncaught React render errors and shows a graceful
 * recovery screen instead of a blank page.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // Log to console in development; swap in a real monitoring service (Sentry, etc.) here
    console.error('[Orbit ErrorBoundary]', error, errorInfo)

    // Example Sentry hook (commented out until the package is installed):
    // if (typeof Sentry !== 'undefined') Sentry.captureException(error, { extra: errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="min-h-screen bg-[#0c0b10] flex items-center justify-center p-6"
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-transparent pointer-events-none" />

        <div className="relative w-full max-w-sm text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-950/50 border border-red-800/40 mb-5">
            <FiAlertTriangle size={28} className="text-red-400" />
          </div>

          <h1 className="text-xl font-semibold text-white mb-2 tracking-tight">
            Something went wrong
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Orbit hit an unexpected error. Your messages are safe — this is just
            a display glitch.
          </p>

          {/* Error detail (dev only) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mb-5 text-left bg-zinc-900/80 border border-zinc-700/50 rounded-xl p-4 overflow-auto max-h-40">
              <pre className="text-xs text-red-300 font-mono whitespace-pre-wrap break-all">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}

          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors shadow-lg shadow-violet-900/30"
          >
            <FiRefreshCw size={15} />
            Try again
          </button>

          <p className="mt-4 text-zinc-600 text-xs">
            If this keeps happening, try refreshing the page.
          </p>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
