import { useParams } from 'react-router-dom'
import './Profile.css'
import { useEffect, useState } from 'react'
import { getProfile, updateProfile } from '../util/api'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile(id)
        setProfile(data)
        setNameInput(data.name)
      } catch (err) {
        console.error(err)
        setError('Unable to fetch profile information.')
      }
    }
    load()
  }, [id])

  if (error) {
    return (
      <div className="Profile">
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="Profile">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="Profile">
      <div className="profile-image">
        <img src={`https://placehold.co/200x200`} alt="profile" />
      </div>

      <div className="profile-info">
        <h1>Full Name</h1>
        {editing ? (
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
          />
        ) : (
          <span>{profile.name}</span>
        )}

        <h1>Email</h1>
        <span>{profile.email}</span>
        <h1>Role</h1>
        <span>{profile.role}</span>

        {editing ? (
          <>
            <button onClick={async () => {
                try {
                  const updated = await updateProfile({ name: nameInput });
                  setProfile(updated);
                  setEditing(false);
                } catch (e) {
                  console.error(e);
                  setError('Could not save changes');
                }
              }}
            >
              Save
            </button>
            <button onClick={() => { setEditing(false); setNameInput(profile.name); }}>
              Cancel
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}>Edit name</button>
        )}

        <p className="note">
          If any of the above information is incorrect, please contact your instructor or
          administrator to request a correction.
        </p>
        <button
          className="request-correction"
          onClick={() => {
            alert('Please contact your instructor or administrator to request a correction');
          }}
        >
          Request correction
        </button>
      </div>
    </div>
  )
}