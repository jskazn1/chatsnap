/**
 * PWAInstallPrompt — shows a native-style install banner for the PWA.
 *
 * Logic:
 *   - Listens for the browser's `beforeinstallprompt` event
 *   - Tracks visit count in localStorage; shows the prompt starting on the 2nd visit
 *   - Dismissing sets a localStorage flag so it never shows again
 *   - On iOS (where beforeinstallprompt is unsupported) shows a manual "Add to Home Screen" tip
 */
import { useState, useEffect } from 'react'
import { FiDownload, FiX, FiShare } from 'react-icons/fi'

function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Never show if already dismissed or installed
    if (localStorage.getItem('pwaPromptDismissed')) return

    // Detect iOS (Safari doesn't fire beforeinstallprompt)
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Increment visit counter
    const visits = parseInt(localStorage.getItem('orbitVisitCount') || '0') + 1
    localStorage.setItem('orbitVisitCount', String(visits))

    if (ios) {
      // Show iOS tip on 2nd+ visit if not already installed as standalone
      const isStandalone = window.navigator.standalone === true
      if (!isStandalone && visits >= 2) setShow(true)
      return
    }

    // Chrome/Android: capture beforeinstallprompt
    const handler = e => {
      e.preventDefault()
      setDeferredPrompt(e)
      if (visits >= 2) setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setShow(false)
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      localStorage.setItem('pwaPromptDismissed', 'true')
    }
  }

  function handleDismiss() {
    setShow(false)
    localStorage.setItem('pwaPromptDismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto bg-slate-800 border border-slate-600 text-white rounded-2xl shadow-2xl shadow-black/50 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
        {isIOS ? <FiShare size={16} className="text-white" /> : <FiDownload size={16} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Install Orbit</p>
        {isIOS ? (
          <p className="text-xs text-slate-400 mt-0.5">
            Tap <FiShare size={10} className="inline mx-0.5" /> then <strong>Add to Home Screen</strong>
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-0.5">Add to your home screen for instant access</p>
        )}
      </div>

      {!isIOS && (
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors shrink-0"
        >
          Install
        </button>
      )}

      <button
        onClick={handleDismiss}
        className="p-1 text-slate-500 hover:text-white transition-colors shrink-0"
        aria-label="Dismiss"
      >
        <FiX size={16} />
      </button>
    </div>
  )
}

export default PWAInstallPrompt
