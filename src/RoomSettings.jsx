import { useState } from 'react'
import { setRoomSlowMode, setRoomBlockedWords, addModerator, removeModerator } from './db'
import { FiX, FiClock, FiShield, FiFilter, FiPlus, FiTrash2 } from 'react-icons/fi'

const SLOW_MODE_OPTIONS = [
  { label: 'Off',     value: 0  },
  { label: '5s',      value: 5  },
  { label: '10s',     value: 10 },
  { label: '30s',     value: 30 },
  { label: '1 min',   value: 60 },
  { label: '5 min',   value: 300},
]

function RoomSettings({ room, onClose }) {
  const [saving, setSaving]     = useState(false)
  const [slowMode, setSlowMode] = useState(room?.slowMode ?? 0)
  const [words, setWords]       = useState((room?.blockedWords || []).join('\n'))
  const [newMod, setNewMod]     = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const mods = room?.moderators || []

  async function saveSlowMode(val) {
    setSlowMode(val)
    setSaving(true)
    try {
      await setRoomSlowMode(room.id, val)
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  async function saveWordFilter() {
    const list = words.split('\n').map(w => w.trim()).filter(Boolean)
    setSaving(true)
    try {
      await setRoomBlockedWords(room.id, list)
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleAddMod() {
    const uid = newMod.trim()
    if (!uid) return
    setSaving(true)
    try {
      await addModerator(room.id, uid)
      setNewMod('')
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveMod(uid) {
    setSaving(true)
    try {
      await removeModerator(room.id, uid)
      showSaved()
    } finally {
      setSaving(false)
    }
  }

  function showSaved() {
    setSavedMsg('Saved')
    setTimeout(() => setSavedMsg(''), 1500)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Room settings"
    >
      <div className="w-full max-w-md bg-[#0f0d14] rounded-3xl border border-zinc-800/60 shadow-2xl overflow-hidden fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-800/50">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center">
            <FiShield size={16} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">Room Settings</h2>
            <p className="text-xs text-zinc-500">#{room?.name}</p>
          </div>
          {savedMsg && <span className="text-xs text-green-400 font-medium">{savedMsg}</span>}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close room settings"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">

          {/* ── Slow mode ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiClock size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Slow Mode</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Limits how often each user can send a message. Effective against flood attacks and bots.
            </p>
            <div className="flex flex-wrap gap-2">
              {SLOW_MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => saveSlowMode(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                    ${slowMode === opt.value
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-white'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-zinc-800/60" />

          {/* ── Word filter ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiFilter size={14} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Word Filter</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Block messages containing these words or phrases. One entry per line. Case-insensitive.
            </p>
            <textarea
              value={words}
              onChange={e => setWords(e.target.value)}
              placeholder="slur1&#10;spam phrase&#10;badword"
              rows={5}
              className="w-full bg-zinc-900/60 text-white text-xs placeholder-zinc-600 border border-zinc-700 rounded-2xl px-4 py-3
                focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all font-mono"
            />
            <button
              onClick={saveWordFilter}
              disabled={saving}
              className="mt-2 w-full py-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              Save word filter
            </button>
          </section>

          <div className="h-px bg-zinc-800/60" />

          {/* ── Moderators ── */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <FiShield size={14} className="text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Moderators</h3>
            </div>
            <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
              Moderators can timeout users and delete messages. Add by user UID (found in their profile).
            </p>

            {/* Existing mods */}
            {mods.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {mods.map(uid => (
                  <div key={uid} className="flex items-center gap-2 px-3 py-2 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
                    <div className="w-6 h-6 rounded-full bg-violet-900/50 flex items-center justify-center">
                      <FiShield size={10} className="text-violet-400" />
                    </div>
                    <span className="flex-1 text-xs text-zinc-300 font-mono truncate">{uid}</span>
                    <button
                      onClick={() => handleRemoveMod(uid)}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                      aria-label="Remove moderator"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add mod */}
            <div className="flex gap-2">
              <input
                value={newMod}
                onChange={e => setNewMod(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddMod()}
                placeholder="Paste user UID…"
                className="flex-1 bg-zinc-900/60 text-white text-xs placeholder-zinc-600 border border-zinc-700 rounded-xl px-3 py-2.5
                  focus:outline-none focus:border-violet-500/50 transition-all"
              />
              <button
                onClick={handleAddMod}
                disabled={!newMod.trim() || saving}
                className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors disabled:opacity-40"
                aria-label="Add moderator"
              >
                <FiPlus size={14} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default RoomSettings
