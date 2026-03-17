/**
 * JoinRoom — handles /join/:slug invite links
 *
 * Flow:
 *   Authenticated user  → join the room (if not already a member), then redirect to app
 *   Unauthenticated user → save slug to sessionStorage, redirect to login (/),
 *                          MainApp picks up pendingRoom on mount after login completes
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { useRooms, joinRoom } from './db'
import { FiDisc } from 'react-icons/fi'

function JoinRoom() {
  const { slug } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { rooms, loading: roomsLoading } = useRooms()
  const [status, setStatus] = useState('loading') // 'loading' | 'joining' | 'error' | 'notfound'
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (authLoading || roomsLoading) return

    // Unauthenticated — save intent and send to login
    if (!user) {
      sessionStorage.setItem('pendingRoom', slug)
      navigate('/', { replace: true })
      return
    }

    const room = rooms.find(r => r.slug === slug)

    if (!room) {
      setStatus('notfound')
      return
    }

    const alreadyMember = room.members?.includes(user.uid)

    if (alreadyMember) {
      sessionStorage.setItem('pendingRoom', slug)
      navigate('/', { replace: true })
      return
    }

    setStatus('joining')
    joinRoom(room.id, user.uid)
      .then(() => {
        sessionStorage.setItem('pendingRoom', slug)
        navigate('/', { replace: true })
      })
      .catch(err => {
        setErrorMsg(err.message)
        setStatus('error')
      })
  }, [user, authLoading, rooms, roomsLoading, slug, navigate])

  if (status === 'notfound') {
    return (
      <Screen>
        <p className="text-slate-400 text-sm">Room <span className="text-white font-mono">#{slug}</span> not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors">
          Go to Orbit
        </button>
      </Screen>
    )
  }

  if (status === 'error') {
    return (
      <Screen>
        <p className="text-red-400 text-sm">{errorMsg}</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors">
          Go to Orbit
        </button>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm mt-3">
        {status === 'joining' ? `Joining #${slug}...` : 'Loading...'}
      </p>
    </Screen>
  )
}

function Screen({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-2 p-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4">
        <FiDisc size={22} className="text-white" />
      </div>
      {children}
    </div>
  )
}

export default JoinRoom
