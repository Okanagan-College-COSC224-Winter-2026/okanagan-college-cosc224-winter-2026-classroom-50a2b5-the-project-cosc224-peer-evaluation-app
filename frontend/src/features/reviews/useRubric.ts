import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRubricForAssignment,
  getRubric,
  getCriteria,
  createRubric,
  createCriteria,
  deleteRubric,
} from "../../services/rubricApi";

export function useRubricForAssignment(assignmentId: number) {
  return useQuery({
    queryKey: ["rubric", "assignment", assignmentId],
    queryFn: () => getRubricForAssignment(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useRubric(rubricId: number | null) {
  return useQuery({
    queryKey: ["rubric", rubricId],
    queryFn: () => getRubric(rubricId!),
    enabled: rubricId !== null,
  });
}

export function useCriteria(rubricId: number | null) {
  return useQuery({
    queryKey: ["criteria", rubricId],
    queryFn: () => getCriteria(rubricId!),
    enabled: rubricId !== null,
  });
}

export function useCreateRubric(assignmentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      canComment: boolean;
      criteria: { question: string; scoreMax: number; hasScore: boolean }[];
    }) =>
      createRubric(assignmentId, params.canComment).then(async ({ id }) => {
        await Promise.all(
          params.criteria.map((c) =>
            createCriteria(id, c.question, c.scoreMax, params.canComment, c.hasScore)
          )
        );
        return id;
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rubric", "assignment", assignmentId],
      });
    },
  });
}

export function useDeleteRubric(assignmentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rubricId: number) => deleteRubric(rubricId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["rubric", "assignment", assignmentId],
      });
    },
  });
}
