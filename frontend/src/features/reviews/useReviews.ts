import { useQuery, useMutation } from "@tanstack/react-query";
import {
  submitReview,
  getReview,
  getReviewsForAssignment,
  getCourseGradeSummary,
} from "../../services/reviewApi";

export function useReview(assignmentId: number, revieweeId: number) {
  return useQuery({
    queryKey: ["review", assignmentId, revieweeId],
    queryFn: async () => {
      const resp = await getReview(assignmentId, revieweeId);
      if (!resp.ok) return null;
      return resp.json();
    },
    enabled: !!assignmentId && revieweeId > 0,
  });
}

export function useReviewsForAssignment(assignmentId: number) {
  return useQuery({
    queryKey: ["reviews", assignmentId],
    queryFn: () => getReviewsForAssignment(assignmentId),
    enabled: !!assignmentId,
  });
}

export function useCourseGradeSummary(courseId: number) {
  return useQuery({
    queryKey: ["grade-summary", courseId],
    queryFn: () => getCourseGradeSummary(courseId),
    enabled: !!courseId,
  });
}

export function useSubmitReview() {
  return useMutation({
    mutationFn: (params: {
      assignmentID: number;
      revieweeID: number;
      criteria: { criterionRowID: number; grade: number; comments: string }[];
      comments?: string;
    }) =>
      submitReview(
        params.assignmentID,
        params.revieweeID,
        params.criteria,
        params.comments
      ),
  });
}
