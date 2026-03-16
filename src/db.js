import { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore'
import { getStorage, ref, uploadString } from 'firebase/storage'
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

function useDB(room) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
      })
      setLoading(false)
    })

    return unsub
  }, [room])

  return { messages, loading }
}

const db = {}
db.send = function (msg) {
  return addDoc(collection(store, MESSAGES), msg)
}
db.delete = function (id) {
  return deleteDoc(doc(store, MESSAGES, id))
}

export { db, useDB, storage, auth, store }
