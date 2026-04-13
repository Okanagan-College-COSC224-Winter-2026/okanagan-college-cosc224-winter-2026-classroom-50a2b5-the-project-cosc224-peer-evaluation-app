import { useParams } from "react-router-dom";
import toast from "../../lib/toast";
import { useCourseMembers } from "./useClasses";
import { usePendingRequests, useApproveRequest, useRejectRequest } from "../enrollment/useEnrollment";
import { isTeacher, isAdmin } from "../../util/login";

interface EnrollmentRequestItem {
  id: number;
  studentID: number;
  courseID: number;
  status: string;
  student: { id: number; name: string; email: string; display_name?: string };
}

export default function ClassMembers() {
  const { id } = useParams()
  const courseId = Number(id);
  const teacherOrAdmin = isTeacher() || isAdmin();
  const { data: members = [], isLoading } = useCourseMembers(id as string);
  const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingRequests(teacherOrAdmin ? courseId : 0);
  const { mutate: approveReq } = useApproveRequest();
  const { mutate: rejectReq } = useRejectRequest();

  function handleApprove(requestId: number) {
    approveReq(requestId, {
      onSuccess: () => toast.success("Student enrolled."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to approve."),
    });
  }

  function handleReject(requestId: number) {
    rejectReq(requestId, {
      onSuccess: () => toast.success("Request rejected."),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reject."),
    });
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-260 mx-auto flex flex-col gap-6">
      <h2 className="text-2xl font-semibold text-text-primary m-0">Members</h2>


      {teacherOrAdmin && (pendingRequests as EnrollmentRequestItem[]).length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 md:px-8 py-4 border-b border-amber-200 bg-amber-50/50 flex items-center justify-between">
            <h3 className="text-base font-semibold text-amber-700 m-0">Enrollment Requests</h3>
            <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
              {(pendingRequests as EnrollmentRequestItem[]).length} pending
            </span>
          </div>
          <div className="divide-y divide-amber-100">
            {(pendingRequests as EnrollmentRequestItem[]).map((req) => (
              <div key={req.id} className="px-5 md:px-8 py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-text-primary block truncate">
                    {req.student?.display_name || req.student?.name}
                  </span>
                  <span className="text-xs text-text-secondary block truncate">{req.student?.email}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold border-none cursor-pointer hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold bg-transparent cursor-pointer hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 md:px-8 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary m-0">Enrolled Students</h3>
          <span className="text-xs font-medium text-text-secondary bg-bg-secondary px-2.5 py-1 rounded-full">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </span>
        </div>

        {isLoading ? (
          <div className="px-5 md:px-8 py-8 text-center">
            <p className="text-text-secondary text-sm m-0">Loading members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="px-5 md:px-8 py-8 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <p className="text-text-secondary text-sm m-0">No members enrolled yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((member: User) => (
              <div
                key={member.id}
                className="px-5 md:px-8 py-3.5 flex items-center gap-3 transition-colors hover:bg-btn-primary/[0.03]"
              >
                <div className="w-9 h-9 rounded-full bg-btn-primary/10 flex items-center justify-center text-sm font-semibold text-btn-primary flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium text-text-primary block truncate">{member.name}</span>
                  {member.email && (
                    <span className="text-xs text-text-secondary block truncate">{member.email}</span>
                  )}
                </div>
                <span className="text-xs text-text-secondary font-mono flex-shrink-0">#{member.id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
