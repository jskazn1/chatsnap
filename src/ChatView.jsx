import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { db, storage, sendDM, setTyping, useTyping } from './db'
import { useAuth } from './AuthContext'
import { MdSend, MdEdit, MdDelete, MdReply, MdClose, MdCheck } from 'react-icons/md'
import { FiCamera, FiSmile } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import { ref, uploadString } from 'firebase/storage'

const bucket =
  'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
const suffix = '.jpg?alt=media'

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥']

function ChatView({ messages, loading, mode, roomName, conversationId, otherUser }) {
  const { user } = useAuth()
  const name = user.displayName || user.email
  const [showCamera, setShowCamera] = useState(false)
  const [sendError, setSendError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const messagesRef = useRef(null)
  const typingLocation = mode === 'room' ? `room:${roomName}` : `dm:${conversationId}`
  const typers = useTyping(typingLocation, user.uid)
  const typingTimeout = useRef(null)

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
    } catch (e) {
      // silently fail reactions
    }
  }

  const title = mode === 'room' ? `# ${roomName}` : otherUser?.name || 'Direct Message'

  return (
    <div className="chat-view">
      {showCamera && <Camera takePicture={takePicture} />}

      <div className="chat-header">
        <span className="chat-header-title">{title}</span>
      </div>

      <ul className="messages" ref={messagesRef}>
        {loading && <li className="status-message">Loading messages...</li>}
        {!loading && messages.length === 0 && (
          <li className="status-message">No messages yet. Say hello!</li>
        )}
        {sendError && <li className="status-message error">{sendError}</li>}
        {messages.map((m) => (
          <MessageItem
            key={m.id}
            m={m}
            currentUid={user.uid}
            currentName={name}
            isEditing={editingId === m.id}
            editText={editText}
            onEditStart={() => { setEditingId(m.id); setEditText(m.text || '') }}
            onEditChange={setEditText}
            onEditSave={() => handleEditSave(m.id)}
            onEditCancel={() => { setEditingId(null); setEditText('') }}
            onDelete={() => handleDelete(m.id)}
            onReply={() => setReplyTo(m)}
            onReact={(emoji) => handleReact(m.id, emoji)}
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

      <TextInput
        showCamera={() => setShowCamera(true)}
        onSend={handleSend}
        onTyping={handleTyping}
      />
    </div>
  )
}

const MessageItem = memo(function MessageItem({
  m, currentUid, currentName,
  isEditing, editText, onEditStart, onEditChange, onEditSave, onEditCancel,
  onDelete, onReply, onReact,
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
            {m.text}
            {m.edited && <span className="msg-edited">(edited)</span>}
            {m.img && <img src={bucket + m.img + suffix} alt={m.name + "'s photo"} />}
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
            {isMe && (
              <button onClick={onDelete} className="msg-action-btn delete" title="Delete">
                <MdDelete />
              </button>
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

function TextInput({ showCamera, onSend, onTyping }) {
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
      <button
        className="send-logo"
        aria-label="Send message"
        onClick={() => {
          if (text) {
            onSend(text)
          }
          setText('')
          inputRef.current?.focus()
        }}
        disabled={!text}
      >
        <MdSend />
      </button>
    </div>
  )
}

export default ChatView
