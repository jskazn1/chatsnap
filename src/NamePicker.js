import React, {useState, useRef, useEffect} from 'react'
import { FiEdit, FiSave } from 'react-icons/fi'

function NamePicker(props) {
    const [name, setName] = useState('')
    const [showName, setShowName] = useState(false)
    const inputEl = useRef(null)
    const onSaveRef = useRef(props.onSave)
    onSaveRef.current = props.onSave

    function save(){
        inputEl.current.focus()
        if(name && !showName) {
            onSaveRef.current(name)
            localStorage.setItem('name', name)
        }
        setShowName(!showName)
    }

    useEffect(()=> {
        const n = localStorage.getItem('name')
        if(n) {
            setName(n)
            onSaveRef.current(n)
            setShowName(true)
        }
    }, [])

    return <div className="edit-username">
    <input value={name} ref={inputEl}
        className="name-input"
        placeholder="Username"
        style={{display: showName ? 'none' : 'flex'}}
        onChange={e=> setName(e.target.value)}
        onKeyPress={e=> {
            if(e.key==='Enter') save()
        }}
    />

    {showName && <div>{name}</div>}

    <button onClick={save} className="name-button">
        {showName ? <FiEdit /> : <FiSave />}
    </button>
    </div>
    }

    export default NamePicker