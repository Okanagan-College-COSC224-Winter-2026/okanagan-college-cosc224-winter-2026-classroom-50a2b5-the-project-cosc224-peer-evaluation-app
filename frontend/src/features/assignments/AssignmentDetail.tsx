import { useEffect, useState, ChangeEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import RubricCreator from "../reviews/RubricCreator";
import RubricDisplay from "../reviews/RubricDisplay";
import TabNavigation from "../../ui/TabNavigation";
import Modal from "../../ui/Modal";
import { isTeacher, getUserId } from "../../util/login";
import {
  useAssignment,
  useEditAssignment,
  useDeleteAssignment,
  useAssignmentResources,
  useUploadAssignmentResource,
  useDeleteAssignmentResource,
} from "./useAssignments";
import { useRubricForAssignment, useDeleteRubric } from "../reviews/useRubric";
import { useMySubmission, useUploadSubmission, useDeleteSubmission } from "../reviews/useSubmission";
import { useMyGroup } from "../groups/useGroups";
import { useSubmitReview, useReview } from "../reviews/useReviews";
import StatusMessage from "../../ui/StatusMessage";

// Group member type returned from listStuGroup
interface GroupMember {
  id: number;
  name: string;
  email: string;
}

interface SelectedCriterion {
  row: number;
  column: number;
}

interface AssignmentResourceItem {
  id: number;
  assignmentID: number;
  uploaderID: number;
  original_name: string;
  download_url: string;
  created_at?: string;
}

// Reusable style tokens
const cardClass = "mx-4 md:mx-6 my-4 p-5 bg-white rounded-xl border border-border shadow-sm"
const btnPrimary = "inline-flex items-center px-4 py-2 rounded-lg bg-btn-primary text-white text-sm font-semibold hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none"
const btnSecondary = "inline-flex items-center px-4 py-2 rounded-lg bg-btn-secondary text-white text-sm font-medium hover:brightness-110 transition-all cursor-pointer border-none"
const btnDanger = "inline-flex items-center px-4 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer bg-transparent"
const btnOutline = "inline-flex items-center px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer bg-transparent"
const inputClass = "px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm font-[inherit] w-full focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-text-primary"

export default function Assignment() {
  const { id } = useParams();
  const location = useLocation();
  const [revieweeID, setRevieweeID] = useState<number>(0);
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [reviewComment, _setReviewComment] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editIsAnonymous, setEditIsAnonymous] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceUpload, setResourceUpload] = useState<File | null>(null);
  const [_reviewedMembers, setReviewedMembers] = useState<Set<number>>(new Set());

  const teacherMode = isTeacher();
  const isManageTab = teacherMode && location.pathname.endsWith('/manage');

  // --- React Query hooks ---
  const { data: assignment } = useAssignment(Number(id));
  const { data: rubricData } = useRubricForAssignment(Number(id));
  const { data: mySubmission } = useMySubmission(Number(id), !teacherMode);
  const { data: resources } = useAssignmentResources(Number(id));
  const { data: myGroupData } = useMyGroup(assignment?.courseID ?? 0);
  const { data: reviewData } = useReview(Number(id), revieweeID);

  const editAssignmentMutation = useEditAssignment(Number(id));
  const deleteAssignmentMutation = useDeleteAssignment();
  const uploadResourceMutation = useUploadAssignmentResource(Number(id));
  const deleteResourceMutation = useDeleteAssignmentResource(Number(id));
  const uploadSubmissionMutation = useUploadSubmission(Number(id));
  const deleteSubmissionMutation = useDeleteSubmission(Number(id));
  const submitReviewMutation = useSubmitReview();
  const deleteRubricMutation = useDeleteRubric(Number(id));

  // Derive rubricId from query data
  const rubricId = rubricData ? rubricData.id : null;

  // Derive review grades from query data
  const review: number[] = reviewData?.grades ?? [];

  // Derive group members (filter out self)
  const currentUserId = getUserId();
  const groupMembers: GroupMember[] = myGroupData?.members
    ? myGroupData.members.filter((m: GroupMember) => m.id !== currentUserId)
    : [];

  // Derive resource list
  const resourceList: AssignmentResourceItem[] = resources ?? [];

  const toDatetimeLocal = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Sync edit form fields when assignment data loads
  useEffect(() => {
    if (assignment) {
      setEditName(assignment.name || "");
      setEditDescription(assignment.description || "");
      setEditStartDate(toDatetimeLocal(assignment.start_date));
      setEditDueDate(toDatetimeLocal(assignment.due_date));
      setEditIsAnonymous(assignment.is_anonymous ?? true);
    }
  }, [assignment]);

  const handleCriterionSelect = (row: number, column: number) => {
    setSelectedCriteria(prev => {
      const filteredCriteria = prev.filter(criterion => criterion.row !== row);
      return [...filteredCriteria, { row, column }];
    });
  };

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
    const member = groupMembers.find(m => m.id === selectedID);
    setSelectedMemberName(member?.name || "");
    setIsReviewModalOpen(true);
  }

  return (
    <>
      <TabNavigation
        tabs={[
          { label: teacherMode ? "Review" : "Home", path: `/assignments/${id}` },
          ...(teacherMode ? [{ label: "Management", path: `/assignments/${id}/manage` }] : []),
        ]}
      />

      {/* Assignment header */}
      <div className="flex flex-row justify-between items-center px-4 md:px-6 py-3 border-b border-border bg-white">
        <h2 className="text-xl font-semibold text-text-primary m-0">
          {assignment?.name ? assignment.name : `Assignment ${id}`}
        </h2>
      </div>

      {assignment?.description && (
        <p className="mx-4 md:mx-6 my-3 px-4 py-3 bg-bg-secondary rounded-lg text-sm whitespace-pre-wrap border border-border text-text-primary m-0">
          {assignment.description}
        </p>
      )}

      <StatusMessage message={statusMessage} type={statusType} />

      {/* Teacher: Manage Assignment */}
      {teacherMode && assignment && isManageTab && (
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-4">Manage Assignment</h3>

          <div className="flex flex-col gap-4">
            <label className={labelClass}>
              Name
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Description
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className={`${inputClass} min-h-[90px] resize-y`}
              />
            </label>

            <label className={labelClass}>
              Start date
              <input
                type="datetime-local"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className={labelClass}>
              Due date
              <input
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-row items-center gap-2 cursor-pointer text-sm text-text-primary">
              <input
                type="checkbox"
                checked={editIsAnonymous}
                onChange={(e) => setEditIsAnonymous(e.target.checked)}
                className="w-4 h-4"
              />
              Anonymous submissions/reviews
            </label>

            <div className="flex gap-3 flex-wrap pt-2 border-t border-border">
              <button
                className={btnPrimary}
                onClick={async () => {
                  try {
                    setStatusMessage("");
                    const payload: {
                      name?: string;
                      description?: string;
                      start_date?: string;
                      due_date?: string;
                      is_anonymous?: boolean;
                    } = {
                      name: editName,
                      description: editDescription,
                      is_anonymous: editIsAnonymous,
                    };
                    if (editStartDate) payload.start_date = new Date(editStartDate).toISOString();
                    if (editDueDate) payload.due_date = new Date(editDueDate).toISOString();

                    await editAssignmentMutation.mutateAsync(payload);
                    setStatusType('success');
                    setStatusMessage('Assignment updated successfully.');
                  } catch (error) {
                    setStatusType('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to update assignment.');
                  }
                }}
              >
                Save Changes
              </button>

              <button
                className={btnDanger}
                onClick={async () => {
                  try {
                    setStatusMessage("");
                    const confirmed = window.prompt(
                      `Admin confirmation required: type DELETE to remove "${assignment.name}"`
                    );
                    if (confirmed !== 'DELETE') {
                      setStatusType('error');
                      setStatusMessage('Delete cancelled. Type DELETE to confirm assignment removal.');
                      return;
                    }
                    await deleteAssignmentMutation.mutateAsync(Number(id));
                    window.location.href = `/classes/${assignment.courseID}/home`;
                  } catch (error) {
                    setStatusType('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to delete assignment.');
                  }
                }}
              >
                Delete Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher: Manage Supporting Documents */}
      {teacherMode && isManageTab && (
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents</h3>

          {resourceList.length === 0 ? (
            <p className="text-text-secondary text-sm m-0 mb-3">No supporting documents uploaded yet.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-2 mb-3">
              {resourceList.map((resource) => (
                <li key={resource.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline truncate">
                    {resource.original_name}
                  </a>
                  <button
                    className={btnOutline}
                    onClick={async () => {
                      try {
                        setStatusMessage('');
                        await deleteResourceMutation.mutateAsync(resource.id);
                        setStatusType('success');
                        setStatusMessage('Supporting document deleted successfully.');
                      } catch (error) {
                        setStatusType('error');
                        setStatusMessage(error instanceof Error ? error.message : 'Failed to delete supporting document.');
                      }
                    }}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
            <input
              type="file"
              className="text-sm text-text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-bg-secondary file:text-text-primary file:cursor-pointer"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setResourceUpload(file || null);
              }}
            />
            <button
              className={btnSecondary}
              onClick={async () => {
                if (!resourceUpload) {
                  setStatusType('error');
                  setStatusMessage('Please choose a supporting document first.');
                  return;
                }
                try {
                  setStatusMessage('');
                  await uploadResourceMutation.mutateAsync(resourceUpload);
                  setResourceUpload(null);
                  setStatusType('success');
                  setStatusMessage('Supporting document uploaded successfully.');
                } catch (error) {
                  setStatusType('error');
                  setStatusMessage(error instanceof Error ? error.message : 'Failed to upload supporting document.');
                }
              }}
            >
              Upload Document
            </button>
          </div>
        </div>
      )}

      {/* Teacher: Rubric (Manage tab) */}
      {teacherMode && isManageTab && (
        <>
          {rubricId && (
            <div className={cardClass}>
              <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Rubric Preview</h3>
              <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
              <div className="mt-4 pt-3 border-t border-border">
                <button
                  className={btnDanger}
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete this rubric? All criteria will be removed.')) {
                      try {
                        await deleteRubricMutation.mutateAsync(rubricId);
                        setStatusType('success');
                        setStatusMessage('Rubric deleted successfully.');
                      } catch (error) {
                        console.error('Error deleting rubric:', error);
                        setStatusType('error');
                        setStatusMessage(error instanceof Error ? error.message : 'Failed to delete rubric.');
                      }
                    }
                  }}
                >
                  Delete Rubric
                </button>
              </div>
            </div>
          )}

          {!rubricId && (
            <div className={cardClass}>
              <RubricCreator
                id={Number(id)}
                onRubricCreated={() => {
                  setStatusType('success');
                  setStatusMessage('Rubric created successfully.');
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Teacher: Student Preview of resources (Review tab) */}
      {teacherMode && !isManageTab && (
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents (Student Preview)</h3>
          {resourceList.length === 0 ? (
            <p className="text-text-secondary text-sm m-0">No supporting documents available.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
              {resourceList.map((resource) => (
                <li key={resource.id} className="py-1.5 border-b border-border last:border-0">
                  <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                    {resource.original_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Student: Resources + Submission */}
      {!teacherMode && (
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents</h3>
          {resourceList.length === 0 ? (
            <p className="text-text-secondary text-sm m-0 mb-4">No supporting documents available.</p>
          ) : (
            <ul className="m-0 p-0 list-none flex flex-col gap-2 mb-4">
              {resourceList.map((resource) => (
                <li key={resource.id} className="py-1.5 border-b border-border last:border-0">
                  <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                    {resource.original_name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <h3 className="text-base font-semibold text-text-primary mb-3 mt-4">My Attachment</h3>
          {mySubmission ? (
            <div className="flex items-center gap-3 mb-3">
              <a href={mySubmission.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                {mySubmission.filename}
              </a>
              <button
                className={btnOutline}
                onClick={async () => {
                  try {
                    setStatusMessage('');
                    await deleteSubmissionMutation.mutateAsync();
                    setSelectedFile(null);
                    setStatusType('success');
                    setStatusMessage('Attachment removed successfully.');
                  } catch (error) {
                    setStatusType('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to remove attachment.');
                  }
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm m-0 mb-3">No attachment uploaded yet.</p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
            <input
              type="file"
              className="text-sm text-text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-border file:text-sm file:font-medium file:bg-bg-secondary file:text-text-primary file:cursor-pointer"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setSelectedFile(file || null);
              }}
            />
            <button
              className={btnSecondary}
              onClick={async () => {
                if (!selectedFile) {
                  setStatusType('error');
                  setStatusMessage('Please choose a file first.');
                  return;
                }
                try {
                  setStatusMessage('');
                  await uploadSubmissionMutation.mutateAsync(selectedFile);
                  setSelectedFile(null);
                  setStatusType('success');
                  setStatusMessage(mySubmission ? 'Attachment updated successfully.' : 'Attachment uploaded successfully.');
                } catch (error) {
                  setStatusType('error');
                  setStatusMessage(error instanceof Error ? error.message : 'Failed to upload attachment.');
                }
              }}
            >
              {mySubmission ? 'Replace Attachment' : 'Upload Attachment'}
            </button>
          </div>
        </div>
      )}

      {/* Student: Peer Review */}
      {!teacherMode && (
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Select a group member to review</h3>
          {groupMembers.length === 0 ? (
            <p className="text-text-secondary text-sm m-0">No group members found. You may not be assigned to a group yet.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {groupMembers.map((member) => (
                <label key={member.id} className="flex items-center gap-2.5 cursor-pointer text-sm text-text-primary">
                  <input
                    type="radio"
                    id={member.id.toString()}
                    value={member.id}
                    name="groupMembers"
                    onChange={handleRadioChange}
                    className="w-4 h-4 accent-btn-primary"
                  />
                  {member.name}
                </label>
              ))}
            </div>
          )}

          <button
            className={btnPrimary}
            onClick={async () => {
              try {
                await submitReviewMutation.mutateAsync({
                  assignmentID: Number(id),
                  revieweeID,
                  criteria: selectedCriteria.map(c => ({ criterionRowID: c.row, grade: c.column, comments: "" })),
                  comments: reviewComment,
                });
                setStatusType('success');
                setStatusMessage('Review submitted successfully.');
                setReviewedMembers(prev => new Set(prev).add(revieweeID));
              } catch (error) {
                console.error('Error submitting review:', error);
                setStatusType('error');
                setStatusMessage(error instanceof Error ? error.message : 'Failed to submit review.');
              }
            }}
          >
            Submit Review
          </button>
        </div>
      )}

      {/* Student: Review Modal */}
      {!isTeacher() && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Review: ${selectedMemberName}`}
        >
          <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
          <div className="flex justify-end pt-4 mt-2 border-t border-border">
            <button
              className={btnPrimary}
              onClick={async () => {
                try {
                  await submitReviewMutation.mutateAsync({
                    assignmentID: Number(id),
                    revieweeID,
                    criteria: selectedCriteria.map(c => ({ criterionRowID: c.row, grade: c.column, comments: "" })),
                    comments: reviewComment,
                  });
                  setIsReviewModalOpen(false);
                  setReviewedMembers(prev => new Set(prev).add(revieweeID));
                  setStatusType('success');
                  setStatusMessage('Review submitted successfully.');
                } catch (error) {
                  console.error('Error submitting review:', error);
                  setStatusType('error');
                  setStatusMessage(error instanceof Error ? error.message : 'Failed to submit review.');
                }
              }}
            >
              Submit Review
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
