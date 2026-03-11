import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './Profile.css'
import { useEffect, useState } from 'react'
import AvatarInitials from '../components/AvatarInitials'
import { updateUserProfile } from '../util/api'

const BASE_URL = 'http://localhost:5000'

export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${BASE_URL}/user/${id}`, {
          credentials: 'include'
        })
        if (resp.ok) {
          const data = await resp.json()
          setProfile(data)
          setForm({ first_name: data.first_name || data.name || '', last_name: data.last_name || '' })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])
  
  const save = async () => {
    if (!form.first_name || !form.last_name) { setError('Name fields cannot be empty'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try {
      const res = await updateUserProfile(form);
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated); setEditing(false); setSuccess(true);
      } else {
        setError('Update failed');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="Profile"><p>Loading...</p></div>
  }
return (
    <div className="Profile">
      <div className="profile-image">
        <AvatarInitials
          firstName={profile?.first_name || ''}
          lastName={profile?.last_name || ''}
          userId={profile?.id || 0}
          size={72}
        />
      </div>
      <div className="profile-info">
        {success && <p style={{ color: 'green' }}>Profile updated!</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!editing ? (<>
          <h1>Full Name</h1>
          <span>{profile?.first_name} {profile?.last_name}</span>
          <h1>Email</h1>
          <span>{profile?.email ?? '—'}</span>
          <h1>Role</h1>
          <span style={{ textTransform: 'capitalize' }}>{profile?.role ?? '—'}</span>
          <button onClick={() => setEditing(true)}>Edit Name</button>
        </>) : (<>
          <input value={form.first_name} placeholder='First name'
            onChange={e => setForm({ ...form, first_name: e.target.value })} />
          <input value={form.last_name} placeholder='Last name'
            onChange={e => setForm({ ...form, last_name: e.target.value })} />
          <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>)}
      </div>
      <div className="profile-actions" style={{ marginTop: "1.5rem" }}>
        <button
          onClick={() => navigate("/change-password-form")}
          style={{
            padding: "0.6rem 1.2rem",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Change Password
        </button>
      </div>
    </div>
  )
