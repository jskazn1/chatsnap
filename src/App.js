import React, {useState, useEffect} from 'react';
import './App.css';
import {db, useDB} from './db'
import NamePicker from './NamePicker.js';
import { MdSend } from "react-icons/md";
import { BrowserRouter, Route} from 'react-router-dom'

  function App() {
    useEffect(()=>{
      const {pathname} = window.location
      if(pathname.length<2) window.location.pathname="home"
    }, [])
    return <BrowserRouter>
      <Route path="/:room" component={Room}/>
    </BrowserRouter>
  }
  
  function Room() {
  const [name, setName] = useState('Jordan')
  const messages = useDB()

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
        return <div key={i} className="message-wrap"
          from={m.name===name?'me':'you'}>
          <div className="message">
            <div className ="msg-name">{m.name}</div>
            <div className ="msg-text">{m.text}</div>
          </div>
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
