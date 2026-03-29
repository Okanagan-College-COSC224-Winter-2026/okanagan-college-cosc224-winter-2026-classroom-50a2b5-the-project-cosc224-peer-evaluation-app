import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  requestEnrollment,
  getMyEnrollmentRequests,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  browseAllCourses,
} from "../../services/enrollmentRequestApi";

export function useBrowseCourses() {
  return useQuery({
    queryKey: ["browse-courses"],
    queryFn: browseAllCourses,
  });
}

export function useMyEnrollmentRequests() {
  return useQuery({
    queryKey: ["my-enrollment-requests"],
    queryFn: getMyEnrollmentRequests,
  });
}

export function usePendingRequests(courseId: number) {
  return useQuery({
    queryKey: ["pending-enrollment-requests", courseId],
    queryFn: () => getPendingRequests(courseId),
    enabled: !!courseId,
  });
}

export function useRequestEnrollment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseID: number) => requestEnrollment(courseID),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["browse-courses"] });
    },
  });
}

export function useApproveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => approveRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRejectRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-enrollment-requests"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
