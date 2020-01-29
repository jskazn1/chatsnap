import React, {useState, useEffect} from 'react';
import './App.css';
import {db, useDB} from './db'
import NamePicker from './NamePicker.js';
import { MdSend } from "react-icons/md";
import { BrowserRouter, Route} from 'react-router-dom'
import { FiSend, FiCamera } from 'react-icons/fi'
import Camera from 'react-snap-pic'


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
      {messages.map((m,i)=> {
        return <div key={i} className="message-wrap"
          from={m.name===name?'me':'you'}>
          <div className="message">
            <div className ="msg-name">{m.name}</div>
            <div className ="msg-text">{m.text}</div>
          </div>
        </div>
      })}
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
