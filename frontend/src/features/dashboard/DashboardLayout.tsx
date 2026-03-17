import ClassCard from "../classes/ClassCard";
import { useClassesWithAssignments } from "../classes/useClasses";
import { isTeacher, isAdmin } from "../../util/login";

export default function Home() {
  const { data: courses = [], isLoading } = useClassesWithAssignments();

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 w-full">
        <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-3 mb-6">Peer Review Dashboard</h1>
        <p className="text-text-secondary">Loading courses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 w-full">
      <h1 className="text-2xl font-bold text-text-primary border-b border-border pb-3 mb-6">Peer Review Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {courses.map((course: CourseWithAssignments) => (
          <ClassCard
            key={course.id}
            image="https://crc.losrios.edu//shared/img/social-1200-630/programs/general-science-social.jpg"
            name={course.name}
            subtitle={`${course.assignmentCount || 0} assignments`}
            onclick={() => { window.location.href = `/classes/${course.id}/home` }}
          />
        ))}

        {isTeacher() && (
          <div
            className="w-full h-52 flex flex-col items-center justify-center gap-2 bg-bg-secondary text-text-secondary rounded-xl border-2 border-dashed border-bg-tertiary transition-all duration-150 hover:border-btn-primary hover:text-btn-primary hover:bg-emerald-50 cursor-pointer"
            onClick={() => window.location.href = '/classes/create'}
          >
            <span className="text-2xl font-light">+</span>
            <span className="text-sm font-medium">Create Class</span>
          </div>
        )}

        {isAdmin() && (
          <div
            className="w-full h-52 flex flex-col items-center justify-center gap-2 bg-bg-secondary text-text-secondary rounded-xl border-2 border-dashed border-bg-tertiary transition-all duration-150 hover:border-btn-secondary hover:text-btn-secondary hover:bg-slate-200 cursor-pointer"
            onClick={() => window.location.href = '/admin/create-teacher'}
          >
            <span className="text-2xl font-light">+</span>
            <span className="text-sm font-medium">Create Teacher</span>
          </div>
        )}
      </div>
    </div>
  );
}
