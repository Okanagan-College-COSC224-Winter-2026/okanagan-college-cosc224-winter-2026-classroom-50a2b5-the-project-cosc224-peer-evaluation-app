import { useState } from 'react'
import { logout } from '../util/login'
import './Sidebar.css'

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  // Check which page we are on
  const location = window.location.pathname

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Hamburger button (mobile only) */}
      <button className="hamburger-btn" onClick={toggleSidebar}>
        ☰
      </button>

      <div className={`Sidebar ${isOpen ? 'open' : ''}`}>
        <div className="SidebarLogo">
          <img src="/oc_logo.png" alt="OC Logo" />
        </div>

        <div className="SidebarTop">
          <SidebarRow
            onClick={() => {
              logout()
              closeSidebar()
            }}
            href="#"
            selected={false}
          >
            Logout
          </SidebarRow>

          <SidebarRow
            selected={location === '/home'}
            href="/home"
            onClick={closeSidebar}
          >
            Home
          </SidebarRow>

          {/* TODO: make this ID match who is logged in */}
          <SidebarRow
            selected={location.includes('/profile')}
            href="/profile/1"
            onClick={closeSidebar}
          >
            My Info
          </SidebarRow>
        </div>
      </div>

      {/* overlay */}
      <div
        className="sidebar-overlay"
        onClick={closeSidebar}
      />
    </>
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