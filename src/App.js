import React, {useState, useEffect, useRef} from 'react';
import './App.css';
import './media.css';
import {db, useDB} from './db'
import NamePicker from './NamePicker.js';
import { MdSend } from "react-icons/md";
import { BrowserRouter, Route} from 'react-router-dom'
import { FiCamera, FiSun, FiMoon } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import * as firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"
import Div100vh from 'react-div-100vh'

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return [theme, toggleTheme]
}

function App() {
  useEffect(()=>{
    const {pathname} = window.location
    if(pathname.length<2) window.location.pathname="home"
  }, [])
  return <BrowserRouter>
    <Route path="/:room" component={Room}/>
  </BrowserRouter>
}

function Room(props) {
  const {room} = props.match.params
  const [name, setName] = useState('')
  const {messages, loading} = useDB(room)
  const [showCamera, setShowCamera] = useState(false)
  const [sendError, setSendError] = useState(null)
  const messagesRef = useRef(null)
  const [theme, toggleTheme] = useTheme()

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = 0
    }
  }, [messages])

  async function takePicture(img) {
    setShowCamera(false)
    try {
      setSendError(null)
      const imgID = Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
      const storageRef = firebase.storage().ref()
      const ref = storageRef.child(imgID + '.jpg')
      await ref.putString(img, 'data_url')
      await db.send({
        img: imgID, name, ts: new Date(), room
      })
    } catch (e) {
      setSendError('Failed to send picture. Please try again.')
    }
  }

  return <Div100vh>
    <div className="app-container">

    {showCamera && <Camera takePicture={takePicture} />}

    <header>
      <span className="header-title">Chatter</span>
      <span className="header-room"># {room}</span>
      <div className="header-spacer" />
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      >
        {theme === 'light' ? <FiMoon /> : <FiSun />}
      </button>
      <NamePicker onSave={setName} />
    </header>

    <ul className="messages" ref={messagesRef}>
      {loading && <li className="status-message">Loading messages...</li>}
      {!loading && messages.length === 0 && <li className="status-message">No messages yet. Say hello!</li>}
      {sendError && <li className="status-message error">{sendError}</li>}
      {messages.map((m)=> <Message key={m.id}
                                     m={m}
                                     name={name}/>)}
    </ul>

    <TextInput
      showCamera={()=>setShowCamera(true)}
      onSend={async (text)=> {
        try {
          setSendError(null)
          await db.send({
            text, name, ts: new Date(), room
          })
        } catch (e) {
          setSendError('Failed to send message. Please try again.')
        }
    }} />
    </div>
  </Div100vh>
  }

  const bucket = 'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
  const suffix = '.jpg?alt=media'

  const Message = React.memo(function Message({m, name}){
    return <li className="message-wrap"
    data-from={m.name===name?'me':'you'}>
    <div className="message">
      <div className ="msg-name">{m.name}</div>
      <div className ="msg-text">
        {m.text}
        {m.img && <img src={bucket + m.img + suffix} alt={m.name + "'s photo"} />}
      </div>
    </div>
  </li>
  })

  function TextInput(props){
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  return <div className="text-input">
    <button onClick={props.showCamera}
      aria-label="Take a picture"
      style={{background:'var(--surface-2)', color:'var(--text-muted)'}}>
      <FiCamera style={{height:15, width:15}} />
    </button>
    <input ref={inputRef} value={text}
      aria-label="Message text"
      placeholder="Write your message"
      onChange={e=> setText(e.target.value)}
      onKeyDown={e=> {
        if(e.key === 'Enter' && text) {
          props.onSend(text)
          setText('')
        }
      }}
    />
    <button className="send-logo"
    aria-label="Send message"
    onClick={()=> {
      if(text) {
        props.onSend(text)
      }
      setText('')
      inputRef.current && inputRef.current.focus()
    }}
    disabled={!text}>
    {<MdSend />}
    </button>
  </div>
}


export default App;
