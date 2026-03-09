import { logout } from '../util/login'

export default function Sidebar() {
  const location = window.location.pathname

  return (
    <div className="hidden md:flex w-52 min-w-52 h-screen bg-slate-900 flex-col sticky top-0">
      <div className="flex justify-center items-center py-6 px-4 border-b border-slate-700/50">
        <img src="/oc_logo.png" alt="OC Logo" className="w-12 h-12 object-contain" />
      </div>

      <nav className="flex flex-col flex-1 py-4 gap-0.5 px-3">
        <SidebarRow onClick={() => logout()} href='#' selected={false}>
          Logout
        </SidebarRow>

        <SidebarRow selected={location === '/home'} href="/home">
          Home
        </SidebarRow>

        <SidebarRow selected={location.includes('/profile')} href="/profile/1">
          My Info
        </SidebarRow>
      </nav>
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
      className={`rounded-lg transition-colors duration-150 cursor-pointer ${
        props.selected ? 'bg-slate-700' : 'hover:bg-slate-800'
      }`}
      onClick={props.onClick}
    >
      <a
        href={props.selected ? '#' : props.href}
        className={`block px-4 py-2.5 text-sm font-medium no-underline rounded-lg ${
          props.selected ? 'text-white' : 'text-slate-300 hover:text-white'
        }`}
      >
        {props.children}
      </a>
    </div>
  )
}
