import { useState, useMemo } from "react";
import { useBrowseCourses } from "./useEnrollment";
import { useClasses } from "../classes/useClasses";
import { useDebounce } from "../../hooks/useDebounce";

interface CourseItem {
  id: number;
  name: string;
  image_path: string | null;
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

export default function BrowseCourses() {
  const { data: allCourses = [], isLoading } = useBrowseCourses();
  const { data: enrolledCourses = [] } = useClasses();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const enrolledIds = useMemo(() => {
    const set = new Set<number>();
    (enrolledCourses as CourseItem[]).forEach((c) => set.add(c.id));
    return set;
  }, [enrolledCourses]);

  const filteredCourses = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const courses = q
      ? (allCourses as CourseItem[]).filter((c) => c.name.toLowerCase().includes(q))
      : (allCourses as CourseItem[]);
    return [...courses].sort((a, b) => {
      const aEnrolled = enrolledIds.has(a.id) ? 1 : 0;
      const bEnrolled = enrolledIds.has(b.id) ? 1 : 0;
      return aEnrolled - bEnrolled;
    });
  }, [allCourses, debouncedQuery, enrolledIds]);

  const enrolledCount = (allCourses as CourseItem[]).filter((c) => enrolledIds.has(c.id)).length;
  const availableCount = filteredCourses.filter((c) => !enrolledIds.has(c.id)).length;

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">Browse Courses</h1>
        <p className="text-sm text-text-secondary mt-1 m-0">
          {availableCount} available · {enrolledCount} enrolled
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search courses..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white text-sm text-text-primary placeholder:text-text-secondary border border-border shadow-sm focus:outline-none focus:border-btn-primary focus:ring-2 focus:ring-btn-primary/10 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary bg-transparent border-none cursor-pointer text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Course list ── */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm py-14 flex flex-col items-center gap-3 text-text-secondary">
          <BookOpenIcon />
          <p className="text-sm m-0">No courses found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border">
            {filteredCourses.map((course) => {
              const isEnrolled = enrolledIds.has(course.id);

              return (
                <div
                  key={course.id}
                  className={`px-5 md:px-6 py-4 flex items-center justify-between gap-4 transition-colors ${
                    isEnrolled ? "opacity-60" : "hover:bg-gray-50/60"
                  }`}
                >
                  {/* Left: icon + name */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isEnrolled ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-500"
                    }`}>
                      <BookOpenIcon />
                    </div>
                    <span className="font-medium text-sm text-text-primary truncate">{course.name}</span>
                  </div>

                  {/* Right: enrolled badge */}
                  {isEnrolled && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                        Enrolled
                      </span>
                    </div>
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
