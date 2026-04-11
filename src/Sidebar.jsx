import { useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { searchUsers, createOrGetConversation } from './db'
import {
  FiHash, FiLock, FiSearch, FiPlus, FiX, FiGrid,
  FiLink, FiMessageSquare, FiUsers, FiChevronRight
} from 'react-icons/fi'
import OrbitLogo from './OrbitLogo'

const DEFAULT_ROOMS = ['home', 'general', 'random']

// ─── Derived color for a room based on its slug ────────────────────────────
const ROOM_HUES = {
  home:          { bg: 'from-violet-600/30 to-purple-700/20',  icon: 'text-violet-400', border: 'border-violet-500/20' },
  general:       { bg: 'from-blue-600/30   to-indigo-700/20',  icon: 'text-blue-400',   border: 'border-blue-500/20'   },
  random:        { bg: 'from-pink-600/30   to-rose-700/20',    icon: 'text-pink-400',   border: 'border-pink-500/20'   },
  announcements: { bg: 'from-amber-600/30  to-orange-700/20',  icon: 'text-amber-400',  border: 'border-amber-500/20'  },
  design:        { bg: 'from-cyan-600/30   to-teal-700/20',    icon: 'text-cyan-400',   border: 'border-cyan-500/20'   },
  dev:           { bg: 'from-emerald-600/30 to-green-700/20',  icon: 'text-emerald-400',border: 'border-emerald-500/20'},
}
function roomHue(slug) {
  return ROOM_HUES[slug] || { bg: 'from-slate-600/30 to-slate-700/20', icon: 'text-slate-400', border: 'border-slate-600/20' }
}

// ─── Avatar initials helper ────────────────────────────────────────────────
function AvatarBlob({ photoURL, name, size = 'md', color }) {
  const sz = size === 'lg' ? 'w-11 h-11 text-sm' : size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-9 h-9 text-xs'
  const bg  = color || 'from-violet-600 to-purple-700'
  if (photoURL) return <img src={photoURL} alt="" className={`${sz} rounded-full object-cover shrink-0`} />
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-semibold shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ─── Color dots for rooms ──────────────────────────────────────────────────
const ROOM_DOTS = {
  home:          '#7c3aed',
  general:       '#3b82f6',
  random:        '#ec4899',
  announcements: '#f59e0b',
  design:        '#06b6d4',
  dev:           '#10b981',
}
function roomDotColor(slug) {
  return ROOM_DOTS[slug] || '#64748b'
}

// ─── Compact channel row (replaces RoomCard) ──────────────────────────────
function RoomRow({ room, isActive, unread, onSelect, onCopyLink, copied }) {
  const slug = room.slug || room
  const name = room.name || room
  const dot = roomDotColor(slug)

  return (
    <div className="group relative flex items-center">
      <button
        onClick={onSelect}
        aria-pressed={isActive}
        aria-label={`${room.isPrivate ? 'Private room' : 'Channel'} ${name}`}
        className={`
          flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left
          transition-colors duration-100 min-w-0
          ${isActive
            ? 'bg-zinc-700/60 text-white'
            : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
          }
        `}
      >
        {/* Color dot */}
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 transition-opacity"
          style={{
            background: dot,
            opacity: isActive ? 1 : unread ? 0.85 : 0.3,
            boxShadow: (isActive || unread) ? `0 0 5px ${dot}80` : 'none',
          }}
        />
        {/* Icon */}
        {room.isPrivate
          ? <FiLock size={13} className="shrink-0" />
          : <FiHash size={13} className="shrink-0" />
        }
        {/* Name */}
        <span className={`text-[13px] truncate flex-1 ${isActive ? 'font-semibold' : unread ? 'font-semibold text-zinc-200' : 'font-normal'}`}>
          {name}
        </span>
        {/* Unread dot */}
        {unread && !isActive && (
          <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 badge-pulse" />
        )}
      </button>

      {/* Copy link — always tappable (dimmed until hover/focus) */}
      <button
        onClick={e => { e.stopPropagation(); onCopyLink(slug) }}
        title={copied ? 'Copied!' : 'Copy invite link'}
        aria-label="Copy room invite link"
        className="opacity-25 group-hover:opacity-100 focus:opacity-100 transition-opacity w-7 h-7 rounded flex items-center justify-center text-zinc-400 hover:text-violet-400 hover:bg-zinc-800 active:bg-zinc-700 shrink-0 mr-0.5"
      >
        {copied
          ? <span className="text-[10px] text-green-400 font-bold">✓</span>
          : <FiLink size={12} />
        }
      </button>
    </div>
  )
}

// ─── Compact DM row ────────────────────────────────────────────────────────
function DMCard({ convo, currentUid, isActive, unread, onSelect, userProfiles, onlineUsers }) {
  const otherUid = convo.participants?.find(p => p !== currentUid)
  const profile  = userProfiles?.[otherUid]
  const name     = profile?.displayName || convo.lastMessage || 'Direct message'
  const photoURL = profile?.photoURL || null
  const isOnline = onlineUsers?.has(otherUid)

  return (
    <button
      onClick={() => onSelect(convo.id, { uid: otherUid, displayName: name, photoURL })}
      aria-pressed={isActive}
      aria-label={`Direct message with ${name}${isOnline ? ' (online)' : ''}`}
      className={`
        w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left
        transition-colors duration-100 min-w-0
        ${isActive
          ? 'bg-zinc-700/60 text-white'
          : 'text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-200'
        }
      `}
    >
      {/* Mini avatar with online indicator */}
      <div className="relative shrink-0">
        <AvatarBlob photoURL={photoURL} name={name} size="sm" />
        {isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0b10]"
            aria-hidden="true"
            title="Online"
          />
        )}
      </div>

      {/* Name */}
      <span className={`text-[13px] truncate flex-1 ${isActive ? 'font-semibold' : unread ? 'font-semibold text-zinc-200' : 'font-normal'}`}>
        {name}
      </span>

      {/* Unread dot */}
      {unread && !isActive && (
        <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0 badge-pulse" />
      )}
    </button>
  )
}

