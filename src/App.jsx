import { useState, useEffect } from 'react'
import { useRoomMessages, useDMMessages } from './db'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Profile from './Profile'
import Sidebar from './Sidebar'
import ChatView from './ChatView'
import RoomDirectory from './RoomDirectory'
import { FiSun, FiMoon, FiLogOut, FiUser, FiMenu, FiBell, FiBellOff } from 'react-icons/fi'
import { requestNotificationPermission, onForegroundMessage } from './notifications'

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return { theme, toggleTheme }
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
  if (loading) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading Surge...</span>
      </div>
    </div>
  )
  if (!user) return <Login />
  return <MainApp />
}

function MainApp() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showDirectory, setShowDirectory] = useState(false)
  const [activeView, setActiveView] = useState({ type: 'home' })
  const [dmOtherUser, setDmOtherUser] = useState(null)
  const [notifEnabled, setNotifEnabled] = useState(Notification?.permission === 'granted')

  useEffect(() => {
    const unsub = onForegroundMessage(payload => {
      const { title, body } = payload.notification || {}
      if (Notification?.permission === 'granted' && body) new Notification(title || 'Surge', { body })
    })
    return unsub
  }, [])

  async function toggleNotifications() {
    if (notifEnabled) return
    const success = await requestNotificationPermission(user.uid)
    setNotifEnabled(success)
  }

  const { messages: roomMessages, loading: roomLoading } = useRoomMessages(activeView.type === 'room' ? activeView.room : null)
  const { messages: dmMessages, loading: dmLoading } = useDMMessages(activeView.type === 'dm' ? activeView.convoId : null)
  const messages = activeView.type === 'room' ? roomMessages : dmMessages
  const messagesLoading = activeView.type === 'room' ? roomLoading : dmLoading

  const name = user.displayName || user.email

  function handleSelectRoom(room) {
    setActiveView({ type: 'room', room })
    setShowSidebar(false)
  }

  function handleSelectDM(convoId, otherUser) {
    setActiveView({ type: 'dm', convoId })
    setDmOtherUser(otherUser)
    setShowSidebar(false)
  }

  if (showProfile) return <Profile onClose={() => setShowProfile(false)} />

  return (
    <div className="h-screen flex bg-slate-900 text-white overflow-hidden">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200 lg:relative lg:translate-x-0 lg:flex lg:flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeView={activeView}
          onSelectRoom={handleSelectRoom}
          onSelectDM={handleSelectDM}
          onOpenDirectory={() => { setShowDirectory(true); setShowSidebar(false) }}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={20} />
          </button>

          <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Surge
          </span>

          <div className="flex-1" />

          <button
            onClick={toggleNotifications}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={notifEnabled ? 'Notifications on' : 'Enable notifications'}
            title={notifEnabled ? 'Notifications on' : 'Enable notifications'}
          >
            {notifEnabled ? <FiBell size={18} /> : <FiBellOff size={18} />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Edit profile"
          >
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
              : <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center"><FiUser size={14} /></div>
            }
            <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate">{name}</span>
          </button>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
            aria-label="Sign out"
          >
            <FiLogOut size={18} />
          </button>
        </header>

        {/* Chat area */}
        <ChatView
          messages={messages}
          loading={messagesLoading}
          mode={activeView.type}
          roomName={activeView.type === 'room' ? activeView.room : null}
          conversationId={activeView.type === 'dm' ? activeView.convoId : null}
          otherUser={dmOtherUser}
        />
      </div>

      {/* Room directory modal */}
      {showDirectory && (
        <RoomDirectory
          onClose={() => setShowDirectory(false)}
          onJoinRoom={slug => { handleSelectRoom(slug); setShowDirectory(false) }}
        />
      )}
    </div>
  )
}

export default App
