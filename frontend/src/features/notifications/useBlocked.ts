import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBlockedStudents, unblockStudent } from "../../services/blockApi";

const KEY = ["blocked-students"] as const;

export function useBlockedStudents() {
  return useQuery({
    queryKey: KEY,
    queryFn: getBlockedStudents,
  });
}

export function useUnblockStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: number) => unblockStudent(studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
