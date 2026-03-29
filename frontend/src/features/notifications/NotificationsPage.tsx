import { useNotifications, useMarkRead, useMarkAllRead } from "./useNotifications";

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id: number | null;
  reference_type: string | null;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function AssignmentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}

function getTypeIcon(type: string) {
  const iconColors: Record<string, string> = {
    assignment_published: "text-blue-600 bg-blue-50",
    assignment_graded: "text-amber-600 bg-amber-50",
    enrollment_request: "text-indigo-600 bg-indigo-50",
    enrollment_approved: "text-emerald-600 bg-emerald-50",
    enrollment_rejected: "text-red-600 bg-red-50",
    review_flagged: "text-orange-600 bg-orange-50",
  };
  const colorClass = iconColors[type] || "text-gray-600 bg-gray-50";

  const icons: Record<string, JSX.Element> = {
    assignment_published: <AssignmentIcon />,
    assignment_graded: <StarIcon />,
    enrollment_request: <EnvelopeIcon />,
    enrollment_approved: <CheckCircleIcon />,
    enrollment_rejected: <XCircleIcon />,
    review_flagged: <FlagIcon />,
  };
  const icon = icons[type] || <BellIcon />;

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
      {icon}
    </div>
  );
}

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead } = useMarkRead();
  const { mutate: markAllRead } = useMarkAllRead();

  const hasUnread = (notifications as NotificationItem[]).some((n) => !n.is_read);

  return (
    <div className="p-6 md:p-8 w-full max-w-260 mx-auto">
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">Notifications</h1>
        {hasUnread && (
          <button
            onClick={() => markAllRead()}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-btn-primary border border-btn-primary/30 bg-transparent hover:bg-btn-primary/5 transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-text-secondary text-sm">Loading notifications...</p>
      ) : (notifications as NotificationItem[]).length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-12 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <BellIcon />
            </div>
            <p className="text-text-secondary text-sm m-0">No notifications yet.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {(notifications as NotificationItem[]).map((notif) => (
              <div
                key={notif.id}
                className={`px-5 md:px-8 py-4 flex items-start gap-3 transition-colors ${
                  !notif.is_read ? "bg-btn-primary/[0.03]" : ""
                }`}
              >
                {getTypeIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm m-0 ${!notif.is_read ? "font-medium text-text-primary" : "text-text-secondary"}`}>
                    {notif.message}
                  </p>
                  <span className="text-xs text-text-secondary mt-1 block">{getTimeAgo(notif.created_at)}</span>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markRead(notif.id)}
                    className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-medium text-btn-primary hover:bg-btn-primary/10 border border-transparent hover:border-btn-primary/20 transition-colors cursor-pointer bg-transparent mt-0.5"
                    title="Mark as read"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
