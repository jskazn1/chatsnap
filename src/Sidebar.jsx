import { useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useConversations, useRooms, searchUsers, createOrGetConversation } from './db'
import { FiMessageSquare, FiHash, FiLock, FiSearch, FiPlus, FiX, FiGrid } from 'react-icons/fi'

const DEFAULT_ROOMS = ['home', 'general', 'random']

function Sidebar({ activeView, onSelectRoom, onSelectDM, onOpenDirectory }) {
  const { user } = useAuth()
  const { convos, loading } = useConversations(user.uid)
  const { rooms, loading: roomsLoading } = useRooms()
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  async function handleSearch(term) {
    setSearchTerm(term)
    clearTimeout(searchTimeout.current)
    if (!term.trim()) {
      setSearchResults([])
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchUsers(term.trim())
        setSearchResults(results.filter((r) => r.uid !== user.uid))
      } catch {
        setSearchResults([])
      }
      setSearching(false)
    }, 300)
  }

  async function startDM(otherUser) {
    const convoId = await createOrGetConversation(
      user.uid,
      user.displayName || user.email,
      user.photoURL,
      otherUser.uid,
      otherUser.displayName,
      otherUser.photoURL
    )
    setShowSearch(false)
    setSearchTerm('')
    setSearchResults([])
    onSelectDM(convoId, otherUser)
  }

  // Merge default rooms with dynamic Firestore rooms
  const dynamicSlugs = rooms.map((r) => r.slug)
  const allRoomItems = [
    ...DEFAULT_ROOMS.map((name) => ({ slug: name, name, isDefault: true })),
    ...rooms.filter((r) => !DEFAULT_ROOMS.includes(r.slug)),
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">ChatSnap</span>
        <button
          className="sidebar-action-btn"
          onClick={() => setShowSearch(!showSearch)}
          aria-label="New message"
        >
          {showSearch ? <FiX /> : <FiPlus />}
        </button>
      </div>

      {showSearch && (
        <div className="sidebar-search">
          <div className="sidebar-search-input">
            <FiSearch />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users..."
              autoFocus
            />
          </div>
          {searching && <div className="sidebar-search-status">Searching...</div>}
          {searchResults.length > 0 && (
            <div className="sidebar-search-results">
              {searchResults.map((u) => (
                <button key={u.uid} className="sidebar-search-item" onClick={() => startDM(u)}>
                  <div className="sidebar-avatar">
                    {u.photoURL ? <img src={u.photoURL} alt="" /> : <span>{u.displayName?.[0]?.toUpperCase() || '?'}</span>}
                  </div>
                  <div className="sidebar-item-info">
                    <span className="sidebar-item-name">{u.displayName}</span>
                    <span className="sidebar-item-sub">{u.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searchTerm && !searching && searchResults.length === 0 && (
            <div className="sidebar-search-status">No users found</div>
          )}
        </div>
      )}

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span className="sidebar-section-label">Rooms</span>
          <button className="sidebar-section-btn" onClick={onOpenDirectory} aria-label="Browse rooms">
            <FiGrid />
          </button>
        </div>
        {allRoomItems.map((room) => (
          <button
            key={room.slug}
            className={`sidebar-item ${activeView.type === 'room' && activeView.id === room.slug ? 'active' : ''}`}
            onClick={() => onSelectRoom(room.slug)}
          >
            {room.isPrivate ? <FiLock className="sidebar-item-icon" /> : <FiHash className="sidebar-item-icon" />}
            <span className="sidebar-item-name">{room.name}</span>
          </button>
        ))}
        {roomsLoading && <div className="sidebar-loading">Loading rooms...</div>}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Direct Messages</div>
        {loading && <div className="sidebar-loading">Loading...</div>}
        {convos.map((c) => {
          const other = Object.entries(c.participants || {}).find(([uid]) => uid !== user.uid)
          const otherData = other ? other[1] : { name: 'Unknown' }
          return (
            <button
              key={c.id}
              className={`sidebar-item ${activeView.type === 'dm' && activeView.id === c.id ? 'active' : ''}`}
              onClick={() => onSelectDM(c.id, { uid: other?.[0], ...otherData })}
            >
              <div className="sidebar-avatar small">
                {otherData.photoURL ? (
                  <img src={otherData.photoURL} alt="" />
                ) : (
                  <span>{otherData.name?.[0]?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="sidebar-item-info">
                <span className="sidebar-item-name">{otherData.name}</span>
                {c.lastMessage && (
                  <span className="sidebar-item-sub">
                    {c.lastMessage.text?.slice(0, 30)}
                    {c.lastMessage.text?.length > 30 ? '...' : ''}
                  </span>
                )}
              </div>
            </button>
          )
        })}
        {!loading && convos.length === 0 && (
          <div className="sidebar-empty">No conversations yet</div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
