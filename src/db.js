import {useState, useEffect} from 'react'
import * as firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"

let store
const coll = 'messages'

function useDB(room) {
    const [messages, setMessages] = useState([])
    function add(m) {
        setMessages(current => {
            const msgs = [m, ...current]
            msgs.sort((a,b)=> b.ts.seconds - a.ts.seconds)
            return msgs
        })
    }
    function remove(id) {
        setMessages(current=> current.filter(m=> m.id!==id))
    }
    useEffect(() => {
        store.collection(coll)
        .where('room','==',room)
        .onSnapshot(snap=> snap.docChanges().forEach(c=> {
            const {doc, type} = c
            if (type==='added') add({...doc.data(),id:doc.id})
            if (type==='removed') remove(doc.id)
        }))
    }, [])
    return messages
}

const db = {}
db.send = function(msg) {
    return store.collection(coll).add(msg)
}
db.delete = function(id) {
    return store.collection(coll).doc(id).delete()
}

export { db, useDB }

const firebaseConfig = {
    apiKey: "AIzaSyCN9tbxNhqa6lnmZNMZCjD0fUWjdrrtEHY",
    authDomain: "jordansk-chatter202020.firebaseapp.com",
    databaseURL: "https://jordansk-chatter202020.firebaseio.com",
    projectId: "jordansk-chatter202020",
    storageBucket: "jordansk-chatter202020.appspot.com",
    messagingSenderId: "641423998667",
    appId: "1:641423998667:web:53ca6f59b00827dbbe254e",
    measurementId: "G-25QEBFG3BZ"
  };

firebase.initializeApp(firebaseConfig)
store = firebase.firestore()