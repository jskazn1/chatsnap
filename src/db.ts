import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore, collection, addDoc, deleteDoc, updateDoc,
  doc, setDoc, getDoc, getDocs, query, where, orderBy,
  limit, onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp,
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
  measurementId: "G-25QEBFG3BZ",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const store = db
export const storage = getStorage(app)
export const auth = getAuth(app)

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  text: string
  uid: string
  displayName: string
  photoURL: string | null
  createdAt: Timestamp | null
  editedAt?: Timestamp | null
  reactions?: Record<string, string[]>
  pinned?: boolean
  replyTo?: { id: string; text: string; displayName: string } | null
  gifUrl?: string
  voiceUrl?: string
  imageUrl?: string
}

export interface Room {
  id: string
  name: string
  slug: string
  description: string
  isPrivate: boolean
  joinCode?: string
  memberCount: number
  members?: string[]
  createdAt: Timestamp | null
  createdBy: string
}

export interface Conversation {
  id: string
  participants: string[]
  lastMessage?: string
  lastAt?: Timestamp | null
}

export interface UserProfile {
  uid: string
  displayName: string
  photoURL: string | null
  email?: string
  fcmToken?: string
  blockedUsers?: string[]
}

// ─── Room Hooks ──────────────────────────────────────────────────────────────

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('name'))
    return onSnapshot(q, snap => {
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() } as Room)))
      setLoading(false)
    })
  }, [])
  return { rooms, loading }
}

export function useRoomMessages(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!roomId) { setMessages([]); setLoading(false); return }
    const q = query(collection(db, 'rooms', roomId, 'messages'), orderBy('createdAt', 'asc'), limit(100))
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
      setLoading(false)
    })
  }, [roomId])
  return { messages, loading }
}

export function useRoomInfo(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  useEffect(() => {
    if (!roomId) { setRoom(null); return }
    return onSnapshot(doc(db, 'rooms', roomId), snap => {
      if (snap.exists()) setRoom({ id: snap.id, ...snap.data() } as Room)
    })
  }, [roomId])
  return room
}

export async function createRoom(name: string, description: string, isPrivate: boolean, uid: string): Promise<Room> {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const joinCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined
  const data: Omit<Room, 'id'> = {
    name, slug, description, isPrivate,
    ...(joinCode && { joinCode }),
    memberCount: 1,
    members: [uid],
    createdAt: null,
    createdBy: uid,
  }
  const ref = await addDoc(collection(db, 'rooms'), { ...data, createdAt: serverTimestamp() })
  return { id: ref.id, ...data }
}

export async function joinRoom(roomId: string, uid: string, joinCode?: string): Promise<void> {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  if (!snap.exists()) throw new Error('Room not found')
  const room = snap.data() as Room
  if (room.isPrivate && room.joinCode && room.joinCode !== joinCode) throw new Error('Invalid join code')
  await updateDoc(doc(db, 'rooms', roomId), { members: arrayUnion(uid), memberCount: (room.memberCount || 0) + 1 })
}

// ─── DM Hooks ────────────────────────────────────────────────────────────────

export function useConversations(uid: string) {
  const [convos, setConvos] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid), orderBy('lastAt', 'desc'))
    return onSnapshot(q, snap => {
      setConvos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation)))
      setLoading(false)
    })
  }, [uid])
  return { convos, loading }
}

export function useDMMessages(convoId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!convoId) { setMessages([]); setLoading(false); return }
    const q = query(collection(db, 'conversations', convoId, 'messages'), orderBy('createdAt', 'asc'), limit(100))
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)))
      setLoading(false)
    })
  }, [convoId])
  return { messages, loading }
}

export async function createOrGetConversation(uid1: string, uid2: string): Promise<string> {
  const participants = [uid1, uid2].sort()
  const snap = await getDocs(query(collection(db, 'conversations'), where('participants', '==', participants)))
  if (!snap.empty) return snap.docs[0].id
  const ref = await addDoc(collection(db, 'conversations'), { participants, createdAt: serverTimestamp(), lastAt: serverTimestamp() })
  return ref.id
}

