import { useState, useEffect } from 'react'
import './App.css'
import './media.css'
import { useRoomMessages, useDMMessages } from './db'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Profile from './Profile'
import Sidebar from './Sidebar'
import ChatView from './ChatView'
import { FiSun, FiMoon, FiLogOut, FiUser, FiMenu } from 'react-icons/fi'

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
      <AppShell />
    </AuthProvider>
  )
}

function AppShell() {
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

  return <MainApp />
}

function MainApp() {
  const { user, logout } = useAuth()
  const [theme, toggleTheme] = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeView, setActiveView] = useState({ type: 'room', id: 'home' })
  const [dmOtherUser, setDmOtherUser] = useState(null)

  const roomMessages = useRoomMessages(activeView.type === 'room' ? activeView.id : null)
  const dmMessages = useDMMessages(activeView.type === 'dm' ? activeView.id : null)

  const messages = activeView.type === 'room' ? roomMessages : dmMessages
  const name = user.displayName || user.email

  function handleSelectRoom(room) {
    setActiveView({ type: 'room', id: room })
    setShowSidebar(false)
  }

  function handleSelectDM(convoId, otherUser) {
    setActiveView({ type: 'dm', id: convoId })
    setDmOtherUser(otherUser)
    setShowSidebar(false)
  }

  if (showProfile) {
    return <Profile onClose={() => setShowProfile(false)} />
  }

  return (
    <div className="app-layout">
      <div className={`sidebar-container ${showSidebar ? 'open' : ''}`}>
        <Sidebar
          activeView={activeView}
          onSelectRoom={handleSelectRoom}
          onSelectDM={handleSelectDM}
        />
      </div>

      {showSidebar && <div className="sidebar-overlay" onClick={() => setShowSidebar(false)} />}

      <div className="main-container">
        <header>
          <button
            className="menu-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
            aria-label="Toggle sidebar"
          >
            <FiMenu />
          </button>
          <span className="header-title">ChatSnap</span>
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

        <ChatView
          messages={messages.messages}
          loading={messages.loading}
          mode={activeView.type}
          roomName={activeView.type === 'room' ? activeView.id : null}
          conversationId={activeView.type === 'dm' ? activeView.id : null}
          otherUser={dmOtherUser}
        />
      </div>
    </div>
  )
}

export default App
