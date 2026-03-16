import { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from './db'

const AuthContext = createContext(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let authStateResolved = false
    let redirectResolved = false

    function tryFinishLoading() {
      if (authStateResolved && redirectResolved) {
        setLoading(false)
      }
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      authStateResolved = true
      tryFinishLoading()
    })

    // Wait for redirect result before marking as loaded
    // This prevents briefly showing the login page after Google redirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) setUser(result.user)
      })
      .catch((err) => {
        if (err.code && err.code !== 'auth/no-current-user') {
          setAuthError(err.message)
        }
      })
      .finally(() => {
        redirectResolved = true
        tryFinishLoading()
      })

    return unsub
  }, [])

  async function loginWithGoogle() {
    setAuthError(null)
    return signInWithRedirect(auth, googleProvider)
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
    authError,
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
