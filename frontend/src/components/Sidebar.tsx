import { logout } from '../util/login'
import './Sidebar.css'

export default function Sidebar() {
  const location = window.location.pathname

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/oc_logo.png" alt="OC Logo" />
      </div>

      <div className="SidebarTop">
        <SidebarRow
          onClick={() => logout()}
          href="#"
          selected={false}
        >
          Logout
        </SidebarRow>

        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>

        <SidebarRow selected={location.includes('/profile')} href="/profile/1">
          My Info
        </SidebarRow>

        {/* NEW FEATURE LINK */}
        <SidebarRow
          selected={location === '/student/review-history'}
          href="/student/review-history"
        >
          My Review History
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
    <div
      className={`SidebarRow ${props.selected ? 'selected' : ''}`}
      onClick={props.onClick}
    >
      <a href={props.selected ? '#' : props.href}>{props.children}</a>
    </div>
  )
}