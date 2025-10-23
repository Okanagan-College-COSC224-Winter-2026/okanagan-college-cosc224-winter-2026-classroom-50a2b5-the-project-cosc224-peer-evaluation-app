import { logout } from '../util/login'
import './Sidebar.css'

export default function Sidebar() {
  // Check which page we are on
  const location = window.location.pathname

  return (
    <div className="Sidebar">
      <div className="SidebarLogo">
        <img src="/public/oc_logo.png" alt="OC Logo" />
      </div>

      <div className="SidebarTop">

        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>
        
        { /* TODO: make this ID match who is logged in */ }
        <SidebarRow selected={location.includes('/profile')} href="/profile/1">
          My Info
        </SidebarRow>
      </div>

      <div className="SidebarBottom">
        <SidebarRow
          onclick={() => logout()}
          href='#'
          selected={false}
        >
          Logout
        </SidebarRow>
      </div>
    </div>
  )
}

interface SidebarRowProps {
  selected: boolean
  href: string
  children: React.ReactNode
  onclick?: () => void
}

function SidebarRow(props: SidebarRowProps) {
  return (
    <div className={`SidebarRow ${props.selected ? 'selected' : ''}`} onClick={props.onclick}>
      <a href={props.selected ? '#' : props.href}>{props.children}</a>
    </div>
  )
}