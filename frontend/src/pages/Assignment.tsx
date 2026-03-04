import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import { isTeacher, isStudent } from "../util/login";
import AssignmentAttachment from "../components/AssignmentAttachment";

import { 
  listStuGroup,
  getUserId,
  listCourseMembers,
  getReview
} from "../util/api";

interface SelectedCriterion {
  row: number;
  column: number;
}

export default function Assignment() {
  const { id } = useParams();
  const [stuGroup, setStuGroup] = useState<StudentGroups[]>([]);
  const [classMembers, setClassMembers] = useState<User[]>([]);
  const [revieweeID, setRevieweeID] = useState<number>(0);
  const [stuID, setStuID] = useState<number>(0);
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [review, setReview] = useState<number[]>([]);

  useEffect(() => {
      (async () => {
        const stuID = await getUserId();
      setStuID(stuID);
      const stus = await listStuGroup(Number(id), stuID);
      setStuGroup(stus);
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
  }, [revieweeID, id, stuID]);

  const nameFromId = (userId: number) => {
    return classMembers.find((m) => m.id === userId)?.name || `Student #${userId}`;
  };

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

  // Build tabs — students get a Feedback tab, teachers don't
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

      <TabNavigation tabs={tabs} />

      <div className='assignmentRubricDisplay'>
        <RubricDisplay rubricId={Number(id)} onCriterionSelect={handleCriterionSelect} grades={review} />
      </div>
      {
        isTeacher() && 
          <div className='assignmentRubric'>
            <RubricCreator id={Number(id)}/>
          </div>
      }

      <AssignmentAttachment assignmentId={Number(id)} />

{
      //List group members as radio buttons to select for given review
      !isTeacher() && <div className='groupMembers'>
        <h3>Select a group member to review</h3>
          {stuGroup.map((stus) => {
                return (
                  <div key={stus.userID}>
                  <input type='radio' id={stus.userID.toString()} value={stus.userID} name='groupMembers' onChange={handleRadioChange}></input>
                  <label htmlFor={stus.userID.toString()}>{nameFromId(stus.userID)}</label>
                  </div>
                )
              }
            )
          }
          <button className='submitReview' onClick={async () => {
            if (revieweeID === 0) {
              alert("Please select a group member to review.");
              return;
            }
            // Navigate to the new rubric-based review page
            window.location.href = `/assignments/${id}/review/${revieweeID}`;
          }}>Review This Member</button>
      </div>}
    </>
  );
}
