import { useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth, store, storage } from './db'
import { FiCamera, FiArrowLeft } from 'react-icons/fi'

function Profile({ onClose }) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user.displayName || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user.photoURL || null)
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
        displayName: displayName.trim(),
        photoURL: photoURL || null,
        email: user.email,
        updatedAt: new Date(),
      }, { merge: true })

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  return (
    <div className="profile-overlay">
      <div className="profile-card">
        <button className="profile-back" onClick={onClose}>
          <FiArrowLeft /> Back to chat
        </button>

        <form onSubmit={handleSave} className="profile-form">
          <div className="profile-avatar-section">
            <div className="profile-avatar" onClick={() => fileRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {displayName ? displayName[0].toUpperCase() : '?'}
                </div>
              )}
              <div className="profile-avatar-overlay">
                <FiCamera />
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          <label className="profile-label">
            Display name
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </label>

          <label className="profile-label">
            Email
            <input type="email" value={user.email || ''} disabled />
          </label>

          {error && <div className="profile-error">{error}</div>}
          {success && <div className="profile-success">Profile updated!</div>}

          <button type="submit" className="profile-save" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Profile
