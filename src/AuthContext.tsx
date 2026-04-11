import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, store } from './db'

// Detect mobile/tablet — these browsers block popups, so we use redirect flow
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Key we store in sessionStorage to know we intentionally started a redirect
const REDIRECT_KEY = 'orbit_google_redirect_pending'

/** Translate Firebase auth error codes into plain English. */
function friendlyError(code: string, fallback: string): string {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again.'
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Try allowing pop-ups for this site, or use email sign-in.'
    case 'auth/cancelled-popup-request':
    case 'auth/popup-closed-by-user':
      return '' // silent — user deliberately cancelled
    default:
      return fallback
  }
}

interface AuthContextType {
  user: User | null
  loading: boolean
  /** True while Google sign-in is in progress (popup opening or redirect) */
  googleLoading: boolean
  /** True while we're completing a mobile redirect back from Google */
  completingRedirect: boolean
  authError: string | null
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)
const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // True only when returning from a Google redirect (we set the SS flag before
  // calling signInWithRedirect). This drives a "Completing sign-in…" banner.
  const returningFromRedirect = isMobile &&
    sessionStorage.getItem(REDIRECT_KEY) === 'true'
  const [completingRedirect, setCompletingRedirect] = useState(returningFromRedirect)

  useEffect(() => {
    // On mobile: check for a pending redirect result. We only show the
    // "completing" state if we previously set the sessionStorage flag,
    // avoiding a false spinner on every fresh page load.
    if (isMobile) {
      if (returningFromRedirect) {
        setGoogleLoading(true)
      }

      getRedirectResult(auth)
        .then(result => {
          if (result?.user) {
            // onAuthStateChanged will pick up the user — nothing extra needed
          }
        })
        .catch((e: any) => {
          const msg = friendlyError(e.code, e.message)
          if (msg) setAuthError(msg)
        })
        .finally(() => {
          sessionStorage.removeItem(REDIRECT_KEY)
          setGoogleLoading(false)
          setCompletingRedirect(false)
        })
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loginWithGoogle() {
    if (googleLoading) return // block double-clicks
    setAuthError(null)
    setGoogleLoading(true)

    try {
      if (isMobile) {
        // Mark that we're starting a redirect so the returning page load knows
        // to show "Completing sign-in…" rather than the normal login form
        sessionStorage.setItem(REDIRECT_KEY, 'true')
        await signInWithRedirect(auth, googleProvider)
        // Page navigates away — code below never runs on mobile
      } else {
        await signInWithPopup(auth, googleProvider)
        setGoogleLoading(false)
      }
    } catch (e: any) {
      sessionStorage.removeItem(REDIRECT_KEY)
      const msg = friendlyError(e.code, e.message)
      if (msg) setAuthError(msg)
      setGoogleLoading(false)
    }
  }

  async function loginWithEmail(email: string, password: string) {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e: any) {
      throw new Error(friendlyError(e.code, e.message))
    }
  }

  async function signupWithEmail(email: string, password: string, displayName: string) {
    const trimmedName = displayName.trim()
    if (!trimmedName) throw new Error('Display name cannot be empty.')
    if (trimmedName.length > 50) throw new Error('Display name must be 50 characters or fewer.')
    if (password.length < 6) throw new Error('Password must be at least 6 characters.')
    if (password.length > 128) throw new Error('Password must be 128 characters or fewer.')
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(cred.user, { displayName: trimmedName })
      await setDoc(doc(store, 'users', cred.user.uid), {
        displayName: trimmedName,
        photoURL: null,
        email: cred.user.email,
      }, { merge: true })
      setUser({ ...cred.user, displayName: trimmedName } as User)
    } catch (e: any) {
      // Re-throw our own validation errors directly; translate Firebase errors
      if (e.message && !e.code) throw e
      throw new Error(friendlyError(e.code, e.message))
    }
  }

  async function logout() {
    await signOut(auth)
  }

  function clearAuthError() {
    setAuthError(null)
  }

  return (
    <AuthContext.Provider value={{
      user, loading, googleLoading, completingRedirect,
      authError, loginWithGoogle, loginWithEmail, signupWithEmail,
      logout, clearAuthError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
