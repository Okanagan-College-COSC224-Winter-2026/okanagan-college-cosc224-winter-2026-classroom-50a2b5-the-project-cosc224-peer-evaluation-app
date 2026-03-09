// import { useParams } from 'react-router-dom'
// import { useEffect, useState } from 'react'
// import { getProfile } from '../util/api'

export default function Profile() {
  // const { id } = useParams()

  // const [profile, setProfile] = useState({})

  // useEffect(() => {
  //   const f = async () => {
  //     setProfile(await getProfile(id))
  //   }

  //   f()
  // }, [])

  return (
    <div className="p-6 md:p-10">
      <div className="flex flex-col sm:flex-row items-start gap-8 max-w-2xl">
        <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-border">
          <img src="https://placehold.co/112x112" alt="profile" className="w-full h-full object-cover" />
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-2xl font-bold text-text-primary m-0">Full Name</h1>
            <p className="text-text-secondary text-sm mt-1">Place Holder</p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Email</span>
            <span className="text-text-primary">placeholder@email.com</span>
          </div>

          <button
            onClick={() => window.location.href = '/change-password'}
            className="self-start inline-flex items-center px-4 py-2.5 rounded-lg bg-btn-secondary text-white text-sm font-semibold cursor-pointer border-none transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  )
}
