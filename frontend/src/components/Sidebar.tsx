import { logout } from '../util/login'
import './Sidebar.css'
import AvatarInitials from './AvatarInitials'

function getLoggedInUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

export default function Sidebar() {
  // Check which page we are on
  const location = window.location.pathname
  const user = getLoggedInUser();

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/oc_logo.png" alt="OC Logo" />
      </div>

      <div className="SidebarTop">
         <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <AvatarInitials
            firstName={user.first_name || ''}
            lastName={user.last_name || ''}
            userId={user.id || 0}
            size={36}
          />
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
