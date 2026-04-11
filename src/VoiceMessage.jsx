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

      const MAX_DURATION_S = 5 * 60 // 5-minute hard limit

      mediaRecorder.current.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(d => {
          const next = d + 1
          if (next >= MAX_DURATION_S) {
            // Auto-stop when the limit is reached
            if (mediaRecorder.current?.state === 'recording') {
              mediaRecorder.current.stop()
            }
            clearInterval(timerRef.current)
            setRecording(false)
          }
          return next
        })
      }, 1000)
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

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-slate-800/80 border border-red-500/30 rounded-xl">
        {/* Recording indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-400 text-xs font-mono font-medium">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>
        {/* Mini waveform */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5 bg-violet-400 rounded-full animate-pulse"
              style={{ height: `${6 + Math.sin(i * 0.9) * 4}px`, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
        {/* Stop button */}
        <button
          onClick={stopRecording}
          className="w-7 h-7 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-400 text-white transition-colors shrink-0"
          aria-label="Stop recording"
          title="Stop recording"
        >
          <FiSquare size={11} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={startRecording}
      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      aria-label="Record voice message"
      title="Record voice message"
    >
      <FiMic size={18} />
    </button>
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
        className="w-8 h-8 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 text-white transition-colors flex-shrink-0"
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
            className="absolute inset-y-0 left-0 bg-violet-500 rounded-full transition-all"
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
