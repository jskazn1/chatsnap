import React, {useState, useEffect} from 'react';
import './App.css';
import {db, useDB} from './db'
import NamePicker from './NamePicker.js';
import { MdSend } from "react-icons/md";
import { BrowserRouter, Route} from 'react-router-dom'
import { FiSend, FiCamera } from 'react-icons/fi'
import Camera from 'react-snap-pic'
import * as firebase from "firebase/app"
import "firebase/firestore"
import "firebase/storage"

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
  const [name, setName] = useState('Jordan')
  const messages = useDB(room)
  const [showCamera, setShowCamera] = useState(false)

  function takePicture(){
    takePicture = (img) => {
      console.log(img)
      setShowCamera(false)
    }
  }
  
  async function takePicture(img) {
    setShowCamera(false)
    const imgID = Math.random().toString(36).substring(7)
    var storageRef = firebase.storage().ref()
    var ref = storageRef.child(imgID + '.jpg')
    await ref.putString(img, 'data_url')
    db.send({ 
      img: imgID, name, ts: new Date(), room 
    })
  }

  return <main>
    
    {showCamera && <Camera takePicture={takePicture} />}

    <header> 
      <img className="logo" 
        alt="logo"
        src="https://www.plantronics.com/etc/designs/plantronics/clientlib-all/img/poly-logo.png" 
      /> 
      Chatter
      <NamePicker onSave={setName} />
    </header>

    <div className={"messages"}>
      {messages.map((m,i)=> <Message key={i} 
                                     m={m} 
                                     name={name}/>)}
    </div>

    <TextInput 
      sendMessage={text=> props.onSend(text)} 
      showCamera={()=>setShowCamera(true)}
      onSend={(text)=> {
        db.send({
          text, name, ts: new Date(), room
        })
    }} />
  </main>
  }

  const bucket = 'https://firebasestorage.googleapis.com/v0/b/jordansk-chatter202020.appspot.com/o/'
  const suffix = '.jpg?alt=media'

  function Message({m, name}){
    return <div className="message-wrap"
    from={m.name===name?'me':'you'}>
    <div className="message">
      <div className ="msg-name">{m.name}</div>
      <div className ="msg-text">
        {m.text}
        {m.img && <img src={bucket + m.img + suffix} alt="picture" />}
      </div>
    </div>
  </div>
  }

  function TextInput(props){
  var [text, setText] = useState('')

  return <div className="text-input">
    <button onClick={props.showCamera}
      style={{left:10, right:'auto'}}>
      <FiCamera style={{height:15, width:15}} />
    </button>
    <input value={text} 
      placeholder="Write your message"
      onChange={e=> setText(e.target.value)}
    />
    <button className="send-logo" onClick={()=> {
      if(text) {
        props.onSend(text)
      }
      setText('')
    }}
    disabled={!text}>
    {<MdSend />}
    </button>
  </div>
}


export default App;
