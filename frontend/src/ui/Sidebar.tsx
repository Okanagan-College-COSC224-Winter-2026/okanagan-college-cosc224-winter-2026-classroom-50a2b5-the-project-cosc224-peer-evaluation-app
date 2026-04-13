import { useLocation } from 'react-router-dom'
import SidebarNavLink from '../ui/SidebarNavLink'
import { isAdmin, getUserId, logout } from '../util/login'
import { useUnreadCount } from '../features/notifications/useNotifications'

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  )
}

function ArrowRightOnRectangleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" />
    </svg>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const { data: unreadData } = useUnreadCount()
  const unreadCount: number = unreadData?.count ?? 0
  const userId = getUserId()

  return (
    <aside className="hidden lg:flex w-64 min-w-64 h-screen bg-white border-r border-border flex-col sticky top-0 z-30">
    
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border flex-shrink-0">
        <img src="/oc_logo.png" alt="OC Logo" className="w-9 h-9 object-contain flex-shrink-0" />
        <div>
          <p className="text-text-primary font-bold text-sm leading-tight m-0">Peer Review</p>
          <p className="text-text-secondary text-xs m-0">Dashboard</p>
        </div>
      </div>

      <nav className="flex flex-col flex-1 px-3 py-4 gap-0.5 overflow-y-auto">
        <SidebarNavLink to="/home" icon={<HomeIcon />} active={pathname === '/home'}>
          Home
        </SidebarNavLink>

        <SidebarNavLink to={`/profile/${userId ?? 1}`} icon={<UserCircleIcon />} active={pathname.includes('/profile')}>
          My Account
        </SidebarNavLink>

        <SidebarNavLink
          to="/notifications"
          icon={
            <span className="relative">
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </span>
          }
          active={pathname.includes('/notifications')}
        >
          Notifications
        </SidebarNavLink>

      {isAdmin() && (
          <SidebarNavLink to="/admin/users" icon={<UsersIcon />} active={pathname.includes('/admin/users')}>
            Manage Users
          </SidebarNavLink>
        )}
      </nav>

   
      <div className="px-3 py-4 border-t border-border flex-shrink-0">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary transition-colors duration-150 hover:bg-red-50 hover:text-red-600 cursor-pointer border-none bg-transparent"
        >
          <ArrowRightOnRectangleIcon />
          Log out
        </button>
      </div>
    </aside>
  )
}
