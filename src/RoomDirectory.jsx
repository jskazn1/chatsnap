import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useRooms, createRoom, joinRoom } from './db'
import { FiHash, FiLock, FiPlus, FiArrowLeft, FiUsers, FiSearch, FiX, FiCheck } from 'react-icons/fi'

function RoomDirectory({ onClose, onJoinRoom }) {
  const { user } = useAuth()
  const { rooms, loading } = useRooms()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [joiningId, setJoiningId] = useState(null)
  const [joinInput, setJoinInput] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      const room = await createRoom(name.trim(), description.trim(), isPrivate, user.uid)
      setName('')
      setDescription('')
      setIsPrivate(false)
      setShowCreate(false)
      onJoinRoom?.(room.slug, room.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(room) {
    if (room.isPrivate) {
      setJoiningId(room.id)
      setJoinInput('')
      return
    }
    try {
      await joinRoom(room.id, user.uid)
      onJoinRoom?.(room.slug, room.name)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleJoinPrivate(room) {
    if (!joinInput.trim()) return
    setJoining(true)
    try {
      await joinRoom(room.id, user.uid, joinInput.trim())
      setJoiningId(null)
      setJoinInput('')
      onJoinRoom?.(room.slug, room.name)
    } catch (err) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  const filtered = (rooms || []).filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <h2 className="text-white font-semibold text-lg">Room Directory</h2>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setError(null) }}
          className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showCreate ? <FiX size={16} /> : <FiPlus size={16} />}
          {showCreate ? 'Cancel' : 'New Room'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Create Room Form */}
        {showCreate && (
          <div className="m-4 p-4 bg-slate-800 border border-slate-700 rounded-xl">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FiPlus size={18} className="text-violet-400" />
              Create a Room
            </h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Room Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. general, design, random"
                  maxLength={40}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What's this room about?"
                  maxLength={120}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsPrivate(!isPrivate)}
                  className={`w-10 h-5 rounded-full transition-colors ${isPrivate ? 'bg-violet-600' : 'bg-slate-600'} relative`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPrivate ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <span className="text-sm text-white font-medium flex items-center gap-1.5">
                    <FiLock size={13} /> Private Room
                  </span>
                  <p className="text-xs text-slate-500">Requires invite code to join</p>
                </div>
              </label>
              {error && (
                <p className="text-red-400 text-xs flex items-center gap-1">
                  <FiX size={12} /> {error}
                </p>
              )}
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm rounded-lg transition-all"
              >
                {creating ? 'Creating...' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="px-4 pt-2 pb-3">
          <div className="relative">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Room List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <FiHash size={40} className="mb-3 opacity-30" />
            <p className="text-sm">{search ? 'No rooms match your search' : 'No rooms yet'}</p>
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-2">
            {filtered.map(room => (
              <div key={room.id} className="bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl p-4 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-violet-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {room.isPrivate
                        ? <FiLock size={16} className="text-violet-400" />
                        : <FiHash size={16} className="text-violet-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">{room.name}</span>
                        {room.isPrivate && (
                          <span className="text-xs px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded-md">Private</span>
                        )}
                      </div>
                      {room.description && (
                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{room.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-slate-500 text-xs">
                        <FiUsers size={11} />
                        <span>{room.memberCount || 0} members</span>
                      </div>
                    </div>
                  </div>
                  {room.members?.includes(user.uid) ? (
                    <span className="flex items-center gap-1 text-xs text-green-400 flex-shrink-0">
                      <FiCheck size={12} /> Joined
                    </span>
                  ) : joiningId === room.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="text"
                        value={joinInput}
                        onChange={e => setJoinInput(e.target.value)}
                        placeholder="Invite code"
                        className="w-28 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        onKeyDown={e => e.key === 'Enter' && handleJoinPrivate(room)}
                      />
                      <button
                        onClick={() => handleJoinPrivate(room)}
                        disabled={joining}
                        className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded transition-colors"
                      >
                        Join
                      </button>
                      <button
                        onClick={() => setJoiningId(null)}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleJoin(room)}
                      className="px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600 border border-violet-500/30 hover:border-violet-500 text-violet-300 hover:text-white text-xs font-medium rounded-lg transition-all flex-shrink-0"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default RoomDirectory
