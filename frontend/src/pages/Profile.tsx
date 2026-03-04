import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import './Profile.css'
import { useEffect, useState } from 'react'
import { getProfile } from '../util/api'


export default function Profile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>({})

  useEffect(() => {
    const f = async () => {
      setProfile(await getProfile(id))
    }
    f()
  }, [id])

  return (
    <div className="Profile">
      <div className="profile-image">
        <img src={`https://placehold.co/200x200`} alt="profile" />
      </div>

      <div className="profile-info">
        <h1>Full Name</h1>
        <span>{profile.name ?? "Place Holder"}</span>
        <h1>Email</h1>
        <span>{profile.email ?? "placeholder@email.com"}</span>
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
          🔒 Change Password
        </button>
      </div>
    </div>
  )
}
