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
  getReview
} from "../util/api";

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

  useEffect(() => {
      (async () => {
        const currentUserId = getUserId();
        if (currentUserId === null) {
          console.error('User not logged in');
          return;
        }
        setStuID(currentUserId);
        
        // Get assignment to find its courseID, then fetch group members
        try {
          const assignment = await getAssignment(Number(id));
          const myGroup = await listStuGroup(assignment.courseID);
          if (myGroup?.members) {
            // Filter out self from group members (can't review yourself)
            setGroupMembers(myGroup.members.filter((m: GroupMember) => m.id !== currentUserId));
          }
        } catch (error) {
          console.error('Error fetching group members:', error);
        }

        try {
          const reviewResponse = await getReview(Number(id), currentUserId, revieweeID);
          const reviewData = await reviewResponse.json();
          setReview(reviewData.grades);
          console.log("Review data:", reviewData);
        } catch (error) {
          console.error('Error fetching review:', error);
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
        <h2>Assignment {id}</h2>
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
        <RubricDisplay rubricId={Number(id)} onCriterionSelect={handleCriterionSelect} grades={review} />
      </div>
      {
        isTeacher() && 
          <div className='assignmentRubric'>
            <RubricCreator id={Number(id)}/>
          </div>
      }

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

