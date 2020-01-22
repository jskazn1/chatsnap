import React, {useState, useEffect} from 'react';
import './App.css';
import {db} from './db'
import NamePicker from './NamePicker.js';
import { MdSend } from "react-icons/md";

function App() {
  const [messages, setMessages] = useState([])
  const [name, setName] = useState('Jordan')

  useEffect(()=>{
    db.listen({
      receive: m=> {
        setMessages(current=> [m, ...current])
      },
    })
  }, [])

  return <main>

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
        return <div key={i} className="message-wrap">
          <div className="message">{m.text}</div>
        </div>
      })}
    </div>
    <TextInput onSend={(text)=> {
      db.send({
        text, name, ts: new Date(),
      })
    }} />

  </main>
  }


  function TextInput(props){
  var [text, setText] = useState('')

  return <div className="text-input">
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
