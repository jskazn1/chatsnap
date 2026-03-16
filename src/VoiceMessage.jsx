import { useState, useRef, useEffect } from 'react'
import { FiMic, FiSquare, FiPlay, FiPause } from 'react-icons/fi'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './db'

export function VoiceRecorder({ onSend }) {
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

      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      mediaRecorder.current.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
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
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
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

  useEffect(() => () => clearInterval(timerRef.current), [])

  const mins = Math.floor(duration / 60)
  const secs = duration % 60

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl">
      {recording ? (
        <>
          {/* Pulsing indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs font-mono font-medium">
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </span>
          </div>
          {/* Waveform animation */}
          <div className="flex items-center gap-0.5 flex-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full animate-pulse"
                style={{
                  height: `${8 + Math.sin(i * 0.8) * 6}px`,
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0.6 + (i % 3) * 0.1,
                }}
              />
            ))}
          </div>
          <button
            onClick={stopRecording}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white transition-colors flex-shrink-0"
            title="Stop recording"
          >
            <FiSquare size={14} />
          </button>
        </>
      ) : (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 text-sm transition-all"
        >
          <FiMic size={15} />
          <span>Record voice</span>
        </button>
      )}
    </div>
  )
}

export function VoicePlayer({ url, duration }) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrentTime(0) }
    const onTime = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        setCurrentTime(Math.floor(audio.currentTime))
      }
    }
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('timeupdate', onTime)
    return () => {
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('timeupdate', onTime)
    }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play()
      setPlaying(true)
    }
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio?.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
  }

  const totalSecs = duration || 0
  const displaySecs = playing ? currentTime : totalSecs
  const mins = Math.floor(displaySecs / 60)
  const secs = displaySecs % 60

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl min-w-[200px] max-w-[280px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <button
        onClick={togglePlay}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex-shrink-0"
      >
        {playing ? <FiPause size={14} /> : <FiPlay size={14} className="ml-0.5" />}
      </button>

      <div className="flex flex-col gap-1 flex-1 min-w-0">
        {/* Progress bar */}
        <div
          className="h-1.5 bg-slate-600 rounded-full cursor-pointer relative overflow-hidden"
          onClick={handleSeek}
        >
          <div
            className="absolute inset-y-0 left-0 bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 text-xs font-mono">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
          <FiMic size={10} className="text-slate-500 mt-0.5" />
        </div>
      </div>
    </div>
  )
}
