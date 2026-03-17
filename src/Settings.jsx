import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { FiArrowLeft, FiBell, FiLock, FiUser, FiMonitor, FiTrash2, FiToggleLeft, FiToggleRight } from 'react-icons/fi'

function SettingRow({ icon: Icon, label, description, children }) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-zinc-800/60 last:border-0">
      <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
        <Icon size={17} className="text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ value, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      aria-label={label}
      onClick={() => onChange(!value)}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-full"
    >
      {value
        ? <FiToggleRight size={28} className="text-violet-500" />
        : <FiToggleLeft  size={28} className="text-zinc-600" />
      }
    </button>
  )
}

function Settings() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [notifMessages, setNotifMessages]   = useState(true)
  const [notifMentions, setNotifMentions]   = useState(true)
  const [soundEnabled,  setSoundEnabled]    = useState(false)
  const [compactMode,   setCompactMode]     = useState(false)
  const [showAvatars,   setShowAvatars]     = useState(true)
  const [twoFactor,     setTwoFactor]       = useState(false)

  return (
    <div className="min-h-screen bg-[#0c0b10] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-[#0c0b10]/90 backdrop-blur-sm border-b border-zinc-800/50">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Go back"
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="text-base font-semibold tracking-tight">Settings</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Notifications */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Notifications</h2>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4">
            <SettingRow icon={FiBell} label="New messages" description="Notify on every new message in joined rooms">
              <Toggle value={notifMessages} onChange={setNotifMessages} label="Toggle message notifications" />
            </SettingRow>
            <SettingRow icon={FiBell} label="Mentions only" description="Only notify when @mentioned">
              <Toggle value={notifMentions} onChange={setNotifMentions} label="Toggle mention notifications" />
            </SettingRow>
            <SettingRow icon={FiMonitor} label="Sound" description="Play a sound for new messages">
              <Toggle value={soundEnabled} onChange={setSoundEnabled} label="Toggle notification sound" />
            </SettingRow>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Appearance</h2>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4">
            <SettingRow icon={FiMonitor} label="Compact mode" description="Reduce spacing between messages">
              <Toggle value={compactMode} onChange={setCompactMode} label="Toggle compact mode" />
            </SettingRow>
            <SettingRow icon={FiUser} label="Show avatars" description="Display profile pictures in the message feed">
              <Toggle value={showAvatars} onChange={setShowAvatars} label="Toggle avatar display" />
            </SettingRow>
          </div>
        </section>

        {/* Privacy & Security */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Privacy & Security</h2>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4">
            <SettingRow icon={FiLock} label="Two-factor authentication" description="Add an extra layer of sign-in security">
              <Toggle value={twoFactor} onChange={setTwoFactor} label="Toggle two-factor authentication" />
            </SettingRow>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Account</h2>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4">
            <SettingRow icon={FiTrash2} label="Sign out" description="Sign out of Orbit on this device">
              <button
                onClick={logout}
                className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-red-900/50 hover:bg-red-950/30"
              >
                Sign out
              </button>
            </SettingRow>
          </div>
        </section>

        <p className="text-center text-zinc-700 text-xs pb-4">Orbit v1.0 · orbit-msg.web.app</p>
      </div>
    </div>
  )
}

export default Settings
