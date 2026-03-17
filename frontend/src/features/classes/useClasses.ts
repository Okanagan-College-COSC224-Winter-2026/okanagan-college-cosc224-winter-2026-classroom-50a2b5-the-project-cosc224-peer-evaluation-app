import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listClasses, createClass, listCourseMembers } from "../../services/classApi";
import { listAssignments } from "../../services/assignmentApi";

export function useClasses() {
  return useQuery({
    queryKey: ["classes"],
    queryFn: listClasses,
  });
}

export function useClassesWithAssignments() {
  return useQuery({
    queryKey: ["classes", "with-assignments"],
    queryFn: async () => {
      const courses: Course[] = await listClasses();
      const withAssignments = await Promise.all(
        courses.map(async (course) => {
          try {
            const assignments = await listAssignments(String(course.id));
            return { ...course, assignments: assignments || [], assignmentCount: assignments?.length || 0 };
          } catch {
            return { ...course, assignments: [], assignmentCount: 0 };
          }
        })
      );
      return withAssignments as CourseWithAssignments[];
    },
  });
}

export function useCourseMembers(classId: string) {
  return useQuery({
    queryKey: ["classes", classId, "members"],
    queryFn: () => listCourseMembers(classId),
    enabled: !!classId,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createClass(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}
