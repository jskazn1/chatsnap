import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, addDoc, deleteDoc, updateDoc,
  doc, setDoc, getDoc, getDocs, query, where, orderBy,
  limit, onSnapshot, serverTimestamp, arrayUnion, arrayRemove,
  Timestamp,
} from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyCBOgBnCSt91njdIo6Jk-Qhb40WR4yK1Pw",
  // authDomain matches the hosting domain so Google's OAuth popup opens at the
  // right URL. main.jsx intercepts /__/auth/ paths to prevent the React app
  // rendering inside the popup window.
  authDomain: "orbit-msg.web.app",
  projectId: "orbit-msg",
  storageBucket: "orbit-msg.firebasestorage.app",
  messagingSenderId: "873032840612",
  appId: "1:873032840612:web:7570ec3d6541624e403d31",
  measurementId: "G-PK5TSTPF0Z",
}

const app = initializeApp(firebaseConfig)

// Enable IndexedDB offline persistence with multi-tab support (Phase 4)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})
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
  // Moderation fields
  slowMode?: number             // seconds between messages per user (0 = off)
  moderators?: string[]         // UIDs with mod powers
  blockedWords?: string[]       // word filter list
  roomBans?: Record<string, { until: Timestamp; reason: string }> // uid → ban info
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
  const trimmedName = name.trim()
  const trimmedDesc = description.trim()
  if (!trimmedName) throw new Error('Room name cannot be empty.')
  if (trimmedName.length > 40) throw new Error('Room name must be 40 characters or fewer.')
  if (trimmedDesc.length > 120) throw new Error('Room description must be 120 characters or fewer.')
  const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!slug) throw new Error('Room name must contain at least one letter or number.')
  const joinCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : undefined
  const data: Omit<Room, 'id'> = {
    name: trimmedName, slug, description: trimmedDesc, isPrivate,
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
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', uid))
    return onSnapshot(q,
      snap => {
        const sorted = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Conversation))
          .sort((a, b) => (b.lastAt?.toMillis?.() ?? 0) - (a.lastAt?.toMillis?.() ?? 0))
        setConvos(sorted)
        setLoading(false)
      },
      _err => {
        setLoading(false)
      }
    )
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
  if (uid1 === uid2) throw new Error('Cannot start a conversation with yourself.')
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
  // Validate: short, non-empty, no dots (dots create nested Firestore paths → crash)
  if (!emoji || emoji.trim().length === 0 || emoji.length > 10 || emoji.includes('.')) return

  // Check current state to determine add vs remove
  const snap = await getDoc(doc(db, collPath, msgId))
  if (!snap.exists()) return
  const users: string[] = (snap.data().reactions || {})[emoji] || []

  // Use arrayUnion/arrayRemove (atomic server-side ops) to avoid race conditions
  // where two simultaneous reactions overwrite each other
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
  const trimmedReason = reason.trim().slice(0, 500) // cap report reason at 500 chars
  await addDoc(collection(db, 'reports'), { messageId, reportedBy, reason: trimmedReason, createdAt: serverTimestamp() })
}

// ─── User Operations ─────────────────────────────────────────────────────────

export async function searchUsers(term: string): Promise<UserProfile[]> {
  const trimmed = term.trim().slice(0, 50) // cap search term to 50 chars
  if (trimmed.length < 2) return []         // require at least 2 chars to avoid full-table scans
  const snap = await getDocs(query(
    collection(db, 'users'),
    where('displayName', '>=', trimmed),
    where('displayName', '<=', trimmed + '\uf8ff'),
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

// ─── Sprint 1: Room Message Sending + Unread Tracking ────────────────────────

/**
 * Send a message to a room and stamp roomMeta/{slug}.lastMessageAt
 * so unread badge logic can compare against the user's lastReadAt.
 */
export async function sendRoomMessage(roomSlug: string, message: Omit<ChatMessage, 'id'>): Promise<void> {
  // Find the room doc by slug to get its Firestore ID
  const snap = await getDocs(query(collection(db, 'rooms'), where('slug', '==', roomSlug), limit(1)))
  if (snap.empty) throw new Error(`Room "${roomSlug}" not found`)
  const roomId = snap.docs[0].id
  await addDoc(collection(db, 'rooms', roomId, 'messages'), { ...message, createdAt: serverTimestamp() })
  await setDoc(doc(db, 'roomMeta', roomSlug), { lastMessageAt: serverTimestamp() }, { merge: true })
}

/**
 * Listens to the roomMeta collection.
 * Returns a map of { [slug]: lastMessageAt_ms }
 */
export function useRoomMeta() {
  const [meta, setMeta] = useState<Record<string, number>>({})
  useEffect(() => {
    return onSnapshot(collection(db, 'roomMeta'), snap => {
      const m: Record<string, number> = {}
      snap.docs.forEach(d => {
        const ts = d.data().lastMessageAt
        m[d.id] = ts?.toMillis?.() ?? 0
      })
      setMeta(m)
    })
  }, [])
  return meta
}

/**
 * Listens to userReads/{uid}.
 * Returns a map of { [channelId]: lastReadAt_ms }
 * channelId = room slug for rooms, convoId for DMs.
 */
export function useUnreadCounts(uid: string) {
  const [reads, setReads] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, 'userReads', uid), snap => {
      if (!snap.exists()) { setReads({}); return }
      const data = snap.data()
      const r: Record<string, number> = {}
      Object.entries(data).forEach(([k, v]: [string, any]) => {
        r[k] = v?.toMillis?.() ?? (typeof v === 'number' ? v : 0)
      })
      setReads(r)
    })
  }, [uid])
  return reads
}

