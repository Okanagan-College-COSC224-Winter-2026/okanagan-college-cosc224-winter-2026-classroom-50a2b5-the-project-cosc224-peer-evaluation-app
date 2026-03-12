// import { useParams } from 'react-router-dom'
import './Profile.css'
// import { useEffect, useState } from 'react'
// import { getProfile } from '../util/api'

// Helper: split a single "First Last" name string into two parts for AvatarInitials
function splitName(fullName: string): { first: string; last: string } {
  const parts = (fullName || '').trim().split(/\s+/);
  return { first: parts[0] || '', last: parts.slice(1).join(' ') || '' };
}

export default function Profile() {
<<<<<<< Updated upstream
  // const { id } = useParams()

  // const [profile, setProfile] = useState({})

  // useEffect(() => {
  //   const f = async () => {
  //     setProfile(await getProfile(id))
  //   }

  //   f()
  // }, [])
=======
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '' })
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
          setForm({ name: data.name || '' })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const save = async () => {
    if (!form.name.trim()) { setError('Name cannot be empty'); return; }
    setSaving(true); setError(''); setSuccess(false);
    try {
      // updateUserProfile accepts { first_name, last_name } — we send name split
      const { first, last } = splitName(form.name);
      const res = await updateUserProfile({ first_name: first, last_name: last });
      if (res && res.ok) {
        const updated = await res.json();
        // backend returns { name } — reconcile
        setProfile({ ...profile!, name: updated.name || form.name });
        setEditing(false); setSuccess(true);
      } else {
        setError('Update failed');
      }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return <div className="Profile"><p>Loading...</p></div>
  }

  const { first, last } = splitName(profile?.name || '')
>>>>>>> Stashed changes

  return (
    <div className="Profile">
      <div className="profile-image">
<<<<<<< Updated upstream
        <img src={`https://placehold.co/200x200`} alt="profile" />
=======
        <AvatarInitials
          firstName={first}
          lastName={last}
          userId={profile?.id || 0}
          size={72}
        />
>>>>>>> Stashed changes
      </div>

      <div className="profile-info">
<<<<<<< Updated upstream
        <h1>Full Name</h1>
        <span>Place Holder</span>
        <h1>Email</h1>
        <span>placeholder@email.com</span>
      </div>
    </div>
  )
}
=======
        {success && <p style={{ color: 'green' }}>Profile updated!</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!editing ? (<>
          <h1>Full Name</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{profile?.name || '—'}</span>
            <button onClick={() => setEditing(true)}>Edit Name</button>
          </div>
          <h1>Email</h1>
          <span>{profile?.email ?? '—'}</span>
          <h1>Role</h1>
          <span style={{ textTransform: 'capitalize' }}>{profile?.role ?? '—'}</span>
        </>) : (<>
          <input value={form.name} placeholder='Full name'
            onChange={e => setForm({ name: e.target.value })} />
          <button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </>)}
      </div>
      <div className="profile-actions" style={{ marginTop: "1.5rem" }}>
        <button
          onClick={() => navigate("/change-password")}
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
}
>>>>>>> Stashed changes
