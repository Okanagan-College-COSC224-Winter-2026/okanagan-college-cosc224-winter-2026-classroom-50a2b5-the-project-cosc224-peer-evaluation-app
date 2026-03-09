// import { useParams } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import './Profile.css'
// import { useEffect, useState } from 'react'
// import { getProfile } from '../util/api'

export default function Profile() {
  const navigate = useNavigate();

  // const { id } = useParams()

  // const [profile, setProfile] = useState({})

  // useEffect(() => {
  //   const f = async () => {
  //     setProfile(await getProfile(id))
  //   }

  //   f()
  // }, [])

  return (
    <div className="Profile">
      <div className="profile-image">
        <img src={`https://placehold.co/200x200`} alt="profile" />
      </div>

      <div className="profile-info">
        <h1>Full Name</h1>
        <span>Place Holder</span>
        <h1>Email</h1>
        <span>placeholder@email.com</span>
      </div>
    </div>
  )
}