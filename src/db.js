import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCN9tbxNhqa6lnmZNMZCjD0fUWjdrrtEHY",
  authDomain: "jordansk-chatter202020.firebaseapp.com",
  databaseURL: "https://jordansk-chatter202020.firebaseio.com",
  projectId: "jordansk-chatter202020",
  storageBucket: "jordansk-chatter202020.appspot.com",
  messagingSenderId: "641423998667",
  appId: "1:641423998667:web:53ca6f59b00827dbbe254e",
  measurementId: "G-25QEBFG3BZ"
}

const app = initializeApp(firebaseConfig)
const store = getFirestore(app)
const storage = getStorage(app)
const auth = getAuth(app)

const MESSAGES = 'messages'
const CONVERSATIONS = 'conversations'
const ROOMS = 'rooms'

// ── Room metadata ───────────────────────────────────────────────────

function useRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(store, ROOMS), orderBy('name'))
    const unsub = onSnapshot(q, (snap) => {
      setRooms(snap.docs.map((d) => ({ ...d.data(), id: d.id })))
      setLoading(false)
    })
    return unsub
  }, [])

  return { rooms, loading }
}

function useRoomInfo(roomId) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(store, ROOMS, roomId), (snap) => {
      if (snap.exists()) setRoom({ ...snap.data(), id: snap.id })
      else setRoom(null)
    })
    return unsub
  }, [roomId])

  return room
}

async function createRoom({ name, description, isPrivate, joinCode, createdBy }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
  const existing = await getDocs(query(collection(store, ROOMS), where('slug', '==', slug), limit(1)))
  if (!existing.empty) throw new Error('A room with this name already exists')

  return addDoc(collection(store, ROOMS), {
    name,
    slug,
    description: description || '',
    isPrivate: isPrivate || false,
    joinCode: isPrivate ? (joinCode || Math.random().toString(36).slice(2, 8)) : null,
    createdBy,
    admins: [createdBy],
    members: [createdBy],
    pinnedMessages: [],
    createdAt: serverTimestamp(),
  })
}

async function joinRoom(roomId, uid, joinCode) {
  const snap = await getDoc(doc(store, ROOMS, roomId))
  if (!snap.exists()) throw new Error('Room not found')
  const data = snap.data()
  if (data.isPrivate && data.joinCode !== joinCode) throw new Error('Invalid join code')
  return updateDoc(doc(store, ROOMS, roomId), { members: arrayUnion(uid) })
}

async function leaveRoom(roomId, uid) {
  return updateDoc(doc(store, ROOMS, roomId), {
    members: arrayRemove(uid),
    admins: arrayRemove(uid),
  })
}

async function pinMessage(roomId, messageSnapshot) {
  return updateDoc(doc(store, ROOMS, roomId), {
    pinnedMessages: arrayUnion(messageSnapshot),
  })
}

async function unpinMessage(roomId, messageSnapshot) {
  return updateDoc(doc(store, ROOMS, roomId), {
    pinnedMessages: arrayRemove(messageSnapshot),
  })
}

async function kickUser(roomId, uid) {
  return updateDoc(doc(store, ROOMS, roomId), {
    members: arrayRemove(uid),
    banned: arrayUnion(uid),
  })
}

async function promoteAdmin(roomId, uid) {
  return updateDoc(doc(store, ROOMS, roomId), { admins: arrayUnion(uid) })
}

// ── Room messages ───────────────────────────────────────────────────

function useRoomMessages(room) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!room) { setLoading(false); return }
    setMessages([])
    setLoading(true)

    const q = query(
      collection(store, MESSAGES),
      where('room', '==', room),
      orderBy('ts', 'desc'),
      limit(100)
    )

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((c) => {
        const { doc: d, type } = c
        if (type === 'added') {
          setMessages((current) => {
            const msgs = [{ ...d.data(), id: d.id }, ...current]
            msgs.sort((a, b) => b.ts.seconds - a.ts.seconds)
            return msgs
          })
        }
        if (type === 'removed') {
          setMessages((current) => current.filter((m) => m.id !== d.id))
        }
        if (type === 'modified') {
          setMessages((current) =>
            current.map((m) => (m.id === d.id ? { ...d.data(), id: d.id } : m))
          )
        }
      })
      setLoading(false)
    })

    return unsub
  }, [room])

  return { messages, loading }
}

