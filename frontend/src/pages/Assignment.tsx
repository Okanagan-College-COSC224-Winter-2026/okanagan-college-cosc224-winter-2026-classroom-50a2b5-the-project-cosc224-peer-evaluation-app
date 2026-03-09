import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import { isTeacher, getUserId } from "../util/login";

import {
  getAssignment,
  listStuGroup,
  createReview,
  createCriterion,
  getReview,
  editAssignment,
  deleteAssignment,
  getRubricForAssignment,
  deleteRubric,
  getMySubmission,
  uploadMySubmission,
  deleteMySubmission,
  listAssignmentResources,
  uploadAssignmentResource,
  deleteAssignmentResource,
} from "../util/api";
import StatusMessage from "../components/StatusMessage";

interface GroupMember {
  id: number;
  name: string;
  email: string;
}

interface SelectedCriterion {
  row: number;
  column: number;
}

interface SubmissionAttachment {
  id: number;
  filename: string;
  download_url: string;
  studentID: number;
  assignmentID: number;
}

interface AssignmentResourceItem {
  id: number;
  assignmentID: number;
  uploaderID: number;
  original_name: string;
  download_url: string;
  created_at?: string;
}

export default function Assignment() {
  const { id } = useParams();
  const location = useLocation();
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [revieweeID, setRevieweeID] = useState<number>(0);
  const [stuID, setStuID] = useState<number>(0);
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [review, setReview] = useState<number[]>([]);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editIsAnonymous, setEditIsAnonymous] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [rubricId, setRubricId] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionAttachment | null>(null);
  const [resources, setResources] = useState<AssignmentResourceItem[]>([]);
  const [resourceUpload, setResourceUpload] = useState<File | null>(null);

  const teacherMode = isTeacher();
  const isManageTab = teacherMode && location.pathname.endsWith('/manage');

  const loadRubric = useCallback(async () => {
    try {
      const rubric = await getRubricForAssignment(Number(id));
      setRubricId(rubric ? rubric.id : null);
    } catch (error) {
      console.error('Error fetching rubric:', error);
      setRubricId(null);
    }
  }, [id]);

  const loadMySubmission = useCallback(async () => {
    if (teacherMode || !id) {
      setMySubmission(null);
      return;
    }

    try {
      const submission = await getMySubmission(Number(id));
      setMySubmission(submission || null);
    } catch {
      setMySubmission(null);
    }
  }, [teacherMode, id]);

  const loadResources = useCallback(async () => {
    if (!id) {
      setResources([]);
      return;
    }

    try {
      const list = await listAssignmentResources(Number(id));
      setResources(list || []);
    } catch {
      setResources([]);
    }
  }, [id]);

  const toDatetimeLocal = (value?: string) => {
    if (!value) {
      return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "";
    }
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  useEffect(() => {
    (async () => {
      const currentUserId = getUserId();
      if (currentUserId === null) {
        console.error('User not logged in');
        return;
      }
      setStuID(currentUserId);

      await loadRubric();
      await loadMySubmission();
      await loadResources();

      try {
        const assignmentResponse = await getAssignment(Number(id));
        setAssignment(assignmentResponse);
        setEditName(assignmentResponse.name || "");
        setEditDescription(assignmentResponse.description || "");
        setEditStartDate(toDatetimeLocal(assignmentResponse.start_date));
        setEditDueDate(toDatetimeLocal(assignmentResponse.due_date));
        setEditIsAnonymous(assignmentResponse.is_anonymous ?? true);

        const myGroup = await listStuGroup(assignmentResponse.courseID);
        if (myGroup?.members) {
          setGroupMembers(myGroup.members.filter((m: GroupMember) => m.id !== currentUserId));
        }
      } catch (err) {
        console.error("Failed to load assignment or group members:", err);
      }

      if (revieweeID > 0) {
        try {
          const reviewResponse = await getReview(Number(id), currentUserId, revieweeID);
          if (reviewResponse.ok) {
            const reviewData = await reviewResponse.json();
            setReview(reviewData.grades);
          }
        } catch {
          // Review endpoint not yet implemented — silently ignore
        }
      }
    })();
  }, [revieweeID, id, loadRubric, loadMySubmission, loadResources]);

  const handleCriterionSelect = (row: number, column: number) => {
    const existingIndex = selectedCriteria.findIndex(
      criterion => criterion.row === row && criterion.column === column
    );

    if (existingIndex >= 0) {
      setSelectedCriteria(prev =>
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      setSelectedCriteria(prev => {
        const filteredCriteria = prev.filter(criterion => criterion.row !== row);
        return [...filteredCriteria, { row, column }];
      });
    }
  };

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
    console.log(`Selected group member ID: ${selectedID}`);
  }

  // Shared button style matching the original .AssignmentPage button
  const pageBtn = "p-2 border-none bg-btn-primary text-white text-base cursor-pointer transition-all duration-100 hover:brightness-90 mx-2.5 ml-5"
  const secBtn = "p-2 border-none bg-btn-secondary text-white text-base cursor-pointer transition-all duration-100 hover:brightness-90 mx-2.5 ml-5"
  const managementLabel = "flex flex-col gap-1 text-text-primary"
  const managementInput = "p-2 border border-bg-secondary rounded"

  return (
    <>
      <TabNavigation
        tabs={[
          {
            label: teacherMode ? "Review" : "Home",
            path: `/assignments/${id}`,
          },
          ...(teacherMode
            ? [{ label: "Management", path: `/assignments/${id}/manage` }]
            : []),
        ]}
      />

      <div className="AssignmentHeader flex flex-row justify-between items-center p-3">
        <h2>{assignment?.name ? assignment.name : `Assignment ${id}`}</h2>
      </div>

      {assignment?.description && (
        <p className="mx-3 mb-3 text-text-primary bg-bg-secondary border border-bg-secondary rounded-[8px] px-3 py-2.5 whitespace-pre-wrap">
          {assignment.description}
        </p>
      )}

      <StatusMessage message={statusMessage} type={statusType} />

      {teacherMode && assignment && isManageTab && (
        <div className="m-3 p-3 border border-bg-secondary rounded-[8px] flex flex-col gap-2">
          <h3>Manage Assignment</h3>
          <>
            <label className={managementLabel}>
              Name
              <input type='text' value={editName} onChange={(e) => setEditName(e.target.value)} className={managementInput} />
            </label>
            <label className={managementLabel}>
              Description
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="p-2 border border-bg-secondary rounded min-h-[120px] resize-y"
              />
            </label>
            <label className={managementLabel}>
              Start date
              <input type='datetime-local' value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)} className={managementInput} />
            </label>
            <label className={managementLabel}>
              Due date
              <input type='datetime-local' value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className={managementInput} />
            </label>
            <label className="flex flex-row items-center gap-2 text-text-primary">
              <input
                type='checkbox'
                checked={editIsAnonymous}
                onChange={(e) => setEditIsAnonymous(e.target.checked)}
                className="w-auto p-0"
              />
              Anonymous submissions/reviews
            </label>
            <div className="flex gap-2 mt-2">
              <button
                className={pageBtn}
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

                    if (editStartDate) {
                      payload.start_date = new Date(editStartDate).toISOString();
                    }
                    if (editDueDate) {
                      payload.due_date = new Date(editDueDate).toISOString();
                    }

                    const updated = await editAssignment(Number(id), payload);
                    setAssignment(updated.assignment);
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
                className={secBtn}
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
                    await deleteAssignment(Number(id));
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
          </>
        </div>
      )}

      {teacherMode && isManageTab && (
        <div className="m-3 p-3 border border-bg-secondary rounded-[8px] flex flex-col gap-2">
          <h3>Supporting Documents</h3>
          {resources.length === 0 ? (
            <p>No supporting documents uploaded yet.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {resources.map((resource) => (
                <li key={resource.id} className="flex items-center justify-between gap-2 flex-wrap">
                  <a href={resource.download_url} target='_blank' rel='noreferrer'>
                    {resource.original_name}
                  </a>
                  <button
                    className={secBtn}
                    onClick={async () => {
                      try {
                        setStatusMessage('');
                        await deleteAssignmentResource(resource.id);
                        await loadResources();
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

          <input
            type='file'
            onChange={(event) => {
              const file = event.target.files?.[0];
              setResourceUpload(file || null);
            }}
          />
          <button
            className={pageBtn}
            onClick={async () => {
              if (!resourceUpload) {
                setStatusType('error');
                setStatusMessage('Please choose a supporting document first.');
                return;
              }

              try {
                setStatusMessage('');
                await uploadAssignmentResource(Number(id), resourceUpload);
                setResourceUpload(null);
                await loadResources();
                setStatusType('success');
                setStatusMessage('Supporting document uploaded successfully.');
              } catch (error) {
                setStatusType('error');
                setStatusMessage(error instanceof Error ? error.message : 'Failed to upload supporting document.');
              }
            }}
          >
            Upload Supporting Document
          </button>
        </div>
      )}

      {teacherMode && isManageTab && (
        <>
          {rubricId && (
            <div className="m-3 p-3">
              <button
                className={secBtn}
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this rubric? All criteria will be removed.')) {
                    try {
                      await deleteRubric(rubricId);
                      setRubricId(null);
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
          )}
          {!rubricId && (
            <div className="m-3 p-3">
              <RubricCreator
                id={Number(id)}
                onRubricCreated={(newId) => {
                  setRubricId(newId);
                  setStatusType('success');
                  setStatusMessage('Rubric created successfully.');
                }}
              />
            </div>
          )}
        </>
      )}

      {(!teacherMode || !isManageTab) && (
        <div>
          <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
        </div>
      )}

      {teacherMode && !isManageTab && (
        <div className="m-3 p-3 border border-bg-secondary rounded-[8px] flex flex-col gap-2">
          <h3>Supporting Documents (Student Preview)</h3>
          {resources.length === 0 ? (
            <p>No supporting documents available.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {resources.map((resource) => (
                <li key={resource.id} className="flex items-center justify-between gap-2 flex-wrap">
                  <a href={resource.download_url} target='_blank' rel='noreferrer'>
                    {resource.original_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!teacherMode && (
        <div className="m-3 p-3">
          <h3>Supporting Documents</h3>
          {resources.length === 0 ? (
            <p>No supporting documents available.</p>
          ) : (
            <ul className="list-none m-0 p-0 flex flex-col gap-2">
              {resources.map((resource) => (
                <li key={resource.id} className="flex items-center justify-between gap-2 flex-wrap">
                  <a href={resource.download_url} target='_blank' rel='noreferrer'>
                    {resource.original_name}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <h3>My Attachment</h3>
          {mySubmission ? (
            <div className="flex items-center gap-2.5 flex-wrap mb-2">
              <a href={mySubmission.download_url} target='_blank' rel='noreferrer'>
                {mySubmission.filename}
              </a>
              <button
                className={secBtn}
                onClick={async () => {
                  try {
                    setStatusMessage('');
                    await deleteMySubmission(Number(id));
                    setMySubmission(null);
                    setSelectedFile(null);
                    setStatusType('success');
                    setStatusMessage('Attachment removed successfully.');
                  } catch (error) {
                    setStatusType('error');
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to remove attachment.');
                  }
                }}
              >
                Remove Attachment
              </button>
            </div>
          ) : (
            <p>No attachment uploaded yet.</p>
          )}
          <input
            type='file'
            onChange={(event) => {
              const file = event.target.files?.[0];
              setSelectedFile(file || null);
            }}
          />
          <button
            className={pageBtn}
            onClick={async () => {
              if (!selectedFile) {
                setStatusType('error');
                setStatusMessage('Please choose a file first.');
                return;
              }

              try {
                setStatusMessage('');
                const response = await uploadMySubmission(Number(id), selectedFile);
                setMySubmission(response.submission);
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

          <h3>Select a group member to review</h3>
          {groupMembers.length === 0 ? (
            <p>No group members found. You may not be assigned to a group yet.</p>
          ) : (
            groupMembers.map((member) => (
              <div key={member.id}>
                <input
                  type='radio'
                  id={member.id.toString()}
                  value={member.id}
                  name='groupMembers'
                  onChange={handleRadioChange}
                />
                <label htmlFor={member.id.toString()}>{member.name}</label>
              </div>
            ))
          )}
          <button
            className={pageBtn}
            onClick={async () => {
              console.log("Submitting review with selected criteria:", selectedCriteria);
              try {
                const reviewResponse = await createReview(Number(id), stuID, revieweeID);
                const reviewData = await reviewResponse.json();
                console.log("Review response:", reviewData);
                for (const criterion of selectedCriteria) {
                  await createCriterion(reviewData.id, criterion.row, criterion.column, "");
                }
                console.log('Review submitted successfully');
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
      )}
    </>
  );
}