export async function sendDM(convoId: string, message: Omit<ChatMessage, 'id'>): Promise<void> {
  await addDoc(collection(db, 'conversations', convoId, 'messages'), { ...message, createdAt: serverTimestamp() })
  await updateDoc(doc(db, 'conversations', convoId), {
    lastMessage: message.text || (message.gifUrl ? '🎞️ GIF' : message.voiceUrl ? '🎤 Voice' : '📷 Photo'),
    lastAt: serverTimestamp(),
  })
}

// ─── Message Operations ──────────────────────────────────────────────────────

export async function editMessage(collPath: string, msgId: string, text: string): Promise<void> {
  await updateDoc(doc(db, collPath, msgId), { text, editedAt: serverTimestamp() })
}

export async function deleteMessage(collPath: string, msgId: string): Promise<void> {
  await deleteDoc(doc(db, collPath, msgId))
}

export async function addReaction(collPath: string, msgId: string, emoji: string, uid: string): Promise<void> {
  const snap = await getDoc(doc(db, collPath, msgId))
  if (!snap.exists()) return
  const users: string[] = (snap.data().reactions || {})[emoji] || []
  await updateDoc(doc(db, collPath, msgId), {
    [`reactions.${emoji}`]: users.includes(uid) ? arrayRemove(uid) : arrayUnion(uid),
  })
}

export async function pinMessage(collPath: string, msgId: string): Promise<void> {
  await updateDoc(doc(db, collPath, msgId), { pinned: true })
}

export async function unpinMessage(collPath: string, msgId: string): Promise<void> {
  await updateDoc(doc(db, collPath, msgId), { pinned: false })
}

export async function reportMessage(messageId: string, reportedBy: string, reason: string): Promise<void> {
  await addDoc(collection(db, 'reports'), { messageId, reportedBy, reason, createdAt: serverTimestamp() })
}

// ─── User Operations ─────────────────────────────────────────────────────────

export async function searchUsers(term: string): Promise<UserProfile[]> {
  if (!term.trim()) return []
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('displayName', '>=', term),
    where('displayName', '<=', term + '\uf8ff'),
    limit(10),
  ))
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile))
}

export function useBlockedUsers(uid: string) {
  const [blockedUsers, setBlockedUsers] = useState<string[]>([])
  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, 'users', uid), snap => {
      if (snap.exists()) setBlockedUsers(snap.data().blockedUsers || [])
    })
  }, [uid])
  return blockedUsers
}

export async function blockUser(uid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayUnion(targetUid) })
}

export async function unblockUser(uid: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { blockedUsers: arrayRemove(targetUid) })
}

// ─── Typing Indicators ───────────────────────────────────────────────────────

export async function setTyping(channelId: string, uid: string, isTyping: boolean): Promise<void> {
  await setDoc(doc(db, 'typing', channelId), { [uid]: isTyping ? Date.now() : null }, { merge: true })
}

export function useTyping(channelId: string | null, currentUid: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  useEffect(() => {
    if (!channelId) return
    return onSnapshot(doc(db, 'typing', channelId), snap => {
      if (!snap.exists()) { setTypingUsers([]); return }
      const now = Date.now()
      const active = Object.entries(snap.data())
        .filter(([uid, ts]) => uid !== currentUid && ts && (now - (ts as number)) < 5000)
        .map(([uid]) => uid)
      setTypingUsers(active)
    })
  }, [channelId, currentUid])
  return typingUsers
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchMessages(collPath: string, term: string): Promise<ChatMessage[]> {
  const snap = await getDocs(query(collection(db, collPath), orderBy('createdAt', 'desc'), limit(200)))
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as ChatMessage))
    .filter(m => m.text?.toLowerCase().includes(term.toLowerCase()))
}
