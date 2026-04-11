import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { requestNotificationPermission } from './notifications'
import { FiArrowLeft, FiBell, FiLock, FiUser, FiMonitor, FiTrash2, FiToggleLeft, FiToggleRight, FiSun, FiMoon, FiLogOut } from 'react-icons/fi'

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
  const { user, logout } = useAuth()

  // Read a boolean preference from localStorage with a fallback default
  function getBoolPref(key, defaultVal) {
    const v = localStorage.getItem(key)
    return v === null ? defaultVal : v === 'true'
  }

  const [notifMessages, setNotifMessagesRaw] = useState(() => getBoolPref('pref_notifMessages', true))
  const [notifMentions, setNotifMentionsRaw] = useState(() => getBoolPref('pref_notifMentions', true))
  const [soundEnabled,  setSoundEnabledRaw]  = useState(() => getBoolPref('pref_soundEnabled',  false))
  const [compactMode,   setCompactModeRaw]   = useState(() => getBoolPref('pref_compactMode',   false))
  const [showAvatars,   setShowAvatarsRaw]   = useState(() => getBoolPref('pref_showAvatars',   true))
  const [twoFactor,     setTwoFactorRaw]     = useState(() => getBoolPref('pref_twoFactor',     false))
  const [pushEnabled,   setPushEnabled]      = useState(Notification?.permission === 'granted')
  const [theme,         setTheme]            = useState(localStorage.getItem('theme') || 'dark')

  // Persist-and-set wrappers so every toggle immediately saves to localStorage
  function setNotifMessages(v) { localStorage.setItem('pref_notifMessages', String(v)); setNotifMessagesRaw(v) }
  function setNotifMentions(v) { localStorage.setItem('pref_notifMentions', String(v)); setNotifMentionsRaw(v) }
  function setSoundEnabled(v)  { localStorage.setItem('pref_soundEnabled',  String(v)); setSoundEnabledRaw(v)  }
  function setCompactMode(v)   { localStorage.setItem('pref_compactMode',   String(v)); setCompactModeRaw(v); document.body.classList.toggle('compact-mode', v) }
  function setShowAvatars(v)   { localStorage.setItem('pref_showAvatars',   String(v)); setShowAvatarsRaw(v)   }
  function setTwoFactor(v)     { localStorage.setItem('pref_twoFactor',     String(v)); setTwoFactorRaw(v)     }

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Re-apply compact mode class on mount (in case the page reloaded)
  useEffect(() => { document.body.classList.toggle('compact-mode', compactMode) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function enablePush() {
    if (pushEnabled) return
    const ok = await requestNotificationPermission(user?.uid)
    setPushEnabled(ok)
  }

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
            <SettingRow icon={FiBell} label="Push notifications" description={pushEnabled ? 'Push notifications are enabled' : 'Enable browser push notifications'}>
              <Toggle value={pushEnabled} onChange={enablePush} label="Toggle push notifications" />
            </SettingRow>
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
            <SettingRow icon={theme === 'dark' ? FiMoon : FiSun} label="Theme" description={theme === 'dark' ? 'Dark mode is active' : 'Light mode is active'}>
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                  ${theme === 'dark'
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:border-violet-500/50'
                    : 'bg-violet-500/10 text-violet-300 border-violet-500/30 hover:bg-violet-500/20'
                  }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <><FiMoon size={12} /> Dark</> : <><FiSun size={12} /> Light</>}
              </button>
            </SettingRow>
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
            <SettingRow icon={FiLock} label="Two-factor authentication" description="Additional sign-in security — coming soon">
              <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full uppercase tracking-wide">
                Soon
              </span>
            </SettingRow>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Account</h2>
          <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 px-4">
            <SettingRow icon={FiLogOut} label="Sign out" description="Sign out of Orbit on this device">
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-full border border-red-900/50 hover:bg-red-950/30"
              >
                <FiLogOut size={12} /> Sign out
              </button>
            </SettingRow>
          </div>
        </section>

        <p className="text-center text-zinc-700 text-xs pb-4">Orbit v0.4.0 · orbit-msg.web.app</p>
      </div>
    </div>
  )
}

export default Settings
