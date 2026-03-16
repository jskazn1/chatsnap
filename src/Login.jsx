import { useState } from 'react'
import { useAuth } from './AuthContext'
import { FcGoogle } from 'react-icons/fc'
import { MdEmail } from 'react-icons/md'

function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, authError } = useAuth()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'email-login'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleGoogle() {
    try {
      setError(null)
      await loginWithGoogle()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Display name is required')
          setSubmitting(false)
          return
        }
        await signupWithEmail(email, password, displayName.trim())
      } else {
        await loginWithEmail(email, password)
      }
    } catch (err) {
      const msg =
        err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : err.code === 'auth/email-already-in-use'
          ? 'An account with this email already exists'
          : err.code === 'auth/weak-password'
          ? 'Password must be at least 6 characters'
          : err.message
      setError(msg)
    }
    setSubmitting(false)
  }

  const displayError = error || authError

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ChatSnap</h1>
        <p className="login-subtitle">Real-time chat &amp; photo messaging</p>

        {displayError && <div className="login-error">{displayError}</div>}

        {mode === 'login' && (
          <>
            <button className="login-btn google-btn" onClick={handleGoogle}>
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button className="login-btn email-btn" onClick={() => setMode('email-login')}>
              <MdEmail size={20} />
              Continue with email
            </button>
            <p className="login-switch">
              Don't have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(null) }}>Sign up</button>
            </p>
          </>
        )}

        {(mode === 'email-login' || mode === 'signup') && (
          <form onSubmit={handleEmailSubmit} className="login-form">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
              />
            )}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={mode === 'email-login'}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" className="login-btn submit-btn" disabled={submitting}>
              {submitting ? '...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
            <p className="login-switch">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => { setMode('email-login'); setError(null) }}>
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => { setMode('signup'); setError(null) }}>
                    Sign up
                  </button>
                </>
              )}
            </p>
            <button
              type="button"
              className="login-back"
              onClick={() => { setMode('login'); setError(null) }}
            >
              Back to all options
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
