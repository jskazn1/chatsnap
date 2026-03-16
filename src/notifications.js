import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc } from 'firebase/firestore'
import { store } from './db'

let messaging = null

try {
  messaging = getMessaging()
} catch {
  // FCM not supported (e.g., Safari without push API)
}

export async function requestNotificationPermission(uid) {
  if (!messaging) return false

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
    })

    if (token) {
      // Save token to user's profile
      await updateDoc(doc(store, 'users', uid), { fcmToken: token })
      return true
    }
  } catch (e) {
    console.error('Failed to get notification permission:', e)
  }
  return false
}

export function onForegroundMessage(callback) {
  if (!messaging) return () => {}
  return onMessage(messaging, (payload) => {
    callback(payload)
  })
}
