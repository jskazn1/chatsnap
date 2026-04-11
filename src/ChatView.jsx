import { useState, useEffect, useRef, memo, useCallback, lazy, Suspense } from 'react'
const RoomSettings = lazy(() => import('./RoomSettings'))
import { db, storage, sendDM, sendRoomMessage, setTyping, useTyping, useBlockedUsers, blockUser, unblockUser, reportMessage, searchMessages, pinMessage, unpinMessage, useRoomInfo, addReaction, editMessage, deleteMessage, checkWordFilter, isModerator, timeoutUser, liftTimeout } from './db'
import { useAuth } from './AuthContext'
import { serverTimestamp } from 'firebase/firestore'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { MdSend, MdEdit, MdDelete, MdReply, MdClose, MdCheck, MdPushPin, MdFlag, MdBlock, MdGif } from 'react-icons/md'
import { FiCamera, FiImage, FiSmile, FiSearch, FiX, FiMic, FiHash, FiClock, FiShield, FiAlertTriangle } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import MessageRenderer from './MessageRenderer'
import GifPicker from './GifPicker'
import { VoiceRecorder, VoicePlayer } from './VoiceMessage'
import LinkPreview, { extractUrls } from './LinkPreview'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥']

// ── Message grouping: same uid, < 5 min apart, no reply ──────────────────
const GROUP_GAP_MS = 5 * 60 * 1000
function annotateGroups(msgs) {
  return msgs.map((msg, i) => {
    const prev = msgs[i - 1]
    const isGrouped =
      prev &&
      prev.uid === msg.uid &&
      msg.createdAt && prev.createdAt &&
      (msg.createdAt?.toMillis?.() ?? 0) - (prev.createdAt?.toMillis?.() ?? 0) < GROUP_GAP_MS &&
      !msg.replyTo
    return { ...msg, isGrouped: !!isGrouped }
  })
}

// ── Date separator helpers ───────────────────────────────────────────────
function dateLabelForMsg(msg, prevMsg) {
  const ts = msg.createdAt?.toDate?.()
  if (!ts) return null
  const prevTs = prevMsg?.createdAt?.toDate?.()

  const today = new Date()
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  // Show separator on first message, or when day changes
  if (prevTs && isSameDay(ts, prevTs)) return null

  if (isSameDay(ts, today)) return 'Today'
  if (isSameDay(ts, yesterday)) return 'Yesterday'
  return ts.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 px-4 my-4" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-slate-700/60" />
      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest select-none shrink-0">{label}</span>
      <div className="flex-1 h-px bg-slate-700/60" />
    </div>
  )
}

function ChatView({ messages, loading, mode, roomName, conversationId, otherUser, isOtherUserOnline, showAvatars = true }) {
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
  const [activeMsgId, setActiveMsgId] = useState(null) // which message has actions open (tap on mobile)
  const [isRecording, setIsRecording] = useState(false)
  const [showRoomSettings, setShowRoomSettings] = useState(false)
  // Moderation state
  const [slowCooldown, setSlowCooldown] = useState(0)   // seconds remaining before next message
  const [sendError, setSendError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const lastSentAt = useRef(0)
  const cooldownTimer = useRef(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)
  const typingTimeout = useRef(null)
  const blockedUsers = useBlockedUsers(user.uid)
  const roomInfo = useRoomInfo(mode === 'room' ? roomName : null)
  const typingUsers = useTyping(roomName || conversationId, user.uid)

  const collPath = mode === 'room'
    ? `rooms/${roomName}/messages`
    : `conversations/${conversationId}/messages`

  const isMod = isModerator(roomInfo, user.uid)

  // Slow mode countdown ticker
  useEffect(() => {
    return () => clearInterval(cooldownTimer.current)
  }, [])

  function startCooldown(seconds) {
    setSlowCooldown(seconds)
    clearInterval(cooldownTimer.current)
    cooldownTimer.current = setInterval(() => {
      setSlowCooldown(s => {
        if (s <= 1) { clearInterval(cooldownTimer.current); return 0 }
        return s - 1
      })
    }, 1000)
  }

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

    // ── Slow mode check ──
    if (mode === 'room' && roomInfo?.slowMode > 0) {
      const elapsed = (Date.now() - lastSentAt.current) / 1000
      const remaining = Math.ceil(roomInfo.slowMode - elapsed)
      if (remaining > 0) {
        setSendError(`Slow mode is on — wait ${remaining}s`)
        startCooldown(remaining)
        return
      }
    }

    // ── Word filter check ──
    if (mode === 'room' && roomInfo?.blockedWords?.length) {
      const hit = checkWordFilter(trimmed, roomInfo.blockedWords)
      if (hit) {
        setSendError('Your message contains a blocked word or phrase.')
        setTimeout(() => setSendError(''), 3000)
        return
      }
    }

    setSendError('')
    const msg = {
      text: trimmed,
      uid: user.uid,
      displayName: user.displayName || user.email,
      photoURL: user.photoURL || null,
      createdAt: null,
      // Truncate the quoted text so large messages don't balloon the reply document size
      replyTo: replyTo ? { id: replyTo.id, text: (replyTo.text || '').slice(0, 200), displayName: replyTo.displayName } : null,
    }
    setText('')
    setReplyTo(null)
    lastSentAt.current = Date.now()

    try {
      if (mode === 'dm' && conversationId) {
        await sendDM(conversationId, msg)
      } else if (roomName) {
        await sendRoomMessage(roomName, msg)
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      setSendError('Failed to send message. Please try again.')
      setText(trimmed) // restore text so the user doesn't lose their message
      return
    }

    // Start slow mode cooldown after sending
    if (mode === 'room' && roomInfo?.slowMode > 0) {
      startCooldown(roomInfo.slowMode)
    }

    setTyping(roomName || conversationId, user.uid, false)
  }

  async function handleSendGif(gifUrl) {
    const msg = { text: '', gifUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
    try {
      if (mode === 'dm') await sendDM(conversationId, msg)
      else await sendRoomMessage(roomName, msg)
      setShowGif(false)
    } catch (err) {
      console.error('Failed to send GIF:', err)
      setSendError('Failed to send GIF. Please try again.')
    }
  }

  // Compress a photo dataUrl to max 800px wide, JPEG 80% quality before upload
  function compressImage(dataUrl, maxWidth = 800, quality = 0.8) {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = dataUrl
    })
  }

  async function handleFileInput(e) {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => handlePhoto(ev.target.result)
    reader.readAsDataURL(file)
    // reset so same file can be re-selected
    e.target.value = ''
  }

  async function handlePhoto(dataUrl) {
    if (!dataUrl) return // guard against null/undefined from camera component
    try {
      const compressed = await compressImage(dataUrl)
      if (!compressed) { setSendError('Failed to process image. Please try again.'); return }
      const filename = `photos/${user.uid}_${Date.now()}`
      const storageRef = ref(storage, filename)
      await uploadString(storageRef, compressed, 'data_url')
      const imageUrl = await getDownloadURL(storageRef)
      const msg = { text: '', imageUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
      if (mode === 'dm') await sendDM(conversationId, msg)
      else await sendRoomMessage(roomName, msg)
      setShowCamera(false)
    } catch (err) {
      console.error('Failed to upload photo:', err)
      setSendError('Failed to upload photo. Please try again.')
    }
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

  const filteredMessages = (messages || []).filter(m => !blockedUsers.includes(m.uid))
  const displayMessages = annotateGroups(filteredMessages)

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
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {/* Online dot for DMs */}
            {mode === 'dm' && (
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                  isOtherUserOnline ? 'bg-emerald-400' : 'bg-slate-600'
                }`}
                aria-label={isOtherUserOnline ? 'Online' : 'Offline'}
              />
            )}
            <h2 className="font-semibold text-white text-sm truncate">
              {mode === 'dm' ? (otherUser?.displayName || 'Direct Message') : `#${roomName}`}
            </h2>
          </div>
          {mode === 'dm' && (
            <p className="text-xs mt-0.5 text-slate-500">
              {isOtherUserOnline ? <span className="text-emerald-500">Online</span> : 'Offline'}
            </p>
          )}
          {mode === 'room' && roomInfo?.description && (
            <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{roomInfo.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {/* Mod settings — only visible to owner/mods in room mode */}
          {mode === 'room' && isMod && (
            <button
              onClick={() => setShowRoomSettings(true)}
              className="p-1.5 rounded-lg text-violet-500 hover:text-violet-300 hover:bg-slate-700 transition-colors"
              aria-label="Room moderation settings"
              title="Room settings"
            >
              <FiShield size={15} />
            </button>
          )}
        <button
          onClick={() => setShowSearch(s => !s)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label={showSearch ? 'Close search' : 'Search messages'}
          aria-expanded={showSearch}
        >
          {showSearch ? <FiX size={16} /> : <FiSearch size={16} />}
        </button>
        </div>
      </div>

      {/* Room settings modal */}
      {showRoomSettings && roomInfo && (
        <Suspense fallback={null}>
          <RoomSettings room={roomInfo} onClose={() => setShowRoomSettings(false)} />
        </Suspense>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="flex gap-2 px-4 py-2 bg-slate-800/30 border-b border-slate-700/50">
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search messages..."
            className="flex-1 bg-slate-700/50 text-white placeholder-slate-500 text-sm border border-slate-600 rounded-lg px-3 py-1.5 focus:outline-none focus:border-violet-500"
          />
          <button onClick={handleSearch} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-lg transition-colors">Search</button>
          {searchResults.length > 0 && <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white"><FiX size={16} /></button>}
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin py-2 space-y-0 relative"
        role="log"
        aria-live="polite"
        aria-label="Message feed"
        onDragEnter={e => { e.preventDefault(); setIsDragging(true) }}
        onDragOver={e => { e.preventDefault() }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false) }}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = ev => handlePhoto(ev.target.result)
            reader.readAsDataURL(file)
          }
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (() => {
          const list = searchResults.length > 0 ? searchResults : displayMessages
          if (!loading && list.length === 0 && mode === 'room' && roomName) {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
                <div>
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-3xl mb-4 mx-auto">
                    #
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Welcome to #{roomName}!</h3>
                  <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                    This is the very beginning of <span className="text-white font-medium">#{roomName}</span>. Say something to get the conversation started.
                  </p>
                </div>
                {/* Quick-start tips */}
                <div className="grid grid-cols-2 gap-2 max-w-sm w-full text-left">
                  {[
                    { icon: '💬', title: 'Send a message', desc: 'Type below and press Enter' },
                    { icon: '😄', title: 'React to messages', desc: 'Tap a message to see options' },
                    { icon: '📎', title: 'Share media', desc: 'Photos, GIFs, and voice notes' },
                    { icon: '🔍', title: 'Search history', desc: 'Use the search icon above' },
                  ].map(tip => (
                    <div key={tip.title} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                      <div className="text-lg mb-1">{tip.icon}</div>
                      <p className="text-xs font-semibold text-slate-300">{tip.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
          if (!loading && list.length === 0 && mode === 'dm') {
            return (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl mb-4">
                  💬
                </div>
                <h3 className="text-base font-bold text-white mb-1">Start a conversation</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Your messages are private — only the two of you can see them.
                  Say hi!
                </p>
              </div>
            )
          }
          return list.map((msg, i) => {
            const prev = list[i - 1]
            const dateLabel = dateLabelForMsg(msg, prev)
            return (
              <div key={msg.id}>
                {dateLabel && <DateSeparator label={dateLabel} />}
                <MessageItem
                  animationDelay={i < 20 ? 0 : undefined}
                  msg={msg}
                  currentUid={user.uid}
                  collPath={collPath}
                  editingId={editingId}
                  editText={editText}
                  showEmojiFor={showEmojiFor}
                  onEdit={(id, text) => { setEditingId(id); setEditText(text); setActiveMsgId(null) }}
                  onEditSave={handleEdit}
                  onEditCancel={() => setEditingId(null)}
                  onEditTextChange={setEditText}
                  onDelete={handleDelete}
                  onReply={(msg) => { setReplyTo(msg); setActiveMsgId(null) }}
                  onReact={(id, emoji) => { addReaction(collPath, id, emoji, user.uid); setActiveMsgId(null) }}
                  onPin={(id) => pinMessage(collPath, id)}
                  onUnpin={(id) => unpinMessage(collPath, id)}
                  onReport={(id) => reportMessage(id, user.uid, 'inappropriate')}
                  onBlock={(uid) => blockUser(user.uid, uid)}
                  onUnblock={(uid) => unblockUser(user.uid, uid)}
                  blockedUsers={blockedUsers}
                  onToggleEmoji={(id) => setShowEmojiFor(e => e === id ? null : id)}
                  activeMsgId={activeMsgId}
                  onSetActive={(id) => setActiveMsgId(a => a === id ? null : id)}
                  showAvatars={showAvatars}
                  isMod={isMod}
                  roomId={roomInfo?.id}
                />
              </div>
            )
          })
        })()}
        <div ref={bottomRef} />
        {/* Drag-and-drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-violet-500/10 border-2 border-dashed border-violet-500/50 rounded-none flex items-center justify-center z-40 pointer-events-none">
            <div className="text-center">
              <div className="text-5xl mb-3">📷</div>
              <p className="text-violet-300 font-semibold text-lg">Drop image to share</p>
              <p className="text-violet-400/60 text-sm mt-1">Release to upload</p>
            </div>
          </div>
        )}
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="px-4 py-1 text-slate-500 text-xs flex items-center gap-1.5">
          <span className="flex items-center gap-0.5">
            <span className="typing-dot" />
            <span className="typing-dot" />
            <span className="typing-dot" />
          </span>
          <span>{typingUsers.length === 1 ? 'Someone is typing' : 'Several people are typing'}</span>
        </div>
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
          <div className="flex-1 text-sm text-slate-400 truncate">
            <span className="text-violet-400 font-medium">Replying to {replyTo.displayName}: </span>
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

      {/* Slow mode banner */}
      {mode === 'room' && roomInfo?.slowMode > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-950/40 border-t border-amber-800/30 text-amber-400 text-xs">
          <FiClock size={12} />
          <span>Slow mode is on — {roomInfo.slowMode}s between messages</span>
          {slowCooldown > 0 && (
            <span className="ml-auto font-mono font-semibold">{slowCooldown}s</span>
          )}
        </div>
      )}

      {/* Send error */}
      {sendError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-2 px-4 py-1.5 bg-red-950/40 border-t border-red-800/30 text-red-400 text-xs"
        >
          <FiAlertTriangle size={12} />
          {sendError}
        </div>
      )}

      {/* Hidden file input for image picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
        aria-label="Upload image"
      />

      {/* Input bar */}
      <form onSubmit={handleSend} className="flex items-end gap-1.5 px-3 py-2.5 bg-slate-800/50 border-t border-slate-700/50 shrink-0">
        <div className="flex gap-0.5 shrink-0">
          <button type="button" onClick={() => setShowCamera(s => !s)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Take photo">
            <FiCamera size={17} />
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Upload image from device">
            <FiImage size={17} />
          </button>
          <button type="button" onClick={() => setShowGif(s => !s)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Send GIF">
            <MdGif size={19} />
          </button>
        </div>

        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            disabled={slowCooldown > 0}
            onChange={e => { setText(e.target.value); handleTyping() }}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
            placeholder={slowCooldown > 0 ? `Slow mode — wait ${slowCooldown}s…` : `Message ${mode === 'dm' ? (otherUser?.displayName || '') : '#' + roomName}...`}
            aria-label="Message input"
            maxLength={4000}
            className={`w-full bg-slate-700/50 text-white placeholder-slate-500 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 resize-none transition-colors
              ${slowCooldown > 0 ? 'border-amber-800/50 bg-amber-950/20 cursor-not-allowed' : 'border-slate-600'}`}
          />
          {text.length > 3800 && (
            <span className={`absolute right-2 bottom-1 text-[10px] font-mono pointer-events-none
              ${text.length >= 4000 ? 'text-red-400' : text.length > 3900 ? 'text-amber-400' : 'text-slate-500'}`}>
              {4000 - text.length}
            </span>
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <VoiceRecorder
            onSend={async (voiceUrl) => {
              const msg = { text: '', voiceUrl, uid: user.uid, displayName: user.displayName || user.email, photoURL: user.photoURL || null, createdAt: null }
              try {
                if (mode === 'dm') await sendDM(conversationId, msg)
                else await sendRoomMessage(roomName, msg)
              } catch (err) {
                console.error('Failed to send voice message:', err)
                setSendError('Failed to send voice message. Please try again.')
              }
            }}
          />
          <button
            type="submit"
            disabled={!text.trim() || slowCooldown > 0}
            className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white transition-colors"
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
  blockedUsers, onToggleEmoji, animationDelay, isMod, roomId,
  activeMsgId, onSetActive, showAvatars = true,
}) {
  const isOwn = msg.uid === currentUid
  const isEditing = editingId === msg.id
  const canModerate = isMod && !isOwn && roomId
  const isActionsOpen = activeMsgId === msg.id
  const timeStr = msg.createdAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  async function handleTimeout(minutes) {
    if (!roomId) return
    try {
      await timeoutUser(roomId, msg.uid, minutes, 'Timed out by moderator')
    } catch (err) {
      console.error('Timeout failed:', err)
    }
  }

  return (
    <div
      className={`msg-enter group relative flex items-start gap-0 pr-2 hover:bg-slate-800/40 transition-colors rounded-sm
        ${msg.isGrouped ? 'py-0.5 pl-4' : 'pt-2 pb-0.5 pl-4'}
        ${isActionsOpen ? 'bg-slate-800/40' : ''}`}
      role="article"
      aria-label={`Message from ${msg.displayName}`}
      onClick={e => {
        // Only toggle actions when tapping the message background itself —
        // not when clicking buttons, links, or other interactive children
        if (!e.target.closest('button, a, input, textarea, [role="button"]')) {
          onSetActive?.(msg.id)
        }
      }}
    >
      {/* Left column: avatar (first msg) or hover-timestamp (grouped) */}
      <div className="w-10 shrink-0 flex items-start justify-center pt-0.5">
        {!msg.isGrouped ? (
          showAvatars ? (
            msg.photoURL
              ? <img src={msg.photoURL} alt="" className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                  {msg.displayName?.[0]?.toUpperCase() || '?'}
                </div>
          ) : (
            // Avatar hidden — show initials-only letter
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-semibold">
              {msg.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )
        ) : (
          // Hover-reveal timestamp in the avatar gutter
          <span className="hidden group-hover:block text-[10px] text-slate-600 leading-none pt-1 select-none w-full text-center">
            {timeStr}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 ml-2.5">
        {/* Name + time row — only for first message in group */}
        {!msg.isGrouped && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{msg.displayName}</span>
            <span className="text-xs text-slate-500">{timeStr}</span>
            {msg.editedAt && <span className="text-xs text-slate-600">(edited)</span>}
            {msg.pinned && <span className="text-xs text-amber-500">📌</span>}
          </div>
        )}
        {/* Edited/pinned badge for grouped messages */}
        {msg.isGrouped && (msg.editedAt || msg.pinned) && (
          <div className="flex items-center gap-1 mb-0.5">
            {msg.editedAt && <span className="text-xs text-slate-600">(edited)</span>}
            {msg.pinned && <span className="text-xs text-amber-500">📌</span>}
          </div>
        )}

        {/* Reply reference */}
        {msg.replyTo && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 pl-2 border-l-2 border-slate-600">
            <span className="text-violet-400 font-medium">{msg.replyTo.displayName}:</span>
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
              className="flex-1 bg-slate-700 text-white border border-violet-500 rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              autoFocus
            />
            <button onClick={() => onEditSave(msg.id, editText)} className="text-green-400 hover:text-green-300 p-1"><MdCheck size={16} /></button>
            <button onClick={onEditCancel} className="text-slate-400 hover:text-white p-1"><MdClose size={16} /></button>
          </div>
        ) : (
          <div className="text-sm text-slate-200 leading-relaxed break-words">
            {msg.imageUrl && <img src={msg.imageUrl} alt="photo" loading="lazy" className="max-w-xs rounded-xl mb-1 cursor-pointer" />}
            {msg.gifUrl && <img src={msg.gifUrl} alt="gif" loading="lazy" className="max-w-xs rounded-xl mb-1" />}
            {msg.voiceUrl && <VoicePlayer url={msg.voiceUrl} />}
            {msg.text && <MessageRenderer text={msg.text} />}
            {/* Link previews — only for plain text messages (not image/gif/voice) */}
            {msg.text && !msg.imageUrl && !msg.gifUrl && !msg.voiceUrl &&
              extractUrls(msg.text).map(url => <LinkPreview key={url} url={url} />)
            }
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && Object.entries(msg.reactions).some(([, users]) => users.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-1">
            {Object.entries(msg.reactions).filter(([, users]) => users.length > 0).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={e => { e.stopPropagation(); onReact(msg.id, emoji) }}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                  users.includes(currentUid)
                    ? 'bg-violet-600/30 border-violet-500/50 text-violet-300'
                    : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}
              >
                {emoji} <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions — visible on hover (desktop) or tap (mobile) */}
      <div
        className={`${isActionsOpen ? 'flex' : 'hidden group-hover:flex'} items-center gap-0.5 absolute right-2 top-1 bg-slate-800/95 border border-slate-700/80 rounded-lg px-1 py-0.5 shadow-lg z-10`}
        role="toolbar"
        aria-label="Message actions"
        onClick={e => e.stopPropagation()} // prevent tap-toggle when clicking action buttons
      >
        <button onClick={() => onToggleEmoji(msg.id)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Add reaction" title="React">
          <FiSmile size={13} />
        </button>
        <button onClick={() => onReply(msg)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Reply to message" title="Reply">
          <MdReply size={13} />
        </button>
        {isOwn && (
          <>
            <button onClick={() => onEdit(msg.id, msg.text)} className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors" aria-label="Edit message" title="Edit">
              <MdEdit size={13} />
            </button>
            <button onClick={() => onDelete(msg.id)} className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors" aria-label="Delete message" title="Delete">
              <MdDelete size={13} />
            </button>
          </>
        )}
        {/* Pin: visible to message author (can edit own) or mods (can change pinned field) */}
        {(isOwn || isMod) && (
          <button onClick={() => msg.pinned ? onUnpin(msg.id) : onPin(msg.id)} className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors" aria-label={msg.pinned ? 'Unpin message' : 'Pin message'} title={msg.pinned ? 'Unpin' : 'Pin'}>
            <MdPushPin size={13} />
          </button>
        )}
        {!isOwn && (
          <button onClick={() => onReport(msg.id)} className="p-1 rounded text-slate-400 hover:text-orange-400 hover:bg-slate-700 transition-colors" aria-label="Report message" title="Report">
            <MdFlag size={13} />
          </button>
        )}
        {canModerate && (
          <div className="relative group/timeout">
            <button
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              aria-label="Timeout user"
              title="Timeout user"
            >
              <FiShield size={13} />
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover/timeout:flex flex-col bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden text-xs whitespace-nowrap">
              <div className="px-3 py-1.5 text-slate-500 font-semibold border-b border-slate-700">Timeout {msg.displayName}</div>
              {[1, 5, 10, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleTimeout(mins)}
                  className="px-3 py-2 text-left text-slate-300 hover:bg-red-900/40 hover:text-red-300 transition-colors"
                >
                  {mins < 60 ? `${mins} min` : '1 hour'}
                </button>
              ))}
            </div>
          </div>
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
