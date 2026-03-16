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

// ── Room messages (existing) ────────────────────────────────────────

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
  // Check if conversation already exists
  const q = query(
    collection(store, CONVERSATIONS),
    where('participantIds', 'array-contains', myUid)
  )
  const snap = await getDocs(q)
  const existing = snap.docs.find((d) => {
    const data = d.data()
    return data.participantIds.includes(otherUid)
  })
  if (existing) return existing.id

  // Create new conversation
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
  // Simple prefix search on displayName
  const q = query(
    collection(store, 'users'),
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(10)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }))
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
  // location = "room:roomName" or "dm:conversationId"
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

// Keep old export name for backwards compat
const useDB = useRoomMessages

export {
  db,
  useDB,
  useRoomMessages,
  useConversations,
  useDMMessages,
  createOrGetConversation,
  sendDM,
  searchUsers,
  setTyping,
  useTyping,
  storage,
  auth,
  store,
}
