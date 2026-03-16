import { useState } from 'react'
import { useAuth } from './AuthContext'
import { useRooms, createRoom, joinRoom } from './db'
import { FiHash, FiLock, FiPlus, FiArrowLeft, FiUsers } from 'react-icons/fi'

function RoomDirectory({ onClose, onJoinRoom }) {
  const { user } = useAuth()
  const { rooms, loading } = useRooms()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  // For joining private rooms
  const [joiningId, setJoiningId] = useState(null)
  const [joinInput, setJoinInput] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    setError(null)
    try {
      await createRoom({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
        joinCode: isPrivate ? joinCode.trim() || undefined : undefined,
        createdBy: user.uid,
      })
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
      onJoinRoom(slug)
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setCreating(false)
  }

  async function handleJoin(room) {
    if (room.isPrivate && !room.members?.includes(user.uid)) {
      setJoiningId(room.id)
      return
    }
    try {
      await joinRoom(room.id, user.uid)
      onJoinRoom(room.slug)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleJoinPrivate(roomId, slug) {
    try {
      await joinRoom(roomId, user.uid, joinInput)
      onJoinRoom(slug)
      onClose()
    } catch (err) {
      setError(err.message)
    }
    setJoiningId(null)
    setJoinInput('')
  }

  return (
    <div className="directory-overlay">
      <div className="directory-card">
        <div className="directory-header">
          <button className="profile-back" onClick={onClose}>
            <FiArrowLeft /> Back
          </button>
          <h2 className="directory-title">Room Directory</h2>
          <button
            className="directory-create-btn"
            onClick={() => setShowCreate(!showCreate)}
          >
            <FiPlus /> New Room
          </button>
        </div>

        {error && <div className="profile-error">{error}</div>}

        {showCreate && (
          <form onSubmit={handleCreate} className="directory-form">
            <input
              placeholder="Room name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
            <label className="directory-checkbox">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
              />
              Private room (requires join code)
            </label>
            {isPrivate && (
              <input
                placeholder="Join code (auto-generated if empty)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                maxLength={20}
              />
            )}
            <button type="submit" className="profile-save" disabled={creating || !name.trim()}>
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        <div className="directory-list">
          {loading && <div className="sidebar-loading">Loading rooms...</div>}
          {rooms.map((room) => {
            const isMember = room.members?.includes(user.uid)
            return (
              <div key={room.id} className="directory-room">
                <div className="directory-room-info">
                  <div className="directory-room-name">
                    {room.isPrivate ? <FiLock /> : <FiHash />}
                    {room.name}
                  </div>
                  {room.description && (
                    <div className="directory-room-desc">{room.description}</div>
                  )}
                  <div className="directory-room-meta">
                    <FiUsers /> {room.members?.length || 0} members
                  </div>
                </div>
                {joiningId === room.id ? (
                  <div className="directory-join-code">
                    <input
                      placeholder="Enter join code"
                      value={joinInput}
                      onChange={(e) => setJoinInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleJoinPrivate(room.id, room.slug) }}
                      autoFocus
                    />
                    <button onClick={() => handleJoinPrivate(room.id, room.slug)}>Join</button>
                    <button onClick={() => setJoiningId(null)}>Cancel</button>
                  </div>
                ) : (
                  <button
                    className={`directory-join-btn ${isMember ? 'joined' : ''}`}
                    onClick={() => isMember ? (() => { onJoinRoom(room.slug); onClose() })() : handleJoin(room)}
                  >
                    {isMember ? 'Open' : 'Join'}
                  </button>
                )}
              </div>
            )
          })}
          {!loading && rooms.length === 0 && (
            <div className="sidebar-empty">No rooms created yet. Be the first!</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomDirectory
