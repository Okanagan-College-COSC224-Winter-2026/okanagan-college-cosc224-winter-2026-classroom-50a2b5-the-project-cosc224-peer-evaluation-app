import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import { isTeacher, getUserId } from "../../util/login";
import {
  useAssignment,
  useAssignmentResources,
} from "./useAssignments";
import { useRubricForAssignment } from "../reviews/useRubric";
import { useMySubmission } from "../reviews/useSubmission";
import { useMyGroup } from "../groups/useGroups";
import { useReview } from "../reviews/useReviews";

export interface AssignmentResourceItem {
  id: number;
  assignmentID: number;
  uploaderID: number;
  original_name: string;
  download_url: string;
  created_at?: string;
}

export interface GroupMember {
  id: number;
  name: string;
  email: string;
}

export function useAssignmentDetail() {
  const { id } = useParams();
  const assignmentId = Number(id);
  const location = useLocation();

  const [revieweeID, setRevieweeID] = useState<number>(0);

  const teacherMode = isTeacher();
  const isManageTab = teacherMode && location.pathname.endsWith("/manage");

  const { data: assignment } = useAssignment(assignmentId);
  const { data: rubricData } = useRubricForAssignment(assignmentId);
  const { data: mySubmission } = useMySubmission(assignmentId, !teacherMode);
  const { data: resources } = useAssignmentResources(assignmentId);
  const { data: myGroupData } = useMyGroup(assignment?.courseID ?? 0);
  const { data: reviewData } = useReview(assignmentId, revieweeID);

  const rubricId: number | null = rubricData ? rubricData.id : null;
  const review: number[] = reviewData?.grades ?? [];
  const currentUserId = getUserId();
  const resourceList: AssignmentResourceItem[] = resources ?? [];
  const groupMembers: GroupMember[] = myGroupData?.members
    ? myGroupData.members.filter((m: GroupMember) => m.id !== currentUserId)
    : [];

  return {
    id,
    assignmentId,
    assignment,
    teacherMode,
    isManageTab,
    rubricId,
    review,
    resourceList,
    groupMembers,
    mySubmission,
    revieweeID,
    setRevieweeID,
  };
}
