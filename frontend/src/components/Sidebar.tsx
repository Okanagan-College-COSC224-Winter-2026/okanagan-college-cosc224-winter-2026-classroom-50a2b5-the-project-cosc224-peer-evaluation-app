import { logout } from '../util/login'
import './Sidebar.css'
<<<<<<< Updated upstream
=======
import AvatarInitials from './AvatarInitials'
import NotificationBell from './NotificationBell'

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}
>>>>>>> Stashed changes

export default function Sidebar() {
  // Check which page we are on
  const location = window.location.pathname

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/oc_logo.png" alt="OC Logo" />
      </div>

      <div className="SidebarTop">
<<<<<<< Updated upstream
        <SidebarRow
          onClick={() => logout()}
          href='#'
          selected={false}
        >
=======
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
>>>>>>> Stashed changes
          Logout
        </SidebarRow>

        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>
        
        { /* TODO: make this ID match who is logged in */ }
        <SidebarRow selected={location.includes('/profile')} href="/profile/1">
          My Info
        </SidebarRow>
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
    <div className={`SidebarRow ${props.selected ? 'selected' : ''}`} onClick={props.onClick}>
      <a href={props.selected ? '#' : props.href}>{props.children}</a>
    </div>
  )
}