// ─── Main sidebar ──────────────────────────────────────────────────────────
function Sidebar({ activeView, rooms = [], roomsLoading, convos = [], convosLoading, unreadMap = {}, onlineUsers, onSelectRoom, onSelectDM, onOpenDirectory }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab]   = useState('rooms')
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching]   = useState(false)
  const [copiedSlug, setCopiedSlug] = useState(null)
  const searchTimeout = useRef(null)

  // Count unread per tab for badge display
  const unreadRooms = rooms.filter(r => unreadMap[r.slug]).length
    + DEFAULT_ROOMS.filter(r => !rooms.find(rm => rm.slug === r) && unreadMap[r]).length
  const unreadDMs = convos.filter(c => unreadMap[c.id]).length

  async function handleSearch(term) {
    const capped = term.slice(0, 50) // cap input length
    setSearchTerm(capped)
    clearTimeout(searchTimeout.current)
    if (capped.trim().length < 2) { setSearchResults([]); return } // require 2+ chars
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const results = await searchUsers(capped)
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

  function copyInviteLink(slug) {
    const url = `${window.location.origin}/join/${slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedSlug(slug)
      setTimeout(() => setCopiedSlug(null), 2000)
    })
  }

  const isActive = (type, id) =>
    activeView.type === type && (activeView.room === id || activeView.convoId === id)

  // All rooms to display (Firestore rooms + any default rooms not yet created)
  const allRooms = [
    ...rooms,
    ...DEFAULT_ROOMS
      .filter(r => !rooms.find(rm => rm.slug === r))
      .map(r => ({ id: r, slug: r, name: r, description: '', memberCount: 0, isPrivate: false }))
  ]

  return (
    <div className="flex flex-col h-full bg-[#0c0b10] border-r border-zinc-800/60" aria-label="Main navigation">

      {/* ─── Header ─── */}
      <div className="flex items-center gap-2.5 px-4 py-4 shrink-0">
        <OrbitLogo size={32} />
        <span className="font-bold text-white text-base tracking-tight flex-1">Orbit</span>
        {/* Browse rooms shortcut */}
        <button
          onClick={onOpenDirectory}
          className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 transition-colors"
          aria-label="Browse and create rooms"
          title="Browse rooms"
        >
          <FiGrid size={13} />
        </button>
      </div>

      {/* ─── Tabs: Rooms | People ─── */}
      <div className="flex gap-1 px-3 pb-3 shrink-0" role="tablist" aria-label="Navigation tabs">
        {[
          { id: 'rooms',  label: 'Rooms',  badge: unreadRooms },
          { id: 'people', label: 'People', badge: unreadDMs   },
        ].map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150
              ${activeTab === tab.id
                ? 'bg-violet-500/15 text-violet-300 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }
            `}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] font-bold flex items-center justify-center">
                {tab.badge > 9 ? '9+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="h-px bg-zinc-800/60 mx-3 shrink-0" />

      {/* ─── Tab panels ─── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2" role="tabpanel">

        {/* ══ ROOMS TAB ══ */}
        {activeTab === 'rooms' && (
          <div>
            {/* Section heading */}
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 select-none">Channels</span>
              <button
                onClick={onOpenDirectory}
                className="text-zinc-600 hover:text-violet-400 transition-colors"
                aria-label="Browse and create rooms"
                title="Add channel"
              >
                <FiPlus size={13} />
              </button>
            </div>
            {roomsLoading ? (
              <div className="flex items-center gap-2 px-2.5 py-2 text-zinc-600 text-xs">
                <div className="w-3.5 h-3.5 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : allRooms.map(room => (
              <RoomRow
                key={room.id || room.slug}
                room={room}
                isActive={isActive('room', room.slug)}
                unread={unreadMap[room.slug]}
                onSelect={() => onSelectRoom(room.slug)}
                onCopyLink={copyInviteLink}
                copied={copiedSlug === room.slug}
              />
            ))}
          </div>
        )}

        {/* ══ PEOPLE (DMs) TAB ══ */}
        {activeTab === 'people' && (
          <div>
            {/* Section heading */}
            <div className="flex items-center justify-between px-2.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 select-none">Direct Messages</span>
              <button
                onClick={() => setShowSearch(s => !s)}
                className="text-zinc-600 hover:text-violet-400 transition-colors"
                aria-label={showSearch ? 'Cancel new message' : 'New direct message'}
                title="New message"
              >
                {showSearch ? <FiX size={13} /> : <FiPlus size={13} />}
              </button>
            </div>

            {/* User search */}
            {showSearch && (
              <div className="space-y-1.5 fade-up">
                <div className="relative">
                  <FiSearch size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Find someone… (2+ characters)"
                    autoFocus
                    maxLength={50}
                    aria-label="Search for a user to message"
                    className="w-full bg-zinc-900 text-white placeholder-zinc-600 text-sm border border-zinc-700
                      rounded-xl pl-9 pr-3 py-2.5
                      focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                {searching && <p className="text-zinc-500 text-xs px-1 py-1">Searching…</p>}
                <div className="space-y-1">
                  {searchResults.map(u => (
                    <button
                      key={u.uid}
                      onClick={() => handleStartDM(u)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 transition-all text-left"
                    >
                      <AvatarBlob photoURL={u.photoURL} name={u.displayName} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 font-medium truncate">{u.displayName}</p>
                        <p className="text-[11px] text-zinc-600 truncate">{u.email}</p>
                      </div>
                      <FiChevronRight size={13} className="text-zinc-600 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Existing DM conversations */}
            {convosLoading ? (
              <div className="flex items-center gap-2 px-2.5 py-2 text-zinc-600 text-xs">
                <div className="w-3.5 h-3.5 border border-zinc-600 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            ) : convos.length === 0 ? (
              <div className="px-2.5 py-5 text-center">
                <FiMessageSquare size={18} className="text-zinc-700 mx-auto mb-2" />
                <p className="text-zinc-600 text-xs">No conversations yet</p>
                <p className="text-zinc-700 text-[11px] mt-0.5">Use + above to start one</p>
              </div>
            ) : (
              convos.map(convo => (
                <DMCard
                  key={convo.id}
                  convo={convo}
                  currentUid={user.uid}
                  isActive={isActive('dm', convo.id)}
                  unread={unreadMap[convo.id]}
                  onSelect={onSelectDM}
                  onlineUsers={onlineUsers}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
