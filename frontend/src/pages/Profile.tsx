import { useParams } from 'react-router-dom'
import './Profile.css'
import { useEffect, useState } from 'react'

const BASE_URL = 'http://localhost:5000'

export default function Profile() {
  const { id } = useParams()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await fetch(`${BASE_URL}/user/${id}`, {
          credentials: 'include'
        })
        if (resp.ok) {
          setProfile(await resp.json())
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) {
    return <div className="Profile"><p>Loading...</p></div>
  }

  return (
    <div className="Profile">
      <div className="profile-image">
        <img src="https://placehold.co/200x200" alt="profile" />
      </div>

      <div className="profile-info">
        <h1>Full Name</h1>
        <span>{profile?.name ?? '—'}</span>
        <h1>Email</h1>
        <span>{profile?.email ?? '—'}</span>
        <h1>Role</h1>
        <span style={{ textTransform: 'capitalize' }}>{profile?.role ?? '—'}</span>
      </div>
    </div>
  )
}
