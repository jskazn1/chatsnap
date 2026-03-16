import { useState } from 'react'
import { useAuth } from './AuthContext'
import { FcGoogle } from 'react-icons/fc'
import { MdEmail } from 'react-icons/md'
import { FiZap } from 'react-icons/fi'

function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, authError } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const displayError = error || authError

  const inputClass = 'w-full bg-slate-700/50 text-white placeholder-slate-400 border border-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors'

  async function handleGoogle() {
    setError(null)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4 shadow-lg shadow-indigo-500/30">
            <FiZap size={28} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Surge
          </h1>
          <p className="text-slate-400 mt-1">Real-time messaging, redefined</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700/50">
          {displayError && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {displayError}
            </div>
          )}

          {mode === 'login' && (
            <div className="space-y-3">
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm"
              >
                <FcGoogle size={20} />
                Continue with Google
              </button>

              <div className="relative flex items-center py-1">
                <div className="flex-1 border-t border-slate-600" />
                <span className="mx-4 text-slate-500 text-sm">or</span>
                <div className="flex-1 border-t border-slate-600" />
              </div>

              <button
                onClick={() => setMode('email-login')}
                className="w-full flex items-center justify-center gap-3 bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 px-4 rounded-xl transition-colors border border-slate-600"
              >
                <MdEmail size={20} />
                Sign in with Email
              </button>

              <p className="text-center text-slate-400 text-sm pt-2">
                New to Surge?{' '}
                <button onClick={() => setMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                  Create an account
                </button>
              </p>
            </div>
          )}

          {mode === 'email-login' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-2">Welcome back</h2>
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} />
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-indigo-500/20">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-slate-400 hover:text-slate-300 text-sm transition-colors py-1">
                ← Back
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-2">Join Surge</h2>
              <input type="text" placeholder="Display name" value={name} onChange={e => setName(e.target.value)} required className={inputClass} />
              <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} />
              <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className={inputClass} />
              <button type="submit" disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-indigo-500/20">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-slate-400 hover:text-slate-300 text-sm transition-colors py-1">
                ← Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
