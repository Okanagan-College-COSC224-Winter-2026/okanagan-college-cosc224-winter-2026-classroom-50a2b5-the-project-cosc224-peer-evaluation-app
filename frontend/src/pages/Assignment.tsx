import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import { isTeacher, isStudent } from "../util/login";
import AssignmentAttachment from "../components/AssignmentAttachment";
import ConclusionSection from "../components/ConclusionSection";
import {
  listStuGroup,
  getUserId,
  listCourseMembers,
  createReview,
  createCriterion,
  getReview,
  getAssignment,
} from "../util/api";

interface SelectedCriterion {
  row: number;
  column: number;
}

interface AssignmentData {
  id: number;
  name: string;
  description_html?: string;
}

export default function Assignment() {
  const { id } = useParams();
  const [stuGroup, setStuGroup] = useState<any[]>([]);
  const [revieweeID, setRevieweeID] = useState(0);
  const [stuID, setStuID] = useState(0);
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [review, setReview] = useState<number[]>([]);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);

  useEffect(() => {
    (async () => {
      const stuID = await getUserId();
      setStuID(stuID);
      const stus = await listStuGroup(Number(id), stuID);
      setStuGroup(stus);

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
      } catch (error) {
        console.error("Error fetching review:", error);
      }
    })();
  }, [revieweeID, id, stuID]);

  const handleCriterionSelect = (row: number, column: number) => {
    const existingIndex = selectedCriteria.findIndex(
      (criterion) => criterion.row === row && criterion.column === column
    );
    if (existingIndex >= 0) {
      setSelectedCriteria((prev) =>
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      setSelectedCriteria((prev) => {
        const filteredCriteria = prev.filter((criterion) => criterion.row !== row);
        return [...filteredCriteria, { row, column }];
      });
    }
  };

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>): void {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
  }

  return (
    <>
      <h2>Assignment {id}</h2>

      {assignment?.description_html && (
        <div
          className="Assignment__description"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(assignment.description_html),
          }}
        />
      )}

      {isTeacher() && <RubricCreator assignmentID={Number(id)} />}

      {!isTeacher() && (
        <div>
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
              abel htmlFor={stus.userID.toString()}>{stus.userID}</label>
            </div>
          ))}

          <RubricDisplay
            rubricId={Number(id)}
            onCriterionSelect={handleCriterionSelect}
            grades={review}
          />

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
          <button
            onClick={async () => {
              try {
                const reviewResponse = await createReview(Number(id), stuID, revieweeID);
                const reviewData = await reviewResponse.json();
                for (const criterion of selectedCriteria) {
                  await createCriterion(reviewData.id, criterion.row, criterion.column, "");
                }
                console.log("Review submitted successfully");
              } catch (error) {
                console.error("Error submitting review:", error);
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
