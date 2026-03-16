import { useState, useRef } from 'react'
import { FiMic, FiSquare, FiPlay, FiPause } from 'react-icons/fi'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './db'

function VoiceRecorder({ onSend }) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timerRef = useRef(null)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorder.current = new MediaRecorder(stream)
      chunks.current = []

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        if (blob.size > 0) {
          const audioId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
          const storageRef = ref(storage, `voice/${audioId}.webm`)
          await uploadBytes(storageRef, blob)
          const url = await getDownloadURL(storageRef)
          onSend(url, duration)
        }
      }

      mediaRecorder.current.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      // Microphone permission denied
    }
  }

  function stopRecording() {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.stop()
    }
    setRecording(false)
    clearInterval(timerRef.current)
  }

  const mins = Math.floor(duration / 60)
  const secs = duration % 60

  return (
    <div className="voice-recorder">
      {recording ? (
        <>
          <span className="voice-timer">
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <button className="voice-stop" onClick={stopRecording} aria-label="Stop recording">
            <FiSquare />
          </button>
        </>
      ) : (
        <button className="voice-start" onClick={startRecording} aria-label="Record voice message">
          <FiMic />
        </button>
      )}
    </div>
  )
}

function VoicePlayer({ url, duration }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(null)

  function toggle() {
    if (!audioRef.current) {
      audioRef.current = new Audio(url)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <div className="voice-player" onClick={toggle}>
      {playing ? <FiPause /> : <FiPlay />}
      <div className="voice-wave" />
      {duration && (
        <span className="voice-duration">
          {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
        </span>
      )}
    </div>
  )
}

export { VoiceRecorder, VoicePlayer }
