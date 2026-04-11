import { useState } from "react";
import toast from "react-hot-toast";
import {
  useNotifications,
  useMarkRead,
  useMarkUnread,
  useMarkAllRead,
  useDeleteNotification,
  useDeleteReadNotifications,
  useDeleteAllNotifications,
} from "./useNotifications";
import { useApproveRequest, useRejectRequest, useBlockAndRejectRequest } from "../enrollment/useEnrollment";
import { useBlockedStudents, useUnblockStudent } from "./useBlocked";
import { isTeacher } from "../../util/login";

interface NotificationItem {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id: number | null;
  reference_type: string | null;
  reference_status: "pending" | "approved" | "rejected" | null;
}

interface BlockedStudentItem {
  id: number;
  studentID: number;
  reason: string | null;
  created_at: string;
  student: { id: number; first_name: string; last_name: string; email: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: diffDays > 365 ? "numeric" : undefined });
}

function isExpired(dateStr: string): boolean {
  return (Date.now() - new Date(dateStr).getTime()) / 86400000 > 30;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function AssignmentIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
}
function StarIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>;
}
function EnvelopeIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
}
function CheckCircleIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function XCircleIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function FlagIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" /></svg>;
}
function BellIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>;
}
function TrashIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
}
function MailOpenIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 0 1-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 0 0 1.183 1.981l6.478 3.488m8.839 2.51-4.66-2.51m0 0-1.023-.55a2.25 2.25 0 0 0-2.134 0l-1.022.55m0 0-4.661 2.51m16.5 1.615a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V8.844a2.25 2.25 0 0 1 1.183-1.981l7.5-4.04a2.25 2.25 0 0 1 2.134 0l7.5 4.04a2.25 2.25 0 0 1 1.183 1.98V19.5Z" /></svg>;
}
function MailClosedIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>;
}
function ShieldIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" /></svg>;
}
function NoSymbolIcon({ className = "w-4 h-4" }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
}
function CheckIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>;
}
function XMarkIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>;
}

function getTypeIcon(type: string) {
  const colorMap: Record<string, string> = {
    assignment_published: "text-blue-600 bg-blue-50",
    assignment_graded:    "text-amber-600 bg-amber-50",
    enrollment_request:   "text-indigo-600 bg-indigo-50",
    enrollment_approved:  "text-emerald-600 bg-emerald-50",
    enrollment_rejected:  "text-red-600 bg-red-50",
    enrollment_blocked:   "text-red-700 bg-red-100",
    review_flagged:       "text-orange-600 bg-orange-50",
  };
  const iconMap: Record<string, JSX.Element> = {
    assignment_published: <AssignmentIcon />,
    assignment_graded:    <StarIcon />,
    enrollment_request:   <EnvelopeIcon />,
    enrollment_approved:  <CheckCircleIcon />,
    enrollment_rejected:  <XCircleIcon />,
    enrollment_blocked:   <NoSymbolIcon className="w-5 h-5" />,
    review_flagged:       <FlagIcon />,
  };
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorMap[type] ?? "text-gray-600 bg-gray-50"}`}>
      {iconMap[type] ?? <BellIcon />}
    </div>
  );
}

// ─── Enrollment request inline actions ────────────────────────────────────────

type ActionedStatus = "approved" | "rejected" | "blocked" | null;

function statusToActioned(status: string | null | undefined): ActionedStatus {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  return null;
}

function EnrollmentActions({ requestId, initialStatus }: { requestId: number; initialStatus: string | null }) {
  const { mutate: approve, isPending: approving } = useApproveRequest();
  const { mutate: reject, isPending: rejecting } = useRejectRequest();
  const { mutate: blockReject, isPending: blocking } = useBlockAndRejectRequest();
  const [actioned, setActioned] = useState<ActionedStatus>(() => statusToActioned(initialStatus));

  // Once actioned, show a static chip — prevents double-action errors
  if (actioned) {
    const chipMap: Record<NonNullable<ActionedStatus>, { label: string; cls: string }> = {
      approved: { label: "Approved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
      rejected: { label: "Rejected", cls: "text-gray-600 bg-gray-50 border-gray-200" },
      blocked:  { label: "Blocked & Rejected", cls: "text-red-600 bg-red-50 border-red-200" },
    };
    const { label, cls } = chipMap[actioned];
    return (
      <div className="mt-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${cls}`}>
          {label}
        </span>
      </div>
    );
  }

  const busy = approving || rejecting || blocking;

  function handleApprove() {
    approve(requestId, {
      onSuccess: () => { setActioned("approved"); toast.success("Enrollment approved."); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to approve."),
    });
  }

  function handleReject() {
    reject(requestId, {
      onSuccess: () => { setActioned("rejected"); toast.success("Enrollment rejected."); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to reject."),
    });
  }

  function handleBlock() {
    blockReject(requestId, {
      onSuccess: () => { setActioned("blocked"); toast.success("Student blocked and request rejected."); },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to block."),
    });
  }

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <button
        onClick={handleApprove}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50"
      >
        <CheckIcon /> Approve
      </button>
      <button
        onClick={handleReject}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
      >
        <XMarkIcon /> Reject
      </button>
      <button
        onClick={handleBlock}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
      >
        <NoSymbolIcon /> Block & Reject
      </button>
    </div>
  );
}

