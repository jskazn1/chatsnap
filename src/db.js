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
  authDomain: "jordansk-chatter202020.web.app",
  databaseURL: "https://jordansk-chatter202020.firebaseio.com",
  projectId: "jordansk-chatter202020",
  storageBucket: "jordansk-chatter202020.appspot.com",
  messagingSenderId: "641423998667",
  appId: "1:641423998667:web:53ca6f59b00827dbbe254e",
  measurementId: "G-25QEBFG3BZ"
}
