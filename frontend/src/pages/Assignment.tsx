import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import "./Assignment.css";
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

export default function Assignment() {
  const { id } = useParams();
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

  const loadRubric = async () => {
    try {
      const rubric = await getRubricForAssignment(Number(id));
      setRubricId(rubric ? rubric.id : null);
    } catch (error) {
      console.error('Error fetching rubric:', error);
      setRubricId(null);
    }
  };

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

        // Load rubric for this assignment
        await loadRubric();
        
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
            setGroupMembers(myGroup.members.filter((m: GroupMember) => m.id !== currentUserId));
          }
        } catch (err) {
          console.error("Failed to load assignment or group members:", err);
        }

        // Only fetch review if a reviewee has been selected
        // NOTE: Review endpoints not yet implemented in Flask backend.
        // This will 404 until the review feature is migrated.
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
  }, [revieweeID, id]);

  const handleCriterionSelect = (row: number, column: number) => {
    // Check if this criterion is already selected
    const existingIndex = selectedCriteria.findIndex(
      criterion => criterion.row === row && criterion.column === column
    );
    
    if (existingIndex >= 0) {
      // If already selected, remove it (toggle off)
      setSelectedCriteria(prev => 
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      // Add the new criterion, removing any other selection in the same row
      setSelectedCriteria(prev => {
        // Remove any existing selection for this row
        const filteredCriteria = prev.filter(criterion => criterion.row !== row);
        // Add the new selection
        return [...filteredCriteria, { row, column }];
      });
    }
  };

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
    console.log(`Selected group member ID: ${selectedID}`);
  }

  return (
    <>
      <div className="AssignmentHeader">
        <h2>{assignment?.name ? assignment.name : `Assignment ${id}`}</h2>
      </div>

      <TabNavigation
        tabs={[
          {
            label: "Home",
            path: `/assignments/${id}`,
          },
          // Groups are now at course level - access via ClassHome > Groups tab
        ]}
      />

      <div className='assignmentRubricDisplay'>
        <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} grades={review} />
      </div>
      <StatusMessage message={statusMessage} type={statusType} />
      {
        isTeacher() && rubricId && (
          <div className='assignmentRubric'>
            <button className='deleteRubricBtn' onClick={async () => {
              if (window.confirm('Are you sure you want to delete this rubric? All criteria will be removed.')) {
                try {
                  await deleteRubric(rubricId);
                  setRubricId(null);
                } catch (error) {
                  console.error('Error deleting rubric:', error);
                }
              }
            }}>Delete Rubric</button>
          </div>
        )
      }
      {
        isTeacher() && !rubricId && (
          <div className='assignmentRubric'>
            <RubricCreator id={Number(id)} onRubricCreated={(newId) => setRubricId(newId)} />
          </div>
        )
      }

      {isTeacher() && assignment && (
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
                <input
                  type='text'
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

{
      //List group members as radio buttons to select for given review
      !isTeacher() && <div className='groupMembers'>
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
          <button className='submitReview' onClick={async () => {
            console.log("Submitting review with selected criteria:", selectedCriteria);
            try {
              const reviewResponse = await createReview(Number(id), stuID, revieweeID);
              const reviewData = await reviewResponse.json();
              console.log("Review response:", reviewData);
              for (const criterion of selectedCriteria) {
                await createCriterion(reviewData.id, criterion.row, criterion.column, "");
              }
              console.log('Review submitted successfully');
            } catch (error) {
              console.error('Error submitting review:', error);
            }
          }}>Submit Review</button>
      </div>}
    </>
  );
}

