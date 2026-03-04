import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
<<<<<<< Updated upstream
import { isTeacher } from "../util/login";

import { 
=======
import { isTeacher, isStudent } from "../util/login";
import AssignmentAttachment from "../components/AssignmentAttachment";
import ConclusionSection from "../components/ConclusionSection";

import {
>>>>>>> Stashed changes
  listStuGroup,
  getUserId,
  createReview,
  createCriterion,
  getReview
} from "../util/api";

interface SelectedCriterion {
  row: number;
  column: number;
}

export default function Assignment() {
  const { id } = useParams();
<<<<<<< Updated upstream
  const [stuGroup, setStuGroup] = useState<StudentGroups[]>([]);
  const [revieweeID, setRevieweeID] = useState<number>(0);
  const [stuID, setStuID] = useState<number>(0);
=======
  const [stuGroup, setStuGroup] = useState<any[]>([]);
  const [classMembers, setClassMembers] = useState<User[]>([]);
  const [revieweeID, setRevieweeID] = useState(0);
  const [stuID, setStuID] = useState(0);
>>>>>>> Stashed changes
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [review, setReview] = useState<number[]>([]);

  useEffect(() => {
      (async () => {
        const stuID = await getUserId();
      setStuID(stuID);
      const stus = await listStuGroup(Number(id), stuID);
      setStuGroup(stus);
<<<<<<< Updated upstream
        try {
          const reviewResponse = await getReview(Number(id), stuID, revieweeID);
          const reviewData = await reviewResponse.json();
          setReview(reviewData.grades);
          console.log("Review data:", reviewData);
        } catch (error) {
          console.error('Error fetching review:', error);
        }
      })();
=======

      try {
        const assignmentData = await getAssignment(Number(id));
        setAssignment(assignmentData);
      } catch (error) {
        console.error("Error fetching assignment:", error);
      }

      try {
        const reviewResponse = await getReview(Number(id), stuID, revieweeID);
        const reviewData = await reviewResponse.json();
        setReview(reviewData.grades);
      } catch {
        // No review yet — expected
      }

      try {
        const members = await listCourseMembers(String(id));
        setClassMembers(members);
      } catch {
        // Members list unavailable
      }
    })();
>>>>>>> Stashed changes
  }, [revieweeID, id, stuID]);

  const nameFromId = (userId: number) => {
    return classMembers.find((m) => m.id === userId)?.name || `Student #${userId}`;
  };

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

  const tabs = [
    { label: "Home", path: `/assignments/${id}` },
    { label: "Group", path: `/assignments/${id}/group` },
  ];

  if (isStudent()) {
    tabs.push({ label: "Feedback", path: `/assignments/${id}/feedback` });
  }

  return (
    <>
      <div className="AssignmentHeader">
        <h2>Assignment {id}</h2>
      </div>
<<<<<<< Updated upstream
=======

      <TabNavigation tabs={tabs} />
>>>>>>> Stashed changes

      <TabNavigation
        tabs={[
          {
            label: "Home",
            path: `/assignment/${id}`,
          },
          {
            label: "Group",
            path: `/assignment/${id}/group`,
          }
        ]}
      />

<<<<<<< Updated upstream
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
          {stuGroup.map((stus) => {
                return (
                  <>
                  <input type='radio' id={stus.userID.toString()} value={stus.userID} name='groupMembers' onChange={handleRadioChange}></input>
                  <label htmlFor={stus.userID.toString()}>{stus.userID}</label>
                  <br></br>
                  </>
                )
=======
      <div className="assignmentRubricDisplay">
        <RubricDisplay
          rubricId={Number(id)}
          onCriterionSelect={handleCriterionSelect}
          grades={review}
        />
      </div>

      {isTeacher() && (
        <div className="assignmentRubric">
          <RubricCreator id={Number(id)} />
        </div>
      )}

      <AssignmentAttachment assignmentId={Number(id)} />
      <ConclusionSection assignmentId={Number(id)} />

      {!isTeacher() && (
        <div className="groupMembers">
          <h3>Select a group member to review</h3>
          {stuGroup.map((stus) => (
            <div key={stus.userID}>
              <input
                type="radio"
                id={stus.userID.toString()}
                value={stus.userID}
                name="groupMembers"
                onChange={handleRadioChange}
              />
              <label htmlFor={stus.userID.toString()}>
                {nameFromId(stus.userID)}
              </label>
            </div>
          ))}
          <button
            className="submitReview"
            onClick={async () => {
              if (revieweeID === 0) {
                alert("Please select a group member to review.");
                return;
              }
              try {
                const reviewResponse = await createReview(Number(id), stuID, revieweeID);
                const reviewData = await reviewResponse.json();
                for (const criterion of selectedCriteria) {
                  await createCriterion(reviewData.id, criterion.row, criterion.column, "");
                }
                console.log("Review submitted successfully");
              } catch (error) {
                console.error("Error submitting review:", error);
>>>>>>> Stashed changes
              }
            )
          }
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
<<<<<<< Updated upstream
}

=======
}
>>>>>>> Stashed changes