// ─── Blocked students panel ───────────────────────────────────────────────────

function BlockedStudentsPanel() {
  const { data: blocked = [], isLoading } = useBlockedStudents();
  const { mutate: unblock } = useUnblockStudent();
  const list = blocked as BlockedStudentItem[];

  if (isLoading) return <p className="text-xs text-text-secondary py-4 text-center">Loading...</p>;
  if (list.length === 0)
    return <p className="text-xs text-text-secondary py-4 text-center">No blocked students.</p>;

  return (
    <div className="divide-y divide-border">
      {list.map((b) => {
        const name = b.student
          ? `${b.student.first_name} ${b.student.last_name}`
          : `Student #${b.studentID}`;
        const email = b.student?.email ?? "";
        return (
          <div key={b.id} className="flex items-center justify-between gap-3 py-3 px-1">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary m-0 truncate">{name}</p>
              {email && <p className="text-xs text-text-secondary m-0 truncate">{email}</p>}
              {b.reason && <p className="text-xs text-amber-600 m-0 mt-0.5 truncate">Reason: {b.reason}</p>}
            </div>
            <button
              onClick={() =>
                unblock(b.studentID, {
                  onSuccess: () => toast.success(`${name} unblocked.`),
                  onError: () => toast.error("Failed to unblock."),
                })
              }
              className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <CheckIcon /> Unblock
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Filter = "unread" | "read";

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const { mutate: markRead }             = useMarkRead();
  const { mutate: markUnread }           = useMarkUnread();
  const { mutate: markAllRead }          = useMarkAllRead();
  const { mutate: deleteOne }            = useDeleteNotification();
  const { mutate: deleteRead, isPending: deletingRead } = useDeleteReadNotifications();
  const { mutate: deleteAll,  isPending: deletingAll  } = useDeleteAllNotifications();

  const [filter, setFilter] = useState<Filter>("unread");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  const teacher = isTeacher();
  const all    = notifications as NotificationItem[];
  const listed = filter === "unread" ? all.filter((n) => !n.is_read) : all.filter((n) => n.is_read);

  const unreadCount  = all.filter((n) => !n.is_read).length;
  const readCount    = all.filter((n) => n.is_read).length;
  const hasRead      = readCount > 0;
  const expiredCount = all.filter((n) => isExpired(n.created_at)).length;

  function handleDeleteAll() {
    if (!confirmDeleteAll) { setConfirmDeleteAll(true); return; }
    deleteAll(undefined, {
      onSuccess: () => { toast.success("All notifications deleted."); setConfirmDeleteAll(false); },
      onError: () => toast.error("Failed to delete notifications."),
    });
  }

  function handleDeleteRead() {
    deleteRead(undefined, {
      onSuccess: () => toast.success(`${readCount} read notification${readCount !== 1 ? "s" : ""} deleted.`),
      onError: () => toast.error("Failed to delete notifications."),
    });
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-3xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 mb-1">
        <div>
          <h1 className="text-2xl font-bold text-text-primary m-0">Notifications</h1>
          <p className="text-sm text-text-secondary mt-0.5 m-0">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            {expiredCount > 0 && ` · ${expiredCount} expiring soon`}
          </p>
        </div>
        {teacher && (
          <button
            onClick={() => setShowBlocked((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showBlocked
                ? "bg-red-600 text-white border-red-600 shadow-sm"
                : "text-red-600 border-red-200 bg-white hover:bg-red-50 shadow-sm"
            }`}
          >
            <ShieldIcon /> Blocked students
          </button>
        )}
      </div>

      {/* ── Blocked students panel (teachers only) ── */}
      {showBlocked && teacher && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm mt-4 mb-2 overflow-hidden">
          <div className="px-5 py-3 bg-red-50/60 border-b border-red-100 flex items-center gap-2">
            <NoSymbolIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">Blocked Students</span>
            <span className="text-xs text-red-400 ml-auto">Cannot request enrollment in your courses</span>
          </div>
          <div className="px-5 pb-2">
            <BlockedStudentsPanel />
          </div>
        </div>
      )}

      {/* ── Filter tabs + bulk actions in one bar ── */}
      <div className="flex items-center justify-between gap-2 mt-5 mb-3 border-b border-border pb-0">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setFilter("unread")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent -mb-px ${
              filter === "unread"
                ? "border-btn-primary text-btn-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <span className="flex items-center gap-1.5">
              Inbox
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-btn-primary text-white text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setFilter("read")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer bg-transparent -mb-px ${
              filter === "read"
                ? "border-btn-primary text-btn-primary"
                : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <span className="flex items-center gap-1.5">
              Read
              {readCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[1rem] h-4 px-1 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold">
                  {readCount}
                </span>
              )}
            </span>
          </button>
        </div>

        {all.length > 0 && (
          <div className="flex items-center gap-1.5 pb-2">
            {filter === "unread" && unreadCount > 0 && (
              <button
                onClick={() => markAllRead(undefined, { onSuccess: () => toast.success("All marked as read.") })}
                title="Mark all as read"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-btn-primary border border-btn-primary/25 bg-transparent hover:bg-btn-primary/5 transition-colors cursor-pointer"
              >
                <MailOpenIcon /> Mark all read
              </button>
            )}
            {filter === "read" && hasRead && (
              <button
                onClick={handleDeleteRead}
                disabled={deletingRead}
                title={`Delete ${readCount} read`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary border border-border bg-transparent hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                <TrashIcon /> Clear read
              </button>
            )}
            <button
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 ${
                confirmDeleteAll
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : "text-red-500 border-red-200 bg-transparent hover:bg-red-50"
              }`}
            >
              <TrashIcon />
              {confirmDeleteAll ? "Confirm?" : "Clear all"}
            </button>
            {confirmDeleteAll && (
              <button onClick={() => setConfirmDeleteAll(false)} className="text-xs text-text-secondary hover:text-text-primary cursor-pointer bg-transparent border-none">
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-2 mt-2">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : listed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm mt-2">
          <div className="px-5 py-14 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <BellIcon className="w-6 h-6" />
            </div>
            <p className="text-text-secondary text-sm m-0 font-medium">
              {filter === "unread" ? "No new notifications" : "No read notifications"}
            </p>
            <p className="text-xs text-text-secondary/70 m-0">
              {filter === "unread" ? "You're all caught up!" : "Read notifications will appear here"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden mt-2">
          <div className="divide-y divide-border">
            {listed.map((notif) => {
              const expired = isExpired(notif.created_at);
              const isEnrollmentRequest = notif.type === "enrollment_request" && notif.reference_id !== null;
              return (
                <div
                  key={notif.id}
                  className={`px-5 md:px-6 py-4 flex items-start gap-3 transition-colors group ${
                    !notif.is_read ? "bg-btn-primary/[0.03] hover:bg-btn-primary/[0.05]" : "hover:bg-gray-50/60"
                  } ${expired ? "opacity-55" : ""}`}
                >
                  {getTypeIcon(notif.type)}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm m-0 leading-snug ${!notif.is_read ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-secondary/70">{getTimeAgo(notif.created_at)}</span>
                      {expired && (
                        <span className="text-[10px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">Expiring</span>
                      )}
                    </div>

                    {/* Inline approve/reject/block for enrollment requests (teachers only) */}
                    {isEnrollmentRequest && teacher && (
                      <EnrollmentActions requestId={notif.reference_id!} initialStatus={notif.reference_status ?? null} />
                    )}
                  </div>

                  {/* Per-notification hover actions */}
                  <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {notif.is_read ? (
                      <button
                        onClick={() => markUnread(notif.id)}
                        title="Mark as unread"
                        className="p-1.5 rounded-md text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <MailClosedIcon />
                      </button>
                    ) : (
                      <button
                        onClick={() => markRead(notif.id)}
                        title="Mark as read"
                        className="p-1.5 rounded-md text-text-secondary hover:bg-gray-100 hover:text-text-primary transition-colors cursor-pointer bg-transparent border-none"
                      >
                        <MailOpenIcon />
                      </button>
                    )}
                    <button
                      onClick={() => deleteOne(notif.id, { onSuccess: () => toast.success("Notification deleted.") })}
                      title="Delete"
                      className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer bg-transparent border-none"
                    >
                      <TrashIcon />
                    </button>
                  </div>

                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-btn-primary flex-shrink-0 mt-1.5 group-hover:hidden" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
