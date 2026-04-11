import { useState } from 'react'
import { useAuth } from './AuthContext'
import { FcGoogle } from 'react-icons/fc'
import { MdEmail } from 'react-icons/md'
import { FiDisc, FiArrowLeft } from 'react-icons/fi'

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

function Spinner({ size = 20, color = 'border-slate-400' }) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`border-2 ${color} border-t-transparent rounded-full animate-spin flex-shrink-0`}
    />
  )
}

// MD3-style filled button (primary action)
function FilledButton({ children, onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2.5 rounded-full py-3 px-6 font-medium text-sm tracking-wide transition-all duration-200
        bg-violet-500 text-slate-950 hover:bg-violet-400 active:bg-violet-600
        disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
        shadow-md hover:shadow-violet-500/25 hover:shadow-lg
        ${className}`}
    >
      {children}
    </button>
  )
}

// MD3-style tonal button (secondary action)
function TonalButton({ children, onClick, type = 'button', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-2.5 rounded-full py-3 px-6 font-medium text-sm tracking-wide transition-all duration-200
        bg-violet-950/60 text-violet-300 hover:bg-violet-900/70 active:bg-violet-900 border border-violet-800/50
        disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

// MD3-style outlined input field
function InputField({ type, placeholder, value, onChange, required, autoComplete, minLength }) {
  return (
    <div className="relative">
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        minLength={minLength}
        className="w-full bg-slate-800/70 text-white placeholder-slate-500 border border-slate-600
          rounded-2xl px-4 py-3.5 text-sm
          focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/50
          hover:border-slate-500 transition-all duration-150"
      />
    </div>
  )
}

function Login() {
  const {
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    authError,
    googleLoading,
    completingRedirect,
    clearAuthError,
  } = useAuth()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const displayError = error || authError

  function switchMode(next) {
    setMode(next)
    setError(null)
    clearAuthError()
  }

  async function handleGoogle() {
    setError(null)
    clearAuthError()
    try { await loginWithGoogle() } catch (e) { setError(e.message) }
  }

  async function handleEmailLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try { await loginWithEmail(email, password) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try { await signupWithEmail(email, password, name) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  // Full-screen "completing sign-in" overlay
  if (completingRedirect) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-5 p-4">
        {/* Scrim gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-slate-950 to-slate-950 pointer-events-none" />
        <div className="relative flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <FiDisc size={30} className="text-white" />
          </div>
          <Spinner size={28} color="border-violet-400" />
          <p className="text-white text-base font-medium">Completing sign-in…</p>
          <p className="text-slate-400 text-sm">Just a moment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* MD3-style background scrim / ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Brand lockup */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[20px] bg-gradient-to-br from-violet-400 to-purple-500 mb-5 shadow-xl shadow-violet-500/30">
            <FiDisc size={30} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Orbit
          </h1>
          <p className="text-slate-400 mt-1.5 text-sm">Every bit, in orbit.</p>
        </div>

        {/* MD3 Surface container — elevated */}
        <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 pt-6 pb-7 space-y-4">

            {/* Error banner */}
            {displayError && (
              <div role="alert" aria-live="assertive" className="p-3 bg-red-950/60 border border-red-800/50 rounded-2xl text-red-300 text-sm leading-snug">
                {displayError}
              </div>
            )}

            {/* ── Main login options ── */}
            {mode === 'login' && (
              <div className="space-y-3">
                {/* Google — filled white (MD3 "filled tonal" on light surface) */}
                <button
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 rounded-full py-3 px-6 font-medium text-sm tracking-wide transition-all duration-200
                    bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200
                    disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
                    shadow-sm"
                >
                  {googleLoading ? <Spinner size={18} color="border-slate-500" /> : <FcGoogle size={18} />}
                  {googleLoading
                    ? (isMobile ? 'Redirecting to Google…' : 'Opening sign-in window…')
                    : 'Continue with Google'}
                </button>

                {googleLoading && (
                  <p className="text-center text-slate-500 text-xs px-2 leading-relaxed">
                    {isMobile
                      ? "You'll be taken to Google to sign in, then brought back here."
                      : "A sign-in window should appear. Check your taskbar if it's not visible."}
                  </p>
                )}
                {!googleLoading && isMobile && (
                  <p className="text-center text-slate-600 text-xs px-2 leading-relaxed">
                    Tapping Google will redirect you to sign in, then return you here.
                  </p>
                )}

                {/* Divider */}
                <div className="relative flex items-center py-1">
                  <div className="flex-1 border-t border-slate-800" />
                  <span className="mx-4 text-slate-500 text-xs font-medium uppercase tracking-widest">or</span>
                  <div className="flex-1 border-t border-slate-800" />
                </div>

                <TonalButton onClick={() => switchMode('email-login')}>
                  <MdEmail size={18} />
                  Sign in with Email
                </TonalButton>

                <p className="text-center text-slate-500 text-sm pt-1">
                  New to Orbit?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                  >
                    Create an account
                  </button>
                </p>
              </div>
            )}

            {/* ── Email login ── */}
            {mode === 'email-login' && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <h2 className="text-base font-semibold text-white mb-1">Welcome back</h2>
                <InputField
                  type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email"
                />
                <InputField
                  type="password" placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
                />
                <FilledButton type="submit" disabled={loading}>
                  {loading && <Spinner size={16} color="border-slate-900" />}
                  {loading ? 'Signing in…' : 'Sign In'}
                </FilledButton>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors py-1"
                >
                  <FiArrowLeft size={14} /> Back
                </button>
              </form>
            )}

            {/* ── Sign up ── */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-3">
                <h2 className="text-base font-semibold text-white mb-1">Join Orbit</h2>
                <InputField
                  type="text" placeholder="Display name" value={name}
                  onChange={e => setName(e.target.value)} required autoComplete="name"
                  maxLength={50}
                />
                <InputField
                  type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} required autoComplete="email"
                />
                <InputField
                  type="password" placeholder="Password (6–128 characters)" value={password}
                  onChange={e => setPassword(e.target.value)} required minLength={6} maxLength={128} autoComplete="new-password"
                />
                <FilledButton type="submit" disabled={loading}>
                  {loading && <Spinner size={16} color="border-slate-900" />}
                  {loading ? 'Creating account…' : 'Create Account'}
                </FilledButton>
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full flex items-center justify-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition-colors py-1"
                >
                  <FiArrowLeft size={14} /> Back
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-xs mt-6">
          By signing in you agree to use this app responsibly.
        </p>
      </div>
    </div>
  )
}

export default Login
