import { logout } from '../util/login'
import './Sidebar.css'

function getLoggedInUserId(): number {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 0;
  } catch {
    return 0;
  }
}

export default function Sidebar() {
  // Check which page we are on
  const location = window.location.pathname
  const userId = getLoggedInUserId();

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/oc_logo.png" alt="OC Logo" />
      </div>

      <div className="SidebarTop">
        <SidebarRow
          onClick={() => logout()}
          href='#'
          selected={false}
        >
          Logout
        </SidebarRow>

        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>
        
        <SidebarRow selected={location.includes('/profile')} href={`/profile/${userId}`}>
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