import React, {useState} from 'react';
import './App.css';

function App() {
  return <main>

    <header> 
      <img className="logo" 
        alt="logo"
        src="https://www.plantronics.com/etc/designs/plantronics/clientlib-all/img/poly-logo.png" 
      /> 
      Chatter
    </header>

    <TextInput onSend={t=> console.log(t)} />

  </main>
}


function TextInput(props){
  var [text, setText] = useState('')
  
  return <div className="text-input">
    <input value={text} 
      placeholder="Write your message"
      onChange={e=> setText(e.target.value)}
    />
    <button onClick={()=> {
      props.onSend(text)
      setText('')
    }}>
      <img className="send-logo" 
        src="https://cdn1.iconfinder.com/data/icons/outline-17/24/send-512.png" />
    </button>
  </div>
}


export default App;
