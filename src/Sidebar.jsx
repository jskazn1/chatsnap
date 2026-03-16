import { useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { useConversations, useRooms, searchUsers, createOrGetConversation } from './db'
import { FiMessageSquare, FiHash, FiLock, FiSearch, FiPlus, FiX, FiGrid, FiZap } from 'react-icons/fi'

const DEFAULT_ROOMS = ['home', 'general', 'random']

function Sidebar({ activeView, onSelectRoom, onSelectDM, onOpenDirectory }) {
  const { user } = useAuth()
  const { convos, loading: convosLoading } = useConversations(user.uid)
  const { rooms, loading: roomsLoading } = useRooms()
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  async function handleSearch(term) {
    setSearchTerm(term)
    clearTimeout(searchTimeout.current)
    if (!term.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchUsers(term)
      setSearchResults(results.filter(u => u.uid !== user.uid))
      setSearching(false)
    }, 300)
  }

  async function handleStartDM(targetUser) {
    const convoId = await createOrGetConversation(user.uid, targetUser.uid)
    onSelectDM(convoId, targetUser)
    setShowSearch(false)
    setSearchTerm('')
    setSearchResults([])
  }

  const btnBase = 'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left'
  const activeBtn = 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
  const inactiveBtn = 'text-slate-400 hover:text-white hover:bg-slate-700/50'

  const isActive = (type, id) => activeView.type === type && (activeView.room === id || activeView.convoId === id)

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700/50">
      {/* Brand header */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-700/50 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <FiZap size={14} className="text-white" />
        </div>
        <span className="font-bold text-white">Surge</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3 space-y-4">
        {/* Rooms section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rooms</span>
            <button onClick={onOpenDirectory} className="text-slate-500 hover:text-indigo-400 transition-colors" title="Browse rooms">
              <FiGrid size={14} />
            </button>
          </div>

          {roomsLoading ? (
            <div className="px-3 py-2 text-slate-500 text-xs">Loading...</div>
          ) : (
            <div className="space-y-0.5">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => onSelectRoom(room.slug)}
                  className={`${btnBase} ${isActive('room', room.slug) ? activeBtn : inactiveBtn}`}
                >
                  {room.isPrivate ? <FiLock size={14} className="shrink-0" /> : <FiHash size={14} className="shrink-0" />}
                  <span className="truncate">{room.name}</span>
                </button>
              ))}
              {DEFAULT_ROOMS.filter(r => !rooms.find(rm => rm.slug === r)).map(r => (
                <button
                  key={r}
                  onClick={() => onSelectRoom(r)}
                  className={`${btnBase} ${isActive('room', r) ? activeBtn : inactiveBtn}`}
                >
                  <FiHash size={14} className="shrink-0" />
                  <span className="truncate">{r}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direct messages section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Messages</span>
            <button
              onClick={() => setShowSearch(s => !s)}
              className="text-slate-500 hover:text-indigo-400 transition-colors"
              title="New message"
            >
              {showSearch ? <FiX size={14} /> : <FiPlus size={14} />}
            </button>
          </div>

          {showSearch && (
            <div className="mb-2">
              <div className="relative">
                <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Search users..."
                  autoFocus
                  className="w-full bg-slate-700/50 text-white placeholder-slate-500 text-sm border border-slate-600 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {searching && <p className="text-slate-500 text-xs px-2 py-1">Searching...</p>}
              {searchResults.map(u => (
                <button
                  key={u.uid}
                  onClick={() => handleStartDM(u)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                >
                  {u.photoURL
                    ? <img src={u.photoURL} alt="" className="w-6 h-6 rounded-full object-cover" />
                    : <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">{u.displayName?.[0]?.toUpperCase()}</div>
                  }
                  <span className="text-sm text-slate-300 truncate">{u.displayName}</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-0.5">
            {convosLoading ? (
              <div className="px-3 py-2 text-slate-500 text-xs">Loading...</div>
            ) : convos.length === 0 ? (
              <p className="px-3 py-2 text-slate-600 text-xs">No conversations yet</p>
            ) : (
              convos.map(convo => {
                const otherUid = convo.participants.find(p => p !== user.uid)
                return (
                  <button
                    key={convo.id}
                    onClick={() => onSelectDM(convo.id, { uid: otherUid })}
                    className={`${btnBase} ${isActive('dm', convo.id) ? activeBtn : inactiveBtn}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                      <FiMessageSquare size={10} />
                    </div>
                    <span className="truncate">{convo.lastMessage || 'Direct message'}</span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
