import { useEffect, useRef, useState } from 'react'
import { changePassword, getUser, getUserAvatarUrl, updateUserProfile, uploadUserAvatar } from '../util/api'
import { getUserId, logout } from '../util/login'
import StatusMessage from '../components/StatusMessage'

interface UserProfile {
  id: number
  name: string
  email: string
  role: string
  avatar_url: string | null
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profileStatus, setProfileStatus] = useState('')
  const [profileStatusType, setProfileStatusType] = useState<'error' | 'success'>('error')
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwStatus, setPwStatus] = useState('')
  const [pwStatusType, setPwStatusType] = useState<'error' | 'success'>('error')
  const [pwLoading, setPwLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const userId = getUserId()

  useEffect(() => {
    ;(async () => {
      try {
        const data = await getUser()
        setProfile(data)
        setName(data.name ?? '')
        setEmail(data.email ?? '')
      } catch {
        // silently ignore — ProtectedRoute handles auth failures
      }
    })()
  }, [])

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileUpdate = async () => {
    setProfileStatus('')
    setProfileLoading(true)
    try {
      // Upload avatar first if one was selected
      if (avatarFile) {
        const updated = await uploadUserAvatar(avatarFile)
        setProfile(updated)
        setAvatarFile(null)
      }

      // Update name/email if changed
      const payload: { name?: string; email?: string } = {}
      if (name !== profile?.name) payload.name = name
      if (email !== profile?.email) payload.email = email

      if (Object.keys(payload).length > 0) {
        const updated = await updateUserProfile(payload)
        setProfile(updated)
        setName(updated.name)
        setEmail(updated.email)
      }

      setProfileStatusType('success')
      setProfileStatus('Account updated successfully.')
    } catch (err) {
      setProfileStatusType('error')
      setProfileStatus(err instanceof Error ? err.message : 'Failed to update account.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleProfileCancel = () => {
    setName(profile?.name ?? '')
    setEmail(profile?.email ?? '')
    setAvatarFile(null)
    setAvatarPreview(null)
    setProfileStatus('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePasswordUpdate = async () => {
    setPwStatus('')
    if (newPassword.length < 6) {
      setPwStatusType('error')
      setPwStatus('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPwStatusType('error')
      setPwStatus('Passwords do not match.')
      return
    }
    setPwLoading(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPwStatusType('success')
      setPwStatus('Password updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPwStatusType('error')
      setPwStatus(err instanceof Error ? err.message : 'Failed to update password.')
    } finally {
      setPwLoading(false)
    }
  }

  const handlePasswordCancel = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPwStatus('')
  }

  const inputClass =
    'px-3 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors w-full'

  const currentAvatarSrc =
    avatarPreview ??
    (profile?.avatar_url ? `http://localhost:5001${profile.avatar_url}` : null) ??
    (userId ? getUserAvatarUrl(userId) : null)

  return (
    <div className="p-6 md:p-8 w-full max-w-260 mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-1">Update your account</h1>
      <p className="text-text-secondary text-sm mb-6">Manage your profile and credentials</p>

      {/* Section 1: Update user data */}
      <section className="bg-white rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary m-0">Update user data</h2>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          {profileStatus && <StatusMessage message={profileStatus} type={profileStatusType} />}

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border border-border flex-shrink-0">
              {currentAvatarSrc ? (
                <img
                  src={currentAvatarSrc}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <span className="text-2xl font-bold text-text-secondary select-none">
                  {profile?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary mb-1.5 m-0">Profile photo</p>
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-sm text-text-secondary hover:bg-bg-secondary transition-colors">
                  {avatarFile ? avatarFile.name : 'Choose photo'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </label>
              {avatarFile && (
                <button
                  className="ml-2 text-xs text-text-secondary hover:text-red-600 bg-transparent border-none cursor-pointer"
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button
              onClick={handleProfileCancel}
              disabled={profileLoading}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleProfileUpdate}
              disabled={profileLoading}
              className="px-4 py-2 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileLoading ? 'Saving…' : 'Update account'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Update password */}
      <section className="bg-white rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary m-0">Update password</h2>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {pwStatus && <StatusMessage message={pwStatus} type={pwStatusType} />}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Current password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">New password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button
              onClick={handlePasswordCancel}
              disabled={pwLoading}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordUpdate}
              disabled={pwLoading}
              className="px-4 py-2 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pwLoading ? 'Saving…' : 'Update password'}
            </button>
          </div>
        </div>
      </section>

      {/* Section 3: Session / Logout */}
      <section className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary m-0">Session</h2>
        </div>
        <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-text-primary m-0 mb-0.5">Log out of your account</p>
            <p className="text-xs text-text-secondary m-0">You will need to sign in again to access the dashboard.</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex-shrink-0 px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-transparent"
          >
            Log out
          </button>
        </div>
      </section>
    </div>
  )
}
