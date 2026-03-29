import { Link } from "react-router-dom";
import { isAdmin, getUserId, logout } from "../util/login";
import { useUnreadCount } from "../features/notifications/useNotifications";

export default function MobileHeader() {
  const { data: unreadData } = useUnreadCount();
  const unreadCount: number = unreadData?.count ?? 0;
  const userId = getUserId();

  return (
    <header className="md:hidden sticky top-0 z-50 bg-white border-b border-border px-4 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <img src="/oc_logo.png" alt="OC Logo" className="h-7 w-7 object-contain" />
        <span className="text-text-primary font-bold text-sm">Peer Review</span>
      </div>
      <nav className="flex items-center gap-4 text-sm font-medium">
        <Link to="/home" className="text-text-secondary hover:text-text-primary no-underline transition-colors">
          Home
        </Link>
        <Link to="/notifications" className="relative text-text-secondary hover:text-text-primary no-underline transition-colors">
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-2 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          Notifications
        </Link>
        <Link to={`/profile/${userId ?? 1}`} className="text-text-secondary hover:text-text-primary no-underline transition-colors">
          Account
        </Link>
        {isAdmin() && (
          <Link to="/admin/users" className="text-text-secondary hover:text-text-primary no-underline transition-colors">
            Users
          </Link>
        )}
        <button
          onClick={() => logout()}
          className="text-red-500 hover:text-red-700 bg-transparent border-none cursor-pointer text-sm font-medium p-0 transition-colors"
        >
          Logout
        </button>
      </nav>
    </header>
  );
}
