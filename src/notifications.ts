import { getMessaging, getToken, onMessage, MessagePayload } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { store } from './db'

let messaging: ReturnType<typeof getMessaging> | null = null

try {
  messaging = getMessaging()
} catch {
  // FCM not supported (e.g., Safari without push API)
}

export async function requestNotificationPermission(uid: string): Promise<boolean> {
  if (!messaging) return false

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) {
    console.warn(
      '[notifications] VITE_FIREBASE_VAPID_KEY is not set. ' +
      'Push notifications will not work. Set it in your .env file (see .env.example).'
    )
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
    const token = await getToken(messaging, { vapidKey })
    if (token) {
      await updateDoc(doc(store, 'users', uid), { fcmToken: token })
      return true
    }
  } catch (e) {
    console.error('Failed to get notification permission:', e)
  }
  return false
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  if (!messaging) return () => {}
  return onMessage(messaging, callback)
}
