import { useState, useEffect } from 'react'
import { logout, isAdmin, isTeacher } from '../util/login'
import './Sidebar.css'
import AvatarInitials from './AvatarInitials'
import NotificationBell from './NotificationBell'

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export default function Sidebar() {
  const location = window.location.pathname
  const [user, setUser] = useState(getLoggedInUser);

  useEffect(() => {
    const handleStorage = () => setUser(getLoggedInUser());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const nameParts = (user.name || '').trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/oc_logo.png" alt="OC Logo" />
      </div>
      <div className="SidebarTop">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '10px 0' }}>
          <AvatarInitials
            firstName={firstName}
            lastName={lastName}
            userId={user.id || 0}
            size={36}
          />
          <NotificationBell />
        </div>
        <SidebarRow onClick={() => logout()} href='#' selected={false}>
          Logout
        </SidebarRow>
        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>
        <SidebarRow selected={location.includes('/profile')} href={`/profile/${user.id || 0}`}>
          My Info
        </SidebarRow>
        <SidebarRow
          selected={location === '/student/review-history'}
          href="/student/review-history"
        >
          My Review History
        </SidebarRow>
        {(isTeacher() || isAdmin()) && (
          <SidebarRow selected={location === '/classes/create'} href="/classes/create">
            Create Class
          </SidebarRow>
        )}
        {isAdmin() && (
          <>
            <SidebarRow selected={location === '/admin/users'} href="/admin/users">
              User Management
            </SidebarRow>
            <SidebarRow selected={location === '/admin/create-teacher'} href="/admin/create-teacher">
              Create Teacher
            </SidebarRow>
          </>
        )}
      </div>
    </div>
  )
}

interface SidebarRowProps {
  selected: boolean
  href: string
  children: React.ReactNode
  onClick?: () => void
}

function SidebarRow(props: SidebarRowProps) {
  return (
    <div
      className={`SidebarRow ${props.selected ? 'selected' : ''}`}
      onClick={props.onClick}
    >
      <a href={props.selected ? '#' : props.href}>{props.children}</a>
    </div>
  )
}