// ── DM conversations ────────────────────────────────────────────────

function useConversations(uid) {
  const [convos, setConvos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }

    const q = query(
      collection(store, CONVERSATIONS),
      where('participantIds', 'array-contains', uid),
      orderBy('updatedAt', 'desc')
    )

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ ...d.data(), id: d.id }))
      setConvos(list)
      setLoading(false)
    })

    return unsub
  }, [uid])

  return { convos, loading }
}

function useDMMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!conversationId) { setLoading(false); return }
    setMessages([])
    setLoading(true)

    const q = query(
      collection(store, CONVERSATIONS, conversationId, 'messages'),
      orderBy('ts', 'desc'),
      limit(100)
    )

    const unsub = onSnapshot(q, (snap) => {
      snap.docChanges().forEach((c) => {
        const { doc: d, type } = c
        if (type === 'added') {
          setMessages((current) => {
            const msgs = [{ ...d.data(), id: d.id }, ...current]
            msgs.sort((a, b) => b.ts.seconds - a.ts.seconds)
            return msgs
          })
        }
        if (type === 'removed') {
          setMessages((current) => current.filter((m) => m.id !== d.id))
        }
        if (type === 'modified') {
          setMessages((current) =>
            current.map((m) => (m.id === d.id ? { ...d.data(), id: d.id } : m))
          )
        }
      })
      setLoading(false)
    })

    return unsub
  }, [conversationId])

  return { messages, loading }
}

async function createOrGetConversation(myUid, myName, myPhoto, otherUid, otherName, otherPhoto) {
  const q = query(
    collection(store, CONVERSATIONS),
    where('participantIds', 'array-contains', myUid)
  )
  const snap = await getDocs(q)
  const existing = snap.docs.find((d) => d.data().participantIds.includes(otherUid))
  if (existing) return existing.id

  const convoRef = await addDoc(collection(store, CONVERSATIONS), {
    participantIds: [myUid, otherUid],
    participants: {
      [myUid]: { name: myName, photoURL: myPhoto || null },
      [otherUid]: { name: otherName, photoURL: otherPhoto || null },
    },
    lastMessage: null,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
  return convoRef.id
}

async function sendDM(conversationId, msg) {
  await addDoc(collection(store, CONVERSATIONS, conversationId, 'messages'), msg)
  await updateDoc(doc(store, CONVERSATIONS, conversationId), {
    lastMessage: { text: msg.text || '(photo)', name: msg.name, ts: msg.ts },
    updatedAt: serverTimestamp(),
  })
}

// ── User search ─────────────────────────────────────────────────────

async function searchUsers(searchTerm) {
  const q = query(
    collection(store, 'users'),
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
}

// ── Message search ──────────────────────────────────────────────────

async function searchMessages(room, searchTerm) {
  // Client-side search: fetch recent messages and filter
  const q = query(
    collection(store, MESSAGES),
    where('room', '==', room),
    orderBy('ts', 'desc'),
    limit(500)
  )
  const snap = await getDocs(q)
  const term = searchTerm.toLowerCase()
  return snap.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .filter((m) => m.text?.toLowerCase().includes(term) || m.name?.toLowerCase().includes(term))
}

// ── Block / Mute ────────────────────────────────────────────────────

function useBlockedUsers(uid) {
  const [blocked, setBlocked] = useState([])

  useEffect(() => {
    if (!uid) return
    const unsub = onSnapshot(doc(store, 'users', uid), (snap) => {
      if (snap.exists()) {
        setBlocked(snap.data().blockedUsers || [])
      }
    })
    return unsub
  }, [uid])

  return blocked
}

async function blockUser(myUid, otherUid) {
  return updateDoc(doc(store, 'users', myUid), {
    blockedUsers: arrayUnion(otherUid),
  })
}

async function unblockUser(myUid, otherUid) {
  return updateDoc(doc(store, 'users', myUid), {
    blockedUsers: arrayRemove(otherUid),
  })
}

// ── Reports ─────────────────────────────────────────────────────────

async function reportMessage(reporterUid, messageId, reason, messageData) {
  return addDoc(collection(store, 'reports'), {
    reporterUid,
    messageId,
    reason,
    messageText: messageData.text || null,
    messageAuthorUid: messageData.uid,
    messageAuthorName: messageData.name,
    room: messageData.room || null,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

// ── Room message operations ─────────────────────────────────────────

const db = {}

db.send = function (msg) {
  return addDoc(collection(store, MESSAGES), msg)
}

db.delete = function (id) {
  return deleteDoc(doc(store, MESSAGES, id))
}

db.update = function (id, data) {
  return updateDoc(doc(store, MESSAGES, id), data)
}

db.react = function (id, uid, emoji) {
  return updateDoc(doc(store, MESSAGES, id), {
    [`reactions.${emoji}`]: arrayUnion(uid),
  })
}

db.unreact = function (id, uid, emoji) {
  return updateDoc(doc(store, MESSAGES, id), {
    [`reactions.${emoji}`]: arrayRemove(uid),
  })
}

// ── DM message operations ───────────────────────────────────────────

db.deleteDM = function (conversationId, messageId) {
  return deleteDoc(doc(store, CONVERSATIONS, conversationId, 'messages', messageId))
}

db.updateDM = function (conversationId, messageId, data) {
  return updateDoc(doc(store, CONVERSATIONS, conversationId, 'messages', messageId), data)
}

db.reactDM = function (conversationId, messageId, uid, emoji) {
  return updateDoc(doc(store, CONVERSATIONS, conversationId, 'messages', messageId), {
    [`reactions.${emoji}`]: arrayUnion(uid),
  })
}

db.unreactDM = function (conversationId, messageId, uid, emoji) {
  return updateDoc(doc(store, CONVERSATIONS, conversationId, 'messages', messageId), {
    [`reactions.${emoji}`]: arrayRemove(uid),
  })
}

// ── Typing indicators ───────────────────────────────────────────────

function setTyping(location, uid, name, isTyping) {
  const ref = doc(store, 'typing', location)
  if (isTyping) {
    return setDoc(ref, { [uid]: { name, ts: new Date() } }, { merge: true })
  } else {
    return setDoc(ref, { [uid]: null }, { merge: true })
  }
}

function useTyping(location, myUid) {
  const [typers, setTypers] = useState([])

  useEffect(() => {
    if (!location) return
    const unsub = onSnapshot(doc(store, 'typing', location), (snap) => {
      if (!snap.exists()) { setTypers([]); return }
      const data = snap.data()
      const now = Date.now()
      const active = Object.entries(data)
        .filter(([uid, val]) => uid !== myUid && val && val.ts)
        .filter(([, val]) => now - val.ts.toDate?.()?.getTime?.() < 10000 || now - val.ts?.seconds * 1000 < 10000)
        .map(([uid, val]) => val.name)
      setTypers(active)
    })
    return unsub
  }, [location, myUid])

  return typers
}

const useDB = useRoomMessages

export {
  db,
  useDB,
  useRoomMessages,
  useRooms,
  useRoomInfo,
  createRoom,
  joinRoom,
  leaveRoom,
  pinMessage,
  unpinMessage,
  kickUser,
  promoteAdmin,
  useConversations,
  useDMMessages,
  createOrGetConversation,
  sendDM,
  searchUsers,
  searchMessages,
  useBlockedUsers,
  blockUser,
  unblockUser,
  reportMessage,
  setTyping,
  useTyping,
  storage,
  auth,
  store,
}
