import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from './db'

const AuthContext = createContext(null)

const googleProvider = new GoogleAuthProvider()

// Check if we received a Chrome extension OAuth token via URL params
function getChromeToken() {
  const params = new URLSearchParams(window.location.search)
  return params.get('chromeToken')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  // Auto-sign-in if a Chrome extension token is present
  useEffect(() => {
    const token = getChromeToken()
    if (token && !user) {
      const credential = GoogleAuthProvider.credential(null, token)
      signInWithCredential(auth, credential).catch((err) => {
        console.error('Chrome extension auth failed:', err)
      })
      // Clean the URL so the token isn't lingering
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider)
  }

  async function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signupWithEmail(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    setUser({ ...cred.user })
    return cred
  }

  async function logout() {
    await signOut(auth)
  }

  const value = {
    user,
    loading,
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
