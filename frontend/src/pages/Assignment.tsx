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
  const [classMembers, setClassMembers] = useState<User[]>([]);
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

      {assignment?.description_html && (
        <div
          className="Assignment__description"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(assignment.description_html),
          }}
        />
      )}

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