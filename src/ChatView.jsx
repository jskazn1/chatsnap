import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { db, storage, sendDM, setTyping, useTyping, useBlockedUsers, blockUser, unblockUser, reportMessage, searchMessages, pinMessage, unpinMessage, useRoomInfo } from './db'
import { useAuth } from './AuthContext'
import { MdSend, MdEdit, MdDelete, MdReply, MdClose, MdCheck, MdPushPin, MdFlag, MdBlock, MdGif } from 'react-icons/md'
import { FiCamera, FiSmile, FiSearch, FiX, FiMic } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import { ref, uploadString } from 'firebase/storage'
import MessageRenderer from './MessageRenderer'
import GifPicker from './GifPicker'
import { VoiceRecorder, VoicePlayer } from './VoiceMessage'

const bucket =
  'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
const suffix = '.jpg?alt=media'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥']

function ChatView({ messages, loading, mode, roomName, conversationId, otherUser }) {
  const { user } = useAuth()
  const name = user.displayName || user.email
  const [showCamera, setShowCamera] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [searchMode, setSearchMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const messagesRef = useRef(null)
  const typingLocation = mode === 'room' ? `room:${roomName}` : `dm:${conversationId}`
  const typers = useTyping(typingLocation, user.uid)
  const typingTimeout = useRef(null)
  const blockedUsers = useBlockedUsers(user.uid)
  const roomInfo = useRoomInfo(mode === 'room' ? roomName : null)

  const isAdmin = roomInfo?.admins?.includes(user.uid) || false

  // Filter blocked users from messages
  const visibleMessages = (searchResults || messages).filter(
    (m) => !blockedUsers.includes(m.uid)
  )

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = 0
    }
  }, [messages])

  const handleTyping = useCallback(() => {
    setTyping(typingLocation, user.uid, name, true)
    clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      setTyping(typingLocation, user.uid, name, false)
    }, 3000)
  }, [typingLocation, user.uid, name])

  async function handleSend(text) {
    try {
      setSendError(null)
      setTyping(typingLocation, user.uid, name, false)
      clearTimeout(typingTimeout.current)

      const msgData = {
        text,
        name,
        uid: user.uid,
        photoURL: user.photoURL || null,
        ts: new Date(),
        ...(replyTo ? { replyTo: { id: replyTo.id, text: replyTo.text, name: replyTo.name } } : {}),
      }

      if (mode === 'room') {
        await db.send({ ...msgData, room: roomName })
      } else {
        await sendDM(conversationId, msgData)
      }
      setReplyTo(null)
    } catch (e) {
      setSendError('Failed to send message. Please try again.')
    }
  }

  async function handleSendGif(gifUrl) {
    setShowGifPicker(false)
    try {
      const msgData = {
        gif: gifUrl,
        name,
        uid: user.uid,
        photoURL: user.photoURL || null,
        ts: new Date(),
      }
      if (mode === 'room') {
        await db.send({ ...msgData, room: roomName })
      } else {
        await sendDM(conversationId, msgData)
      }
    } catch {
      setSendError('Failed to send GIF.')
    }
  }

  async function handleSendVoice(audioUrl, duration) {
    try {
      const msgData = {
        voice: audioUrl,
        voiceDuration: duration,
        name,
        uid: user.uid,
        photoURL: user.photoURL || null,
        ts: new Date(),
      }
      if (mode === 'room') {
        await db.send({ ...msgData, room: roomName })
      } else {
        await sendDM(conversationId, msgData)
      }
    } catch {
      setSendError('Failed to send voice message.')
    }
  }

  async function takePicture(img) {
    setShowCamera(false)
    try {
      setSendError(null)
      const imgID = Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
      const storageRef = ref(storage, imgID + '.jpg')
      await uploadString(storageRef, img, 'data_url')

      const msgData = {
        img: imgID,
        name,
        uid: user.uid,
        photoURL: user.photoURL || null,
        ts: new Date(),
      }

      if (mode === 'room') {
        await db.send({ ...msgData, room: roomName })
      } else {
        await sendDM(conversationId, msgData)
      }
    } catch (e) {
      setSendError('Failed to send picture. Please try again.')
    }
  }

  async function handleDelete(msgId) {
    try {
      if (mode === 'room') {
        await db.delete(msgId)
      } else {
        await db.deleteDM(conversationId, msgId)
      }
    } catch (e) {
      setSendError('Failed to delete message.')
    }
  }

  async function handleEditSave(msgId) {
    if (!editText.trim()) return
    try {
      const data = { text: editText.trim(), edited: true }
      if (mode === 'room') {
        await db.update(msgId, data)
      } else {
        await db.updateDM(conversationId, msgId, data)
      }
      setEditingId(null)
      setEditText('')
    } catch (e) {
      setSendError('Failed to edit message.')
    }
  }

  async function handleReact(msgId, emoji) {
    try {
      const msg = messages.find((m) => m.id === msgId)
      const alreadyReacted = msg?.reactions?.[emoji]?.includes(user.uid)
      if (mode === 'room') {
        alreadyReacted
          ? await db.unreact(msgId, user.uid, emoji)
          : await db.react(msgId, user.uid, emoji)
      } else {
        alreadyReacted
          ? await db.unreactDM(conversationId, msgId, user.uid, emoji)
          : await db.reactDM(conversationId, msgId, user.uid, emoji)
      }
    } catch {
      // silently fail reactions
    }
  }

  async function handleReport(msg) {
    const reason = prompt('Why are you reporting this message?')
    if (!reason) return
    try {
      await reportMessage(user.uid, msg.id, reason, msg)
      alert('Report submitted. Thank you.')
    } catch {
      alert('Failed to submit report.')
    }
  }

  async function handleBlock(uid) {
    if (blockedUsers.includes(uid)) {
      await unblockUser(user.uid, uid)
    } else {
      if (confirm('Block this user? Their messages will be hidden.')) {
        await blockUser(user.uid, uid)
      }
    }
  }

  async function handlePin(msg) {
    if (!roomName) return
    try {
      const pinData = { id: msg.id, text: msg.text || '(media)', name: msg.name }
      if (roomInfo?.pinnedMessages?.some((p) => p.id === msg.id)) {
        await unpinMessage(roomName, pinData)
      } else {
        await pinMessage(roomName, pinData)
      }
    } catch {
      setSendError('Failed to pin message.')
    }
  }

  async function handleSearch() {
    if (!searchTerm.trim()) { setSearchResults(null); return }
    if (mode === 'room' && roomName) {
      const results = await searchMessages(roomName, searchTerm.trim())
      setSearchResults(results)
    }
  }

  const title = mode === 'room' ? `# ${roomName}` : otherUser?.name || 'Direct Message'

  return (
    <div className="chat-view">
      {showCamera && <Camera takePicture={takePicture} />}

      <div className="chat-header">
        <span className="chat-header-title">{title}</span>
        <div className="chat-header-spacer" />
        {mode === 'room' && (
          <button
            className="msg-action-btn"
            onClick={() => { setSearchMode(!searchMode); setSearchResults(null); setSearchTerm('') }}
            title="Search messages"
          >
            {searchMode ? <FiX /> : <FiSearch />}
          </button>
        )}
      </div>

      {searchMode && (
        <div className="search-bar">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
            placeholder="Search messages..."
            autoFocus
          />
          <button onClick={handleSearch}>Search</button>
          {searchResults && (
            <span className="search-count">{searchResults.length} results</span>
          )}
        </div>
      )}

      {roomInfo?.pinnedMessages?.length > 0 && !searchMode && (
        <div className="pinned-bar">
          <MdPushPin />
          <span className="pinned-text">
            {roomInfo.pinnedMessages[roomInfo.pinnedMessages.length - 1]?.text}
          </span>
        </div>
      )}

      <ul className="messages" ref={messagesRef}>
        {loading && <li className="status-message">Loading messages...</li>}
        {!loading && visibleMessages.length === 0 && (
          <li className="status-message">
            {searchResults ? 'No matching messages' : 'No messages yet. Say hello!'}
          </li>
        )}
        {sendError && <li className="status-message error">{sendError}</li>}
        {visibleMessages.map((m) => (
          <MessageItem
            key={m.id}
            m={m}
            currentUid={user.uid}
            currentName={name}
            isEditing={editingId === m.id}
            editText={editText}
            isAdmin={isAdmin}
            isBlocked={blockedUsers.includes(m.uid)}
            isPinned={roomInfo?.pinnedMessages?.some((p) => p.id === m.id)}
            showPinOption={mode === 'room'}
            onEditStart={() => { setEditingId(m.id); setEditText(m.text || '') }}
            onEditChange={setEditText}
            onEditSave={() => handleEditSave(m.id)}
            onEditCancel={() => { setEditingId(null); setEditText('') }}
            onDelete={() => handleDelete(m.id)}
            onReply={() => setReplyTo(m)}
            onReact={(emoji) => handleReact(m.id, emoji)}
            onReport={() => handleReport(m)}
            onBlock={() => handleBlock(m.uid)}
            onPin={() => handlePin(m)}
          />
        ))}
      </ul>

      {typers.length > 0 && (
        <div className="typing-indicator">
          {typers.join(', ')} {typers.length === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {replyTo && (
        <div className="reply-bar">
          <div className="reply-preview">
            Replying to <strong>{replyTo.name}</strong>: {replyTo.text?.slice(0, 50)}
            {replyTo.text?.length > 50 ? '...' : ''}
          </div>
          <button className="reply-cancel" onClick={() => setReplyTo(null)}>
            <MdClose />
          </button>
        </div>
      )}

      {showGifPicker && (
        <GifPicker onSelect={handleSendGif} onClose={() => setShowGifPicker(false)} />
      )}

      <TextInput
        showCamera={() => setShowCamera(true)}
        showGifPicker={() => setShowGifPicker(!showGifPicker)}
        onSend={handleSend}
        onSendVoice={handleSendVoice}
        onTyping={handleTyping}
      />
    </div>
  )
}

const MessageItem = memo(function MessageItem({
  m, currentUid, currentName,
  isEditing, editText, isAdmin, isBlocked, isPinned, showPinOption,
  onEditStart, onEditChange, onEditSave, onEditCancel,
  onDelete, onReply, onReact, onReport, onBlock, onPin,
}) {
  const isMe = m.uid ? m.uid === currentUid : m.name === currentName
  const [showActions, setShowActions] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)

  const reactions = m.reactions || {}
  const hasReactions = Object.values(reactions).some((arr) => arr?.length > 0)

  return (
    <li
      className="message-wrap"
      data-from={isMe ? 'me' : 'you'}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojis(false) }}
    >
      {!isMe && (
        <div className="msg-avatar">
          {m.photoURL ? (
            <img src={m.photoURL} alt="" />
          ) : (
            <span>{m.name ? m.name[0].toUpperCase() : '?'}</span>
          )}
        </div>
      )}
      <div className="message">
        {!isMe && <div className="msg-name">{m.name}</div>}

        {m.replyTo && (
          <div className="msg-reply-ref">
            <span className="msg-reply-name">{m.replyTo.name}</span>
            <span className="msg-reply-text">{m.replyTo.text?.slice(0, 60)}</span>
          </div>
        )}

        {isEditing ? (
          <div className="msg-edit-box">
            <input
              value={editText}
              onChange={(e) => onEditChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onEditSave(); if (e.key === 'Escape') onEditCancel() }}
              autoFocus
            />
            <button onClick={onEditSave} className="msg-action-btn"><MdCheck /></button>
            <button onClick={onEditCancel} className="msg-action-btn"><MdClose /></button>
          </div>
        ) : (
          <div className="msg-text">
            {m.text && <MessageRenderer text={m.text} />}
            {m.edited && <span className="msg-edited">(edited)</span>}
            {m.img && <img src={bucket + m.img + suffix} alt={m.name + "'s photo"} />}
            {m.gif && <img src={m.gif} alt="GIF" className="msg-gif" />}
            {m.voice && <VoicePlayer url={m.voice} duration={m.voiceDuration} />}
            {isPinned && <span className="msg-pin-badge"><MdPushPin /> Pinned</span>}
          </div>
        )}

        {hasReactions && (
          <div className="msg-reactions">
            {Object.entries(reactions).map(([emoji, uids]) =>
              uids?.length > 0 ? (
                <button
                  key={emoji}
                  className={`reaction-chip ${uids.includes(currentUid) ? 'mine' : ''}`}
                  onClick={() => onReact(emoji)}
                >
                  {emoji} {uids.length}
                </button>
              ) : null
            )}
          </div>
        )}

        {showActions && !isEditing && (
          <div className="msg-actions">
            <button onClick={() => setShowEmojis(!showEmojis)} className="msg-action-btn" title="React">
              <FiSmile />
            </button>
            <button onClick={onReply} className="msg-action-btn" title="Reply">
              <MdReply />
            </button>
            {isMe && m.text && (
              <button onClick={onEditStart} className="msg-action-btn" title="Edit">
                <MdEdit />
              </button>
            )}
            {(isMe || isAdmin) && (
              <button onClick={onDelete} className="msg-action-btn delete" title="Delete">
                <MdDelete />
              </button>
            )}
            {showPinOption && (isMe || isAdmin) && (
              <button onClick={onPin} className="msg-action-btn" title={isPinned ? 'Unpin' : 'Pin'}>
                <MdPushPin />
              </button>
            )}
            {!isMe && (
              <>
                <button onClick={onReport} className="msg-action-btn" title="Report">
                  <MdFlag />
                </button>
                <button onClick={onBlock} className="msg-action-btn" title={isBlocked ? 'Unblock' : 'Block'}>
                  <MdBlock />
                </button>
              </>
            )}
          </div>
        )}

        {showEmojis && (
          <div className="emoji-picker-mini">
            {EMOJI_LIST.map((e) => (
              <button key={e} onClick={() => { onReact(e); setShowEmojis(false) }}>{e}</button>
            ))}
          </div>
        )}
      </div>
    </li>
  )
})

function TextInput({ showCamera, showGifPicker, onSend, onSendVoice, onTyping }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  return (
    <div className="text-input">
      <button
        onClick={showCamera}
        aria-label="Take a picture"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        <FiCamera style={{ height: 15, width: 15 }} />
      </button>
      <button
        onClick={showGifPicker}
        aria-label="Send GIF"
        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
      >
        <MdGif style={{ height: 20, width: 20 }} />
      </button>
      <input
        ref={inputRef}
        value={text}
        aria-label="Message text"
        placeholder="Write your message"
        onChange={(e) => {
          setText(e.target.value)
          if (e.target.value) onTyping()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && text) {
            onSend(text)
            setText('')
          }
        }}
      />
      {text ? (
        <button
          className="send-logo"
          aria-label="Send message"
          onClick={() => {
            onSend(text)
            setText('')
            inputRef.current?.focus()
          }}
        >
          <MdSend />
        </button>
      ) : (
        <VoiceRecorder onSend={onSendVoice} />
      )}
    </div>
  )
}

export default ChatView
