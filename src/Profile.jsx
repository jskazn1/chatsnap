import { useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, store, storage } from './db'
import Camera from 'react-snap-pic'
import { FiCamera, FiArrowLeft, FiUser, FiCheck, FiX, FiUpload } from 'react-icons/fi'

function Profile({ onClose }) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.photoURL || null)
  const [showCamera, setShowCamera] = useState(false)
  const fileRef = useRef(null)
  const pendingFile = useRef(null)

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2MB')
      return
    }
    pendingFile.current = file
    setAvatarPreview(URL.createObjectURL(file))
    setError(null)
  }

  function handleCameraCapture(dataUrl) {
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
        pendingFile.current = file
        setAvatarPreview(dataUrl)
        setShowCamera(false)
        setError(null)
      })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Display name is required')
      return
    }
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      let photoURL = user.photoURL
      if (pendingFile.current) {
        const avatarRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(avatarRef, pendingFile.current)
        photoURL = await getDownloadURL(avatarRef)
        pendingFile.current = null
      }
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim(),
        photoURL,
      })
      await setDoc(doc(store, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName.trim(),
        email: user.email,
        photoURL,
      }, { merge: true })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        <div className="flex items-center gap-3 p-4 bg-slate-900">
          <button
            onClick={() => setShowCamera(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <FiArrowLeft size={20} />
          </button>
          <span className="text-white font-medium">Take a photo</span>
        </div>
        <div className="flex-1">
          <Camera
            onCapture={handleCameraCapture}
            onClose={() => setShowCamera(false)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <FiArrowLeft size={20} />
        </button>
        <h2 className="text-white font-semibold text-lg">Edit Profile</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSave} className="max-w-md mx-auto space-y-6">

          {/* Avatar section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-4 ring-slate-700">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser size={40} className="text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-lg"
                  title="Upload photo"
                >
                  <FiUpload size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center transition-colors shadow-lg"
                  title="Take photo"
                >
                  <FiCamera size={14} />
                </button>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-slate-400 text-sm">Upload or take a new profile photo</p>
          </div>

          {/* Display name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              maxLength={50}
              className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            <p className="text-slate-500 text-xs text-right">{displayName.length}/50</p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Email
            </label>
            <div className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 text-sm">
              {user.email || 'No email'}
            </div>
            <p className="text-slate-500 text-xs">Email cannot be changed here</p>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <FiX size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
              <FiCheck size={16} />
              Profile updated successfully!
            </div>
          )}

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-indigo-500/20"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