/**
 * Mark a channel (room slug or DM convoId) as read by writing
 * the current server timestamp to userReads/{uid}.{channelId}.
 */
export async function markChannelAsRead(uid: string, channelId: string): Promise<void> {
  await setDoc(doc(db, 'userReads', uid), { [channelId]: serverTimestamp() }, { merge: true })
}

// ─── Moderation ───────────────────────────────────────────────────────────────

/**
 * Set slow mode for a room. Only room owner / moderators should call this.
 * slowSeconds: 0 disables slow mode; any positive number is the per-user cooldown.
 */
export async function setRoomSlowMode(roomId: string, slowSeconds: number): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), { slowMode: slowSeconds })
}

/**
 * Update the blocked-words list for a room.
 */
export async function setRoomBlockedWords(roomId: string, words: string[]): Promise<void> {
  // Cap: max 200 entries, each entry max 100 chars, skip blank entries
  const sanitized = words
    .map(w => w.trim().slice(0, 100))
    .filter(Boolean)
    .slice(0, 200)
  await updateDoc(doc(db, 'rooms', roomId), { blockedWords: sanitized })
}

/**
 * Add a moderator to a room.
 */
export async function addModerator(roomId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), { moderators: arrayUnion(uid) })
}

/**
 * Remove a moderator from a room.
 */
export async function removeModerator(roomId: string, uid: string): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), { moderators: arrayRemove(uid) })
}

/**
 * Timeout a user in a room for `durationMinutes`.
 * Sets roomBans.{uid}.until to now + duration.
 * Moderators and room owners can call this.
 */
export async function timeoutUser(
  roomId: string, targetUid: string, durationMinutes: number, reason = 'Violation of community guidelines'
): Promise<void> {
  const until = new Date(Date.now() + durationMinutes * 60 * 1000)
  await updateDoc(doc(db, 'rooms', roomId), {
    [`roomBans.${targetUid}`]: { until: Timestamp.fromDate(until), reason },
  })
}

/**
 * Lift a timeout / ban from a user in a room.
 */
export async function liftTimeout(roomId: string, targetUid: string): Promise<void> {
  await updateDoc(doc(db, 'rooms', roomId), {
    [`roomBans.${targetUid}`]: null,
  })
}

/**
 * Check if a user is currently timed out in a room.
 * Returns { banned: true, until, reason } or { banned: false }.
 */
export async function checkRoomBan(
  roomId: string, uid: string
): Promise<{ banned: boolean; until?: Date; reason?: string }> {
  const snap = await getDoc(doc(db, 'rooms', roomId))
  if (!snap.exists()) return { banned: false }
  const bans = snap.data().roomBans || {}
  const entry = bans[uid]
  if (!entry) return { banned: false }
  const until = entry.until?.toDate()
  if (!until || until < new Date()) return { banned: false }
  return { banned: true, until, reason: entry.reason }
}

// ─── Online Presence ──────────────────────────────────────────────────────────

/**
 * Write the current user's online status to presence/{uid}.
 * Call on mount and resume (visibilitychange).
 */
export async function setPresence(uid: string): Promise<void> {
  await setDoc(doc(db, 'presence', uid), { online: true, lastSeen: serverTimestamp() }, { merge: true })
}

/**
 * Mark the user as offline. Call on beforeunload / visibility hidden.
 */
export async function clearPresence(uid: string): Promise<void> {
  await setDoc(doc(db, 'presence', uid), { online: false, lastSeen: serverTimestamp() }, { merge: true })
}

/**
 * Subscribe to presence docs for a set of UIDs.
 * Returns a Set of UIDs currently online.
 */
export function useOnlineUsers(uids: string[]): Set<string> {
  const [onlineSet, setOnlineSet] = useState<Set<string>>(new Set())
  const key = uids.slice().sort().join(',')
  useEffect(() => {
    if (!uids.length) return
    const unsubs = uids.map(uid =>
      onSnapshot(doc(db, 'presence', uid), snap => {
        const data = snap.data()
        setOnlineSet(prev => {
          const next = new Set(prev)
          if (data?.online) next.add(uid)
          else next.delete(uid)
          return next
        })
      })
    )
    return () => unsubs.forEach(u => u())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return onlineSet
}

/**
 * Checks a message text against a room's blocked-word list.
 * Returns the first matched word, or null if clean.
 */
export function checkWordFilter(text: string, blockedWords: string[]): string | null {
  if (!blockedWords?.length) return null
  const lower = text.toLowerCase()
  for (const word of blockedWords) {
    if (word && lower.includes(word.toLowerCase())) return word
  }
  return null
}

/**
 * Returns true if the user is a moderator or creator of the given room.
 */
export function isModerator(room: Room | null, uid: string): boolean {
  if (!room) return false
  return room.createdBy === uid || (room.moderators || []).includes(uid)
}
