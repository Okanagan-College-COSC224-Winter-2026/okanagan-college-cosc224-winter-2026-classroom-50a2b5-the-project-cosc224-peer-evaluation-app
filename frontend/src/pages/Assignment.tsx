import { useCallback, useEffect, useState, ChangeEvent } from "react";
import { useLocation, useParams } from "react-router-dom";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import Modal from "../components/Modal";
import { isTeacher, getUserId } from "../util/login";

import { 
  getAssignment,
  listStuGroup,
  submitReview,
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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mySubmission, setMySubmission] = useState<SubmissionAttachment | null>(null);
  const [resources, setResources] = useState<AssignmentResourceItem[]>([]);
  const [resourceUpload, setResourceUpload] = useState<File | null>(null);
  const [reviewedMembers, setReviewedMembers] = useState<Set<number>>(new Set());

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

        // Load rubric for this assignment
        await loadRubric();
        await loadMySubmission();
        await loadResources();
        
        // Get assignment to find its courseID, then fetch group members
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
            // Filter out self from group members (can't review yourself)
            const others = myGroup.members.filter((m: GroupMember) => m.id !== currentUserId);
            setGroupMembers(others);

            // Check which members have already been reviewed
            const reviewed = new Set<number>();
            await Promise.all(
              others.map(async (m: GroupMember) => {
                try {
                  const resp = await getReview(Number(id), m.id);
                  if (resp.ok) reviewed.add(m.id);
                } catch { /* no review yet — that's fine */ }
              })
            );
            setReviewedMembers(reviewed);
          }
        } catch (err) {
          console.error("Failed to load assignment or group members:", err);
        }

        // Only fetch review if a reviewee has been selected
        // NOTE: Review endpoints not yet implemented in Flask backend.
        // This will 404 until the review feature is migrated.
        if (revieweeID > 0) {
          try {
            const reviewResponse = await getReview(Number(id), revieweeID);
            if (reviewResponse.ok) {
              const reviewData = await reviewResponse.json();
              // Extract grades from criteria array returned by lookup endpoint
              if (reviewData.criteria) {
                setReview(reviewData.criteria.map((c: { grade: number }) => c.grade ?? 0));
              }
            }
          } catch {
            // Review endpoint not yet implemented — silently ignore
          }
        }
      })();
  }, [revieweeID, id, loadRubric, loadMySubmission, loadResources]);

  const handleCriterionSelect = (row: number, column: number) => {
    // Update the score for this criterion row (column = slider value)
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
          {
            label: teacherMode ? "Review" : "Home",
            path: `/assignments/${id}`,
          },
          ...(teacherMode
            ? [
                {
                  label: "Management",
                  path: `/assignments/${id}/manage`,
                },
              ]
            : []),
          // Groups are now at course level - access via ClassHome > Groups tab
        ]}
      />

      <div className="AssignmentHeader">
        <h2>{assignment?.name ? assignment.name : `Assignment ${id}`}</h2>
      </div>

      {assignment?.description && (
        <p className="assignmentDescription">{assignment.description}</p>
      )}

      <StatusMessage message={statusMessage} type={statusType} />

      {teacherMode && assignment && isManageTab && (
        <div className='assignmentManagement'>
          <h3>Manage Assignment</h3>
          <>
              <label>
                Name
                <input
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </label>
              <label>
                Description
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </label>
              <label>
                Start date
                <input
                  type='datetime-local'
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </label>
              <label>
                Due date
                <input
                  type='datetime-local'
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                />
              </label>
              <label className='checkboxLabel'>
                <input
                  type='checkbox'
                  checked={editIsAnonymous}
                  onChange={(e) => setEditIsAnonymous(e.target.checked)}
                />
                Anonymous submissions/reviews
              </label>
              <div className='assignmentManagementButtons'>
                <button
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
                  className='deleteAssignmentButton'
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
        <div className='assignmentResources'>
          <h3>Supporting Documents</h3>
          {resources.length === 0 ? (
            <p>No supporting documents uploaded yet.</p>
          ) : (
            <ul>
              {resources.map((resource) => (
                <li key={resource.id} className='resourceItem'>
                  <a href={resource.download_url} target='_blank' rel='noreferrer'>
                    {resource.original_name}
                  </a>
                  <button
                    className='removeAttachmentButton'
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
          {
            rubricId && (
              <div className='assignmentRubric'>
                <h3>Rubric Preview</h3>
                <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
                <button className='deleteRubricBtn' onClick={async () => {
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
                }}>Delete Rubric</button>
              </div>
            )
          }
          {
            !rubricId && (
              <div className='assignmentRubric'>
                <RubricCreator
                  id={Number(id)}
                  onRubricCreated={(newId) => {
                    setRubricId(newId);
                    setStatusType('success');
                    setStatusMessage('Rubric created successfully.');
                  }}
                />
              </div>
            )
          }
        </>
      )}

      {teacherMode && !isManageTab && (
        <div className='assignmentResources'>
          <h3>Supporting Documents (Student Preview)</h3>
          {resources.length === 0 ? (
            <p>No supporting documents available.</p>
          ) : (
            <ul>
              {resources.map((resource) => (
                <li key={resource.id} className='resourceItem'>
                  <a href={resource.download_url} target='_blank' rel='noreferrer'>
                    {resource.original_name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

{
      //List group members as radio buttons to select for given review
      !teacherMode && <div className='groupMembers'>
        <h3>Supporting Documents</h3>
        {resources.length === 0 ? (
          <p>No supporting documents available.</p>
        ) : (
          <ul>
            {resources.map((resource) => (
              <li key={resource.id} className='resourceItem'>
                <a href={resource.download_url} target='_blank' rel='noreferrer'>
                  {resource.original_name}
                </a>
              </li>
            ))}
          </ul>
        )}

        <h3>My Attachment</h3>
        {mySubmission ? (
          <div className='attachmentSection'>
            <a href={mySubmission.download_url} target='_blank' rel='noreferrer'>
              {mySubmission.filename}
            </a>
            <button
              className='removeAttachmentButton'
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

      </div>}

      {!teacherMode && <div className='peerReview'>
        <h3>Select a group member to review</h3>
          {groupMembers.length === 0 ? (
            <p>No group members found. You may not be assigned to a group yet.</p>
          ) : (
            groupMembers.map((member) => (
              <div key={member.id} className={reviewedMembers.has(member.id) ? 'reviewedMember' : ''}>
                <input 
                  type='radio' 
                  id={member.id.toString()} 
                  value={member.id} 
                  name='groupMembers' 
                  onChange={handleRadioChange}
                  disabled={reviewedMembers.has(member.id)}
                />
                <label htmlFor={member.id.toString()}>{member.name}</label>
                {reviewedMembers.has(member.id) && (
                  <span className='reviewedBadge'>✓ Reviewed</span>
                )}
              </div>
            ))
          )}
          <button className='submitReview' onClick={async () => {
            console.log("Submitting review with selected criteria:", selectedCriteria);
            try {
              // criterion.row is now the actual CriteriaDescription.id (mapped in RubricDisplay)
              // criterion.column is the slider score value
              const result = await submitReview(
                Number(id),
                revieweeID,
                selectedCriteria.map(c => ({
                  criterionRowID: c.row,
                  grade: c.column,
                  comments: ""
                }))
              );
              console.log('Review submitted successfully:', result);
              setReviewedMembers(prev => new Set(prev).add(revieweeID));
              setStatusType('success');
              setStatusMessage('Review submitted successfully.');
            } catch (error) {
              console.error('Error submitting review:', error);
              setStatusType('error');
              setStatusMessage(error instanceof Error ? error.message : 'Failed to submit review.');
            }
          }}>Submit Review</button>
      </div>}

      {!isTeacher() && (
        <Modal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          title={`Review: ${selectedMemberName}`}
        >
          <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
          <div className='modalReviewActions'>
            <button className='submitReview' onClick={async () => {
              console.log("Submitting review with selected criteria:", selectedCriteria);
              try {
                const result = await submitReview(
                  Number(id),
                  revieweeID,
                  selectedCriteria.map(c => ({
                    criterionRowID: c.row,
                    grade: c.column,
                    comments: ""
                  }))
                );
                console.log('Review submitted successfully:', result);
                setReviewedMembers(prev => new Set(prev).add(revieweeID));
                setIsReviewModalOpen(false);
                setStatusType('success');
                setStatusMessage('Review submitted successfully.');
              } catch (error) {
                console.error('Error submitting review:', error);
                setStatusType('error');
                setStatusMessage(error instanceof Error ? error.message : 'Failed to submit review.');
              }
            }}>Submit Review</button>
          </div>
        </Modal>
      )}
    </>
  );
}

