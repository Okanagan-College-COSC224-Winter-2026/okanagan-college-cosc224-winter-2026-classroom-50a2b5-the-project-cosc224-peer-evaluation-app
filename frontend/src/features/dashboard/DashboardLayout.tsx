import { useState, useMemo, useEffect } from "react";
import ClassCard from "../classes/ClassCard";
import { useClassesWithAssignments } from "../classes/useClasses";
import { useDebounce } from "../../hooks/useDebounce";
import { isTeacher, isAdmin, isStudent } from "../../util/login";
import { getCourseImageUrl } from "../../services/classApi";
import { getCourseGradeSummary } from "../../services/reviewApi";


interface AdminCourse extends CourseWithAssignments {
  teacherID: number;
  teacher_name: string;
}

function AdminDashboard({ courses }: { courses: AdminCourse[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, AdminCourse[]>();
    for (const course of courses) {
      const teacher = course.teacher_name || "Unknown Teacher";
      if (!map.has(teacher)) map.set(teacher, []);
      map.get(teacher)!.push(course);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [courses]);

  if (courses.length === 0) {
    return <p className="text-text-secondary text-sm text-center py-16">No courses have been created yet.</p>;
  }
return (
  <div className="max-w-6xl mx-auto px-8 py-10">
    <div className="flex flex-col gap-14">
      {grouped.map(([teacherName, teacherCourses]) => (
        <section key={teacherName} className="flex flex-col gap-6 bg-white/50 p-5 rounded-sm">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {teacherName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900">
                {teacherName}
              </h2>
              <span className="text-sm text-gray-500">
                {teacherCourses.length}{" "}
                {teacherCourses.length === 1 ? "course" : "courses"}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {teacherCourses.map((course) => (
              <a
                key={course.id}
                href={`/classes/${course.id}/home`}
                className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-[3px] transition-all duration-300"
              >
                {/* Image */}
                <div className="h-44 w-full overflow-hidden">
                  <img
                    src={
                      course.image_path
                        ? getCourseImageUrl(course.id)
                        : "https://crc.losrios.edu//shared/img/social-1200-630/programs/general-science-social.jpg"
                    }
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                  />
                </div>

                {/* Content BELOW image (like your screenshot) */}
                <div className="px-5 py-4 flex flex-col gap-1.5">
                  <h3 className="text-base font-semibold text-gray-900 leading-snug">
                    {course.name}
                  </h3>

                  <span className="text-sm text-gray-500">
                    {course.assignmentCount || 0} assignments
                  </span>
                </div>
              </a>
            ))}
          </div>

        </section>
      ))}
    </div>
  </div>
);
}

export default function DashboardLayout() {
  const { data: courses = [], isLoading } = useClassesWithAssignments();

  const [grades, setGrades] = useState<Record<number, string>>({});

  useEffect(() => {
    courses.forEach(async (course: CourseWithAssignments) => {
      try {
        const data = await getCourseGradeSummary(course.id);
        const pcts = (data.assignments ?? [])
          .map((a: { individualAverage: number | null; individualMax: number | null; groupAverage: number | null; groupMax: number | null }) => {
            const typePcts: number[] = [];
            if (a.individualAverage != null && a.individualMax && a.individualMax > 0) { typePcts.push(a.individualAverage / a.individualMax); }
            if (a.groupAverage != null && a.groupMax && a.groupMax > 0) { typePcts.push(a.groupAverage / a.groupMax); }
            return typePcts.length > 0 ? typePcts.reduce((s, p) => s + p, 0) / typePcts.length : null;
          })
          .filter((p: number | null): p is number => p !== null);
        const pct = pcts.length > 0 ? Math.round(pcts.reduce((s: number, p: number) => s + p, 0) / pcts.length * 100) : null;
        setGrades(prev => ({
          ...prev,
          [course.id]: pct !== null ? `Grade: ${pct}%` : `Grade: N/A`
        }));
      } catch {
        // no grade available yet
      }
    });
  }, [courses]);
  

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  const filteredCourses = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((course: CourseWithAssignments) =>
      course.name.toLowerCase().includes(q)
    );
  }, [courses, debouncedQuery]);

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full">
        <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-3 mb-6">Peer Review Dashboard</h1>
        <p className="text-text-secondary">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full max-w-[85vw] sm:max-w-260 mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4 mb-6">
        <h1 className="text-2xl font-bold text-text-primary m-0">Peer Review Dashboard</h1>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full px-4 py-2.5 rounded-lg bg-white text-sm text-text-primary placeholder:text-text-secondary border border-border shadow-sm focus:outline-none focus:border-btn-primary focus:shadow-md transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary bg-transparent border-none cursor-pointer text-xs transition-colors"
            >
              &#10005;
            </button>
          )}
        </div>
      </div>


      {isAdmin() && (
        <AdminDashboard courses={filteredCourses as AdminCourse[]} />
      )}

     
      {!isAdmin() && (
        <>
          {isStudent() && courses.length === 0 && !debouncedQuery && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.3} stroke="currentColor" className="w-10 h-10 text-indigo-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84 51.39 51.39 0 0 0-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">You&apos;re not in any courses yet</h2>
              <p className="text-text-secondary text-sm max-w-xs leading-relaxed">
                Sit tight — your instructor will enroll you when things are ready. Check back soon!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {filteredCourses.map((course: CourseWithAssignments) => (
              <ClassCard
                key={course.id}
                image={course.image_path ? getCourseImageUrl(course.id) : "https://crc.losrios.edu//shared/img/social-1200-630/programs/general-science-social.jpg"}
                name={course.name}
                subtitle={`${course.assignmentCount || 0} assignments`}
                href={`/classes/${course.id}/home`}
                grade={!isTeacher() ? grades[course.id] : undefined}
              />
            ))}

            {isTeacher() && !debouncedQuery && (
              <div
                className="size-full min-h-[13rem] flex flex-col items-center justify-center gap-2 bg-bg-secondary text-text-secondary rounded-xl border-2 border-dashed border-bg-tertiary transition-all duration-150 hover:border-btn-primary hover:text-btn-primary hover:bg-emerald-50 cursor-pointer"
                onClick={() => window.location.href = "/classes/create"}
              >
                <span className="text-2xl font-light">+</span>
                <span className="text-sm font-medium">Create Class</span>
              </div>
            )}
          </div>

          {debouncedQuery && filteredCourses.length === 0 && (
            <p className="text-text-secondary text-sm mt-6 text-center">No courses matching "{debouncedQuery}"</p>
          )}
        </>
      )}
    </div>
  );
}
