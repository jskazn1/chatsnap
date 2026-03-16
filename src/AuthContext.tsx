import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  onAuthStateChanged, signInWithRedirect, getRedirectResult,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, signOut, GoogleAuthProvider, User,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, store } from './db'

interface AuthContextType {
  user: User | null
  loading: boolean
  authError: string | null
  loginWithGoogle: () => Promise<void>
  loginWithEmail: (email: string, password: string) => Promise<void>
  signupWithEmail: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)
const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    let authStateResolved = false
    let redirectResolved = false

    function tryFinishLoading() {
      if (authStateResolved && redirectResolved) setLoading(false)
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      authStateResolved = true
      tryFinishLoading()
    })

    getRedirectResult(auth)
      .then((result) => { if (result?.user) setUser(result.user) })
      .catch((err) => {
        if (err.code && err.code !== 'auth/no-current-user') setAuthError(err.message)
      })
      .finally(() => {
        redirectResolved = true
        tryFinishLoading()
      })

    return unsub
  }, [])

  async function loginWithGoogle() {
    setAuthError(null)
    await signInWithRedirect(auth, googleProvider)
  }

  async function loginWithEmail(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signupWithEmail(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    // Save user profile to Firestore
    await setDoc(doc(store, 'users', cred.user.uid), {
      displayName,
      photoURL: null,
      email: cred.user.email,
    }, { merge: true })
    setUser({ ...cred.user, displayName } as User)
  }

  async function logout() { await signOut(auth) }

  return (
    <AuthContext.Provider value={{ user, loading, authError, loginWithGoogle, loginWithEmail, signupWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
