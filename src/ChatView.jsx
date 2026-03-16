import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { db, storage, sendDM, setTyping, useTyping, useBlockedUsers, blockUser, unblockUser, reportMessage, searchMessages, pinMessage, unpinMessage, useRoomInfo, addReaction, editMessage, deleteMessage } from './db'
import { useAuth } from './AuthContext'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { ref, uploadString } from 'firebase/storage'
import { MdSend, MdEdit, MdDelete, MdReply, MdClose, MdCheck, MdPushPin, MdFlag, MdBlock, MdGif } from 'react-icons/md'
import { FiCamera, FiSmile, FiSearch, FiX, FiMic, FiHash } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import MessageRenderer from './MessageRenderer'
import GifPicker from './GifPicker'
import { VoiceRecorder, VoicePlayer } from './VoiceMessage'

const bucket = 'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
const suffix = '.jpg?alt=media'
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥']

function ChatView({ messages, loading, mode, roomName, conversationId, otherUser }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [showCamera, setShowCamera] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showEmojiFor, setShowEmojiFor] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimeout = useRef(null)
  const blockedUsers = useBlockedUsers(user.uid)
  const roomInfo = useRoomInfo(mode === 'room' ? roomName : null)
  const typingUsers = useTyping(roomName || conversationId, user.uid)

  const collPath = mode === 'room'
    ? `rooms/${roomName}/messages`
    : `conversations/${conversationId}/messages`

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleTyping() {
    if (roomName || conversationId) {
      setTyping(roomName || conversationId, user.uid, true)
      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => setTyping(roomName || conversationId, user.uid, false), 3000)
    }
  }

  async function handleSend(e) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed && !replyTo) return
    const msg = {
      text: trimmed,
      uid: user.uid,
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || null,
      createdAt: null,
      replyTo: replyTo ? { id: replyTo.id, text: replyTo.text, displayName: replyTo.displayName } : null,
    }
    setText('')
    setReplyTo(null)
    if (mode === 'dm' && conversationId) {
      await sendDM(conversationId, msg)
    } else if (roomName) {
      await addDoc(collection(db, 'rooms', roomName, 'messages'), { ...msg, createdAt: serverTimestamp() })
    }
    setTyping(roomName || conversationId, user.uid, false)
  }

  async function handleSendGif(gifUrl) {
    const msg = { text: '', gifUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
    if (mode === 'dm') await sendDM(conversationId, msg)
    else await addDoc(collection(db, 'rooms', roomName, 'messages'), { ...msg, createdAt: serverTimestamp() })
    setShowGif(false)
  }

  async function handlePhoto(dataUrl) {
    const filename = `photos/${user.uid}_${Date.now()}`
    await uploadString(ref(storage, filename), dataUrl, 'data_url')
    const imageUrl = bucket + encodeURIComponent(filename) + suffix
    const msg = { text: '', imageUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
    if (mode === 'dm') await sendDM(conversationId, msg)
    else await addDoc(collection(db, 'rooms', roomName, 'messages'), { ...msg, createdAt: serverTimestamp() })
    setShowCamera(false)
  }

  async function handleEdit(id, newText) {
    await editMessage(collPath, id, newText)
    setEditingId(null)
  }

  async function handleDelete(id) {
    if (window.confirm('Delete this message?')) await deleteMessage(collPath, id)
  }

  async function handleSearch() {
    if (!searchTerm.trim()) return
    const results = await searchMessages(collPath, searchTerm)
    setSearchResults(results)
  }

  const displayMessages = messages.filter(m => !blockedUsers.includes(m.uid))

  if (!roomName && !conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FiHash size={28} className="text-slate-600" />
          </div>
          <h3 className="text-slate-400 font-medium">Select a room or start a DM</h3>
          <p className="text-slate-600 text-sm mt-1">Choose from the sidebar to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
      {/* Channel header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 shrink-0">
        <div>
          <h2 className="font-semibold text-white text-sm">
            {mode === 'dm' ? (otherUser?.displayName || 'Direct Message') : `#${roomName}`}
          </h2>
          {roomInfo?.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{roomInfo.description}</p>}
        </div>
        <button onClick={() => setShowSearch(s => !s)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
          {showSearch ? <FiX size={16} /> : <FiSearch size={16} />}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex gap-2 px-4 py-2 bg-slate-800/30 border-b border-slate-700/50">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search messages..."
            className="flex-1 bg-slate-700/50 text-white placeholder-slate-500 text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
          />
          <button onClick={handleSearch} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">Search</button>
          {searchResults.length > 0 && <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white"><FiX size={16} /></button>}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (searchResults.length > 0 ? searchResults : displayMessages).map(msg => (
          <MessageItem
            key={msg.id}
            msg={msg}
            currentUid={user.uid}
            collPath={collPath}
            editingId={editingId}
            editText={editText}
            showEmojiFor={showEmojiFor}
            onEdit={(id, text) => { setEditingId(id); setEditText(text) }}
            onEditSave={handleEdit}
            onEditCancel={() => setEditingId(null)}
            onEditTextChange={setEditText}
            onDelete={handleDelete}
            onReply={setReplyTo}
            onReact={(id, emoji) => addReaction(collPath, id, emoji, user.uid)}
            onPin={(id) => pinMessage(collPath, id)}
            onUnpin={(id) => unpinMessage(collPath, id)}
            onReport={(id) => reportMessage(id, user.uid, 'inappropriate')}
            onBlock={(uid) => blockUser(user.uid, uid)}
            onUnblock={(uid) => unblockUser(user.uid, uid)}
            blockedUsers={blockedUsers}
            onToggleEmoji={(id) => setShowEmojiFor(e => e === id ? null : id)}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-slate-500 text-xs">
          {typingUsers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
          <div className="flex-1 text-sm text-slate-400 truncate">
            <span className="text-indigo-400 font-medium">Replying to {replyTo.displayName}: </span>
            {replyTo.text}
          </div>
          <button onClick={() => setReplyTo(null)} className="text-slate-500 hover:text-white"><FiX size={14} /></button>
        </div>
      )}

      {/* GIF picker */}
      {showGif && <GifPicker onSelect={handleGif => handleSendGif(handleGif)} onClose={() => setShowGif(false)} />}

      {/* Camera */}
      {showCamera && (
        <div className="border-t border-slate-700/50">
          <Camera onCapture={handlePhoto} />
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex items-end gap-2 px-4 py-3 bg-slate-800/50 border-t border-slate-700/50 shrink-0">
        <div className="flex gap-1 shrink-0">
          <button type="button" onClick={() => setShowCamera(s => !s)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <FiCamera size={18} />
          </button>
          <button type="button" onClick={() => setShowGif(s => !s)} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <MdGif size={20} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => { setText(e.target.value); handleTyping() }}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
          placeholder={`Message ${mode === 'dm' ? (otherUser?.displayName || '') : '#' + roomName}...`}
          className="flex-1 bg-slate-700/50 text-white placeholder-slate-500 border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none"
        />

        <div className="flex gap-1 shrink-0">
          <VoiceRecorder
            onRecord={async (voiceUrl) => {
              const msg = { text: '', voiceUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
              if (mode === 'dm') await sendDM(conversationId, msg)
              else await addDoc(collection(db, 'rooms', roomName, 'messages'), { ...msg, createdAt: serverTimestamp() })
            }}
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-colors"
          >
            <MdSend size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}

const MessageItem = memo(function MessageItem({
  msg, currentUid, collPath, editingId, editText, showEmojiFor,
  onEdit, onEditSave, onEditCancel, onEditTextChange,
  onDelete, onReply, onReact, onPin, onUnpin, onReport, onBlock, onUnblock,
  blockedUsers, onToggleEmoji
}) {
  const isOwn = msg.uid === currentUid
  const isEditing = editingId === msg.id

  return (
    <div className="group flex items-start gap-2.5 px-2 py-1 rounded-xl hover:bg-slate-800/40 transition-colors">
      {/* Avatar */}
      {msg.photoURL
        ? <img src={msg.photoURL} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
        : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium shrink-0 mt-0.5">
            {msg.displayName?.[0]?.toUpperCase() || '?'}
          </div>
      }

      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white">{msg.displayName}</span>
          <span className="text-xs text-slate-500">
            {msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {msg.editedAt && <span className="text-xs text-slate-600">(edited)</span>}
          {msg.pinned && <span className="text-xs text-amber-500">📌</span>}
        </div>

        {/* Reply reference */}
        {msg.replyTo && (
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1 pl-2 border-l-2 border-slate-600">
            <span className="text-slate-400 font-medium">{msg.replyTo.displayName}:</span>
            <span className="truncate">{msg.replyTo.text}</span>
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="flex gap-2 mt-1">
            <input
              value={editText}
              onChange={e => onEditTextChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onEditSave(msg.id, editText); if (e.key === 'Escape') onEditCancel() }}
              className="flex-1 bg-slate-700 text-white border border-indigo-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              autoFocus
            />
            <button onClick={() => onEditSave(msg.id, editText)} className="text-green-400 hover:text-green-300 p-1"><MdCheck size={16} /></button>
            <button onClick={onEditCancel} className="text-slate-400 hover:text-white p-1"><MdClose size={16} /></button>
          </div>
        ) : (
          <div className="text-sm text-slate-200 leading-relaxed break-words">
            {msg.imageUrl && <img src={msg.imageUrl} alt="photo" className="max-w-xs rounded-xl mb-1 cursor-pointer" />}
            {msg.gifUrl && <img src={msg.gifUrl} alt="gif" className="max-w-xs rounded-xl mb-1" />}
            {msg.voiceUrl && <VoicePlayer url={msg.voiceUrl} />}
            {msg.text && <MessageRenderer text={msg.text} />}
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && Object.entries(msg.reactions).some(([, users]) => users.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(msg.reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(msg.id, emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  users.includes(currentUid)
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {emoji} <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button onClick={() => onToggleEmoji(msg.id)} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors" title="React">
          <FiSmile size={14} />
        </button>
        <button onClick={() => onReply(msg)} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors" title="Reply">
          <MdReply size={14} />
        </button>
        {isOwn && (
          <>
            <button onClick={() => onEdit(msg.id, msg.text)} className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-700 transition-colors" title="Edit">
              <MdEdit size={14} />
            </button>
            <button onClick={() => onDelete(msg.id)} className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors" title="Delete">
              <MdDelete size={14} />
            </button>
          </>
        )}
        <button onClick={() => msg.pinned ? onUnpin(msg.id) : onPin(msg.id)} className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-slate-700 transition-colors" title="Pin">
          <MdPushPin size={14} />
        </button>
        {!isOwn && (
          <button onClick={() => onReport(msg.id)} className="p-1 rounded text-slate-500 hover:text-orange-400 hover:bg-slate-700 transition-colors" title="Report">
            <MdFlag size={14} />
          </button>
        )}
      </div>

      {/* Emoji picker */}
      {showEmojiFor === msg.id && (
        <div className="absolute right-0 mt-8 flex gap-1 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl z-10">
          {EMOJI_LIST.map(e => (
            <button key={e} onClick={() => { onReact(msg.id, e); onToggleEmoji(null) }}
              className="text-xl hover:scale-125 transition-transform p-1">
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})

export default ChatView
