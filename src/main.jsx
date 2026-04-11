import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

// Global error monitoring — catches unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  console.error('[Orbit] Unhandled promise rejection:', event.reason)
  // Swap in Sentry.captureException(event.reason) here when ready
})

// When Firebase opens the Google sign-in popup, it points to /__/auth/handler.
// Our SPA rewrite serves index.html at that path. We need Firebase's SDK to
// initialise (it does so via the db.ts import chain) but we must NOT render
// the full app UI — doing so causes the login page to appear inside the popup
// and the OAuth flow never reaches Google.
if (window.location.pathname.startsWith('/__/')) {
  // Just initialise Firebase (side-effect of the import) and render nothing.
  // Firebase's auth SDK detects the URL params, processes the OAuth callback,
  // postMessages the result back to the opener, and closes the popup itself.
  import('./db')
  createRoot(document.getElementById('root')).render(<></>)
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
