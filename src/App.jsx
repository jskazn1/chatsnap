import { useState, useEffect, useRef, memo } from 'react'
import './App.css'
import './media.css'
import { db, storage } from './db'
import { useDB } from './db'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Profile from './Profile'
import { MdSend } from 'react-icons/md'
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom'
import { FiCamera, FiSun, FiMoon, FiLogOut, FiUser } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import { ref, uploadString } from 'firebase/storage'

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return [theme, toggleTheme]
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/:room" element={<ProtectedRoom />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

function ProtectedRoom() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-container">
        <div className="loading-screen">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <Room />
}

function Room() {
  const { room } = useParams()
  const { user, logout } = useAuth()
  const name = user.displayName || user.email
  const { messages, loading } = useDB(room)
  const [showCamera, setShowCamera] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sendError, setSendError] = useState(null)
  const messagesRef = useRef(null)
  const [theme, toggleTheme] = useTheme()

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = 0
    }
  }, [messages])

  async function takePicture(img) {
    setShowCamera(false)
    try {
      setSendError(null)
      const imgID = Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
      const storageRef = ref(storage, imgID + '.jpg')
      await uploadString(storageRef, img, 'data_url')
      await db.send({
        img: imgID,
        name,
        uid: user.uid,
        photoURL: user.photoURL || null,
        ts: new Date(),
        room,
      })
    } catch (e) {
      setSendError('Failed to send picture. Please try again.')
    }
  }

  if (showProfile) {
    return <Profile onClose={() => setShowProfile(false)} />
  }

  return (
    <div className="app-container">
      {showCamera && <Camera takePicture={takePicture} />}

      <header>
        <span className="header-title">ChatSnap</span>
        <span className="header-room"># {room}</span>
        <div className="header-spacer" />
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <FiMoon /> : <FiSun />}
        </button>
        <div className="user-info">
          <button
            className="user-avatar-btn"
            onClick={() => setShowProfile(true)}
            aria-label="Edit profile"
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="user-avatar-small" />
            ) : (
              <FiUser />
            )}
          </button>
          <span className="user-display-name">{name}</span>
          <button className="theme-toggle" onClick={logout} aria-label="Sign out">
            <FiLogOut />
          </button>
        </div>
      </header>

      <ul className="messages" ref={messagesRef}>
        {loading && <li className="status-message">Loading messages...</li>}
        {!loading && messages.length === 0 && (
          <li className="status-message">No messages yet. Say hello!</li>
        )}
        {sendError && <li className="status-message error">{sendError}</li>}
        {messages.map((m) => (
          <Message key={m.id} m={m} currentUid={user.uid} currentName={name} />
        ))}
      </ul>

      <TextInput
        showCamera={() => setShowCamera(true)}
        onSend={async (text) => {
          try {
            setSendError(null)
            await db.send({
              text,
              name,
              uid: user.uid,
              photoURL: user.photoURL || null,
              ts: new Date(),
              room,
            })
          } catch (e) {
            setSendError('Failed to send message. Please try again.')
          }
        }}
      />
    </div>
  )
}

const bucket =
  'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
const suffix = '.jpg?alt=media'

const Message = memo(function Message({ m, currentUid, currentName }) {
  const isMe = m.uid ? m.uid === currentUid : m.name === currentName
  return (
    <li className="message-wrap" data-from={isMe ? 'me' : 'you'}>
      {!isMe && (
        <div className="msg-avatar">
          {m.photoURL ? (
            <img src={m.photoURL} alt="" />
          ) : (
            <span>{m.name ? m.name[0].toUpperCase() : '?'}</span>
          )}
        </div>
      )}
      <div className="message">
        {!isMe && <div className="msg-name">{m.name}</div>}
        <div className="msg-text">
          {m.text}
          {m.img && <img src={bucket + m.img + suffix} alt={m.name + "'s photo"} />}
        </div>
      </div>
    </li>
  )
})

function TextInput(props) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  return (
    <div className="text-input">
      <button
        onClick={props.showCamera}
        aria-label="Take a picture"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        <FiCamera style={{ height: 15, width: 15 }} />
      </button>
      <input
        ref={inputRef}
        value={text}
        aria-label="Message text"
        placeholder="Write your message"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text) {
            props.onSend(text)
            setText('')
          }
        }}
      />
      <button
        className="send-logo"
        aria-label="Send message"
        onClick={() => {
          if (text) {
            props.onSend(text)
          }
          setText('')
          inputRef.current && inputRef.current.focus()
        }}
        disabled={!text}
      >
        <MdSend />
      </button>
    </div>
  )
}

export default App
