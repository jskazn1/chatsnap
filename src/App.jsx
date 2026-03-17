import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useDMMessages, useRoomMessages, useRooms, useConversations, useRoomMeta, useUnreadCounts, markChannelAsRead } from './db'
import { AuthProvider, useAuth } from './AuthContext'
import Login from './Login'
import Sidebar from './Sidebar'
import ChatView from './ChatView'
import PWAInstallPrompt from './PWAInstallPrompt'
import { FiSun, FiMoon, FiLogOut, FiUser, FiMenu, FiBell, FiBellOff, FiSettings } from 'react-icons/fi'
import { requestNotificationPermission, onForegroundMessage } from './notifications'

// Lazy-load heavy route-level components to reduce initial bundle size
const Profile = lazy(() => import('./Profile'))
const RoomDirectory = lazy(() => import('./RoomDirectory'))
const JoinRoom = lazy(() => import('./JoinRoom'))
const Settings = lazy(() => import('./Settings'))

function useTheme() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return { theme, toggleTheme }
}

// Full-screen spinner used as Suspense fallback for lazy-loaded routes
function PageSpinner() {
  return (
    <div className="h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

// Redirect to login if not authenticated; otherwise render children
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageSpinner />
  if (!user) return <Login />
  return children
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            <Route path="/join/:slug" element={<JoinRoom />} />
            <Route path="/settings"   element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/profile"    element={<ProtectedRoute><Profile onClose={() => window.history.back()} /></ProtectedRoute>} />
            <Route path="*"           element={<AppShell />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AppShell() {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="h-screen bg-slate-900 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400 text-sm">Loading Orbit...</span>
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
  const [activeView, setActiveView] = useState({ type: 'room', room: 'home' })
  const [dmOtherUser, setDmOtherUser] = useState(null)
  const [notifEnabled, setNotifEnabled] = useState(Notification?.permission === 'granted')
  const navigate = useNavigate()

  // Lifted data hooks
  const { rooms, loading: roomsLoading } = useRooms()
  const { convos, loading: convosLoading } = useConversations(user.uid)
  const roomMeta = useRoomMeta()
  const userReads = useUnreadCounts(user.uid)

  // Compute unread map: channelId → true if there's an unread message
  const unreadMap = useMemo(() => {
    const map = {}
    // Check rooms
    rooms.forEach(room => {
      const lastMsg = roomMeta[room.slug] ?? 0
      const lastRead = userReads[room.slug] ?? 0
      if (lastMsg > lastRead) map[room.slug] = true
    })
    // Check DMs
    convos.forEach(convo => {
      const lastMsg = convo.lastAt?.toMillis?.() ?? 0
      const lastRead = userReads[convo.id] ?? 0
      if (lastMsg > lastRead) map[convo.id] = true
    })
    return map
  }, [rooms, convos, roomMeta, userReads])

  // Handle pending room from invite link (set by JoinRoom before auth redirect)
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingRoom')
    if (pending) {
      sessionStorage.removeItem('pendingRoom')
      setActiveView({ type: 'room', room: pending })
    }
  }, [])

  useEffect(() => {
    const unsub = onForegroundMessage(payload => {
      const { title, body } = payload.notification || {}
      if (Notification?.permission === 'granted' && body) new Notification(title || 'Orbit', { body })
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
    markChannelAsRead(user.uid, room).catch(() => {})
  }

  function handleSelectDM(convoId, otherUser) {
    setActiveView({ type: 'dm', convoId })
    setDmOtherUser(otherUser)
    setShowSidebar(false)
    markChannelAsRead(user.uid, convoId).catch(() => {})
  }

  if (showProfile) return (
    <Suspense fallback={<PageSpinner />}>
      <Profile onClose={() => setShowProfile(false)} />
    </Suspense>
  )

  return (
    <div className="h-screen flex bg-slate-950 text-white overflow-hidden">
      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setShowSidebar(false)}
          onKeyDown={e => e.key === 'Escape' && setShowSidebar(false)}
          role="presentation"
          aria-label="Close sidebar"
          tabIndex={-1}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 transform transition-transform duration-200 lg:relative lg:translate-x-0 lg:flex lg:flex-col ${showSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          activeView={activeView}
          rooms={rooms}
          roomsLoading={roomsLoading}
          convos={convos}
          convosLoading={convosLoading}
          unreadMap={unreadMap}
          onSelectRoom={handleSelectRoom}
          onSelectDM={handleSelectDM}
          onOpenDirectory={() => { setShowDirectory(true); setShowSidebar(false) }}
        />
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* MD3 Top App Bar */}
        <header className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 border-b border-slate-800 shrink-0 backdrop-blur-sm">
          {/* Navigation icon — mobile only */}
          <button
            onClick={() => setShowSidebar(s => !s)}
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <FiMenu size={20} />
          </button>

          {/* Title */}
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent select-none">
            Orbit
          </span>

          <div className="flex-1" />

          {/* Action icons — MD3 icon button style */}
          <button
            onClick={toggleNotifications}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label={notifEnabled ? 'Notifications on' : 'Enable notifications'}
            title={notifEnabled ? 'Notifications on' : 'Enable notifications'}
          >
            {notifEnabled ? <FiBell size={18} /> : <FiBellOff size={18} />}
          </button>

          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>

          {/* Avatar chip — MD3 "avatar button" pattern */}
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Edit profile"
          >
            {user.photoURL
              ? <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-violet-500/40" />
              : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center ring-2 ring-violet-500/40"><FiUser size={14} /></div>
            }
            <span className="text-sm text-slate-300 hidden sm:block max-w-[120px] truncate font-medium">{name}</span>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Settings"
          >
            <FiSettings size={17} />
          </button>

          <button
            onClick={logout}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            aria-label="Sign out"
          >
            <FiLogOut size={17} />
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
        <Suspense fallback={<PageSpinner />}>
          <RoomDirectory
            onClose={() => setShowDirectory(false)}
            onJoinRoom={slug => { handleSelectRoom(slug); setShowDirectory(false) }}
          />
        </Suspense>
      )}

      {/* PWA install prompt */}
      <PWAInstallPrompt />

      {/* Version badge — bottom left, unobtrusive */}
      <div className="fixed bottom-2 left-2 z-50 pointer-events-none select-none">
        <span className="text-[10px] font-mono text-slate-600 bg-slate-950/70 px-1.5 py-0.5 rounded">v0.3.0</span>
      </div>
    </div>
  )
}

export default App
