import { useParams, Link } from 'react-router-dom'
import './Profile.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { useEffect, useState } from 'react'
import { getProfile, updateProfile, listClasses } from '../util/api'

export default function Profile() {
  const { id } = useParams<{ id: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showCurrentPwd, setShowCurrentPwd] = useState(false)
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfile(id)
        setProfile(data)
        setNameInput(data.name)
        
        // Fetch enrolled courses
        const courseData = await listClasses()
        setCourses(courseData || [])
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
        <div className="name-row">
          {editing ? (
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
            />
          ) : (
            <span>{profile.name}</span>
          )}
          {editing ? (
            <>
              <button className="save-btn" onClick={async () => {
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
              <button className="cancel-btn" onClick={() => { setEditing(false); setNameInput(profile.name); }}>
                Cancel
              </button>
            </>
          ) : (
            <button className="edit-name-btn" onClick={() => setEditing(true)}>Edit name</button>
          )}
        </div>

        <h1>Email</h1>
        <span>{profile.email}</span>
        <h1>Role</h1>
        <span>{profile.role}</span>

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

        <button
          className="change-password-btn"
          onClick={() => setShowPasswordModal(true)}
        >
          Change Password
        </button>

        {showPasswordModal && (
          <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Change Password</h2>
                <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
              </div>
              <div className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-with-toggle">
                    <input
                      type={showCurrentPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                    >
                      <i className={`fas ${showCurrentPwd ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-with-toggle">
                    <input
                      type={showNewPwd ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                    >
                      <i className={`fas ${showNewPwd ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="input-with-toggle">
                    <input
                      type={showConfirmPwd ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="eye-toggle"
                      onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                    >
                      <i className={`fas ${showConfirmPwd ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                    </button>
                  </div>
                </div>
                {passwordError && <p className="error">{passwordError}</p>}
                {passwordSuccess && <p className="success">{passwordSuccess}</p>}
                <div className="modal-buttons">
                  <button
                    className="submit-btn"
                    onClick={async () => {
                      setPasswordError(null);
                      setPasswordSuccess(null);
                      
                      if (!currentPassword || !newPassword || !confirmPassword) {
                        setPasswordError('All fields are required');
                        return;
                      }
                      
                      if (newPassword !== confirmPassword) {
                        setPasswordError('New passwords do not match');
                        return;
                      }
                      
                      try {
                        await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/user/password`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
                          credentials: 'include'
                        });
                        setPasswordSuccess('Password changed successfully!');
                        setTimeout(() => {
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                          setShowPasswordModal(false);
                        }, 1500);
                      } catch (err) {
                        setPasswordError('Failed to change password');
                        console.error(err);
                      }
                    }}
                  >
                    Change Password
                  </button>
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordError(null);
                      setPasswordSuccess(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <h2>Enrolled Courses</h2>
        {courses.length === 0 ? (
          <p className="empty">You are not enrolled in any courses yet.</p>
        ) : (
          <ul className="courses-list">
            {courses.map(course => (
              <li key={course.id}>
                <Link to={`/classes/${course.id}/home`}>{course.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}