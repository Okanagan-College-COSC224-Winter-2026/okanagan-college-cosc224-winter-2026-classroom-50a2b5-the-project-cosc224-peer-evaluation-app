import { useState } from "react";
import toast from "../../lib/toast";
import {
  useNotifications,
  useMarkRead,
  useMarkUnread,
  useMarkAllRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from "./useNotifications";

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id: number | null;
  reference_type: string | null;
}


// ─── Filter types ─────────────────────────────────────────────────────────────

type StatusFilter = "all" | "unread" | "read";
type DateFilter   = "all" | "today" | "week";

function applyFilters(
  list: NotificationItem[],
  statusFilter: StatusFilter,
  dateFilter: DateFilter,
): NotificationItem[] {
  const now = new Date();
  return list.filter((n) => {
    if (statusFilter === "unread" && n.is_read)  return false;
    if (statusFilter === "read"   && !n.is_read) return false;
    if (dateFilter !== "all") {
      const diffDays = (now.getTime() - new Date(n.created_at).getTime()) / 86_400_000;
      if (dateFilter === "today" && diffDays >= 1) return false;
      if (dateFilter === "week"  && diffDays >= 7) return false;
    }
    return true;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeAgo(dateStr: string): string {
  const diffMs  = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays <  7)  return `${diffDays} days ago`;
  if (diffDays < 30)  return `${Math.floor(diffDays / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AssignmentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}
function AssignmentEditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
  );
}
function AssignmentDeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}
function CourseAddIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  );
}
function CourseEditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m14.25-8.625c.621 0 1.125.504 1.125 1.125V21H6V8.625c0-.621.504-1.125 1.125-1.125h9Z" />
    </svg>
  );
}
function CourseDeleteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v8.25m9 3 2.25 2.25m0 0 2.25 2.25M16.5 18.75l2.25-2.25M16.5 18.75l-2.25 2.25" />
    </svg>
  );
}
function FlagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-[18px] h-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  );
}
function BellIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
    </svg>
  );
}
function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}
function MailOpenIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.04a2.25 2.25 0 0 1 2.134 0l7.5 4.04a2.25 2.25 0 0 1 1.183 1.98V19.5Z" />
    </svg>
  );
}
function MailClosedIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </svg>
  );
}

// ─── Type icon / color maps ───────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  assignment_published: "text-blue-600 bg-blue-50",
  assignment_updated:   "text-violet-600 bg-violet-50",
  assignment_deleted:   "text-red-500 bg-red-50",
  assignment_graded:    "text-amber-500 bg-amber-50",
  course_enrolled:      "text-teal-600 bg-teal-50",
  course_created:       "text-emerald-600 bg-emerald-50",
  course_updated:       "text-sky-600 bg-sky-50",
  course_deleted:       "text-red-700 bg-red-100",
  review_flagged:       "text-orange-500 bg-orange-50",
};

function getTypeIcon(type: string) {
  const iconMap: Record<string, JSX.Element> = {
    assignment_published: <AssignmentIcon />,
    assignment_updated:   <AssignmentEditIcon />,
    assignment_deleted:   <AssignmentDeleteIcon />,
    assignment_graded:    <StarIcon />,
    course_enrolled:      <CourseAddIcon />,
    course_created:       <CourseAddIcon />,
    course_updated:       <CourseEditIcon />,
    course_deleted:       <CourseDeleteIcon />,
    review_flagged:       <FlagIcon />,
  };
  const colorCls = COLOR_MAP[type] ?? "text-gray-500 bg-gray-100";
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorCls}`}>
      {iconMap[type] ?? <BellIcon />}
    </div>
  );
}

const TYPE_LABEL: Record<string, string> = {
  assignment_published: "Assignment Published",
  assignment_updated:   "Assignment Updated",
  assignment_deleted:   "Assignment Removed",
  assignment_graded:    "Peer Review Submitted",
  course_enrolled:      "Enrolled in Course",
  course_created:       "Course Created",
  course_updated:       "Course Updated",
  course_deleted:       "Course Removed",
  review_flagged:       "Review Flagged",
};

// ─── Segmented filter group (Wild Oasis style) ────────────────────────────────

function FilterGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-[3px] gap-[2px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            value === opt.value
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-white/60"
          }`}
        >
          {opt.label}
          {opt.count !== undefined && opt.count > 0 && (
            <span
              className={`ml-1.5 inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] rounded-full text-[10px] font-bold leading-none px-0.5 ${
                value === opt.value
                  ? "bg-btn-primary/15 text-btn-primary"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead }    = useMarkRead();
  const { mutate: markUnread }  = useMarkUnread();
  const { mutate: markAllRead } = useMarkAllRead();
  const { mutate: deleteOne }   = useDeleteNotification();
  const { mutate: deleteAll, isPending: deletingAll } = useDeleteAllNotifications();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter,   setDateFilter]   = useState<DateFilter>("all");

  const all = notifications as NotificationItem[];

  const unreadCount  = all.filter((n) => !n.is_read).length;
  const listed = applyFilters(all, statusFilter, dateFilter);
  const filtersActive = statusFilter !== "all" || dateFilter !== "all";

  function handleDeleteAll() {
    deleteAll(undefined, {
      onSuccess: () => toast.success("All notifications deleted."),
      onError:   () => toast.error("Failed to delete notifications."),
    });
  }

  return (
    <div className="px-8 py-8 w-full">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[1.75rem] font-bold text-text-primary m-0 leading-tight">Notifications</h1>
          <p className="text-sm text-text-secondary mt-1 m-0">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4 mb-4">

        {/* Row 1: filter groups | actions (center) | search */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Status filter */}
          <FilterGroup
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: "all",    label: "All status" },
              { value: "unread", label: "Unread", count: unreadCount },
              { value: "read",   label: "Read" },
            ]}
          />

          {/* Date filter */}
          <FilterGroup
            value={dateFilter}
            onChange={setDateFilter}
            options={[
              { value: "all",   label: "Any time" },
              { value: "today", label: "Today" },
              { value: "week",  label: "Last 7 days" },
            ]}
          />

          {/* Bulk actions — pushed to the right */}
          <div className="flex items-center gap-2 ml-auto">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead(undefined, { onSuccess: () => toast.success("All marked as read.") })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-btn-primary border border-btn-primary/20 bg-btn-primary/5 hover:bg-btn-primary/10 transition-colors cursor-pointer"
              >
                <MailOpenIcon className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
            {all.length > 0 && (
              <>
                <button
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 text-red-500 border-red-200 bg-transparent hover:bg-red-50"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete all
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* ── Notification list ── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[72px] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm py-16 flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
            <BellIcon className="w-7 h-7" />
          </div>
          <p className="text-text-secondary text-sm font-medium m-0">
            {filtersActive ? "No notifications match your filters" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {listed.map((notif) => (
              <div
                key={notif.id}
                onClick={() => { if (!notif.is_read) markRead(notif.id); }}
                className={`px-6 py-4 flex items-start gap-4 transition-colors group ${
                  !notif.is_read
                    ? "bg-btn-primary/[0.03] hover:bg-btn-primary/[0.06] cursor-pointer"
                    : "hover:bg-gray-50/80"
                }`}
              >
                {getTypeIcon(notif.type)}

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold m-0 leading-snug ${
                    !notif.is_read ? "text-text-primary" : "text-text-secondary/80"
                  }`}>
                    {TYPE_LABEL[notif.type] ?? notif.type}
                  </p>
                  <p className="text-sm text-text-secondary m-0 mt-0.5 leading-snug">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-text-secondary/50">
                      {getTimeAgo(notif.created_at)}
                    </span>
                    {!notif.is_read && (
                      <span className="inline-flex items-center px-1.5 py-[2px] rounded-full text-[10px] font-bold bg-btn-primary/10 text-btn-primary leading-none">
                        Unread
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {notif.is_read ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); markUnread(notif.id); }}
                      title="Mark as unread"
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <MailClosedIcon />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(notif.id); }}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <MailOpenIcon />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOne(notif.id, { onSuccess: () => toast.success("Notification deleted.") });
                    }}
                    title="Delete"
                    className="p-1.5 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
