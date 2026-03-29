import { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useBrowseCourses, useMyEnrollmentRequests, useRequestEnrollment } from "./useEnrollment";
import { useClasses } from "../classes/useClasses";
import { useDebounce } from "../../hooks/useDebounce";

interface CourseItem {
  id: number;
  name: string;
  image_path: string | null;
}

interface EnrollmentRequestItem {
  id: number;
  courseID: number;
  status: string;
}

export default function BrowseCourses() {
  const { data: allCourses = [], isLoading } = useBrowseCourses();
  const { data: myRequests = [] } = useMyEnrollmentRequests();
  const { data: enrolledCourses = [] } = useClasses();
  const { mutate: requestEnroll, isPending } = useRequestEnrollment();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const enrolledIds = useMemo(() => {
    const set = new Set<number>();
    (enrolledCourses as CourseItem[]).forEach((c) => set.add(c.id));
    return set;
  }, [enrolledCourses]);

  const requestMap = useMemo(() => {
    const map: Record<number, string> = {};
    (myRequests as EnrollmentRequestItem[]).forEach((r) => {
      // Only track pending/approved statuses; rejected students can re-request
      if (r.status === "pending" || r.status === "approved") {
        map[r.courseID] = r.status;
      }
    });
    return map;
  }, [myRequests]);

  const filteredCourses = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const courses = q
      ? (allCourses as CourseItem[]).filter((c) => c.name.toLowerCase().includes(q))
      : (allCourses as CourseItem[]);
    // Show enrolled courses last
    return [...courses].sort((a, b) => {
      const aEnrolled = enrolledIds.has(a.id) ? 1 : 0;
      const bEnrolled = enrolledIds.has(b.id) ? 1 : 0;
      return aEnrolled - bEnrolled;
    });
  }, [allCourses, debouncedQuery, enrolledIds]);

  function handleRequest(courseId: number) {
    requestEnroll(courseId, {
      onSuccess: () => toast.success("Enrollment request sent!"),
      onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to send request."),
    });
  }

  function getStatusBadge(status: string) {
    if (status === "pending") return <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Pending</span>;
    if (status === "approved") return <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Approved</span>;
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full max-w-260 mx-auto">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Browse Courses</h1>
        <p className="text-text-secondary">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-260 mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">Browse Courses</h1>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses..."
            className="w-full px-4 py-2.5 rounded-lg bg-white text-sm text-text-primary placeholder:text-text-secondary border border-border shadow-sm focus:outline-none focus:border-btn-primary focus:shadow-md transition-all duration-200"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 md:px-8 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary m-0">Available Courses</h3>
        </div>

        {(filteredCourses as CourseItem[]).length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-2">
            <p className="text-text-secondary text-sm m-0">No courses found.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(filteredCourses as CourseItem[]).map((course) => {
              const isEnrolled = enrolledIds.has(course.id);
              const requestStatus = requestMap[course.id];
              return (
                <div key={course.id} className={`px-5 md:px-8 py-4 flex items-center justify-between gap-4 ${isEnrolled ? "opacity-60" : ""}`}>
                  <span className="font-medium text-sm text-text-primary">{course.name}</span>
                  <div className="flex items-center gap-2">
                    {isEnrolled ? (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Enrolled</span>
                    ) : requestStatus ? (
                      getStatusBadge(requestStatus)
                    ) : (
                      <button
                        onClick={() => handleRequest(course.id)}
                        disabled={isPending}
                        className="px-3 py-1.5 rounded-lg bg-btn-primary text-white text-xs font-semibold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        Request Enrollment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
