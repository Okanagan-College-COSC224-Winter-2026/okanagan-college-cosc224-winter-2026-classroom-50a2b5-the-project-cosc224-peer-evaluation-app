import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import RichTextEditor from "../components/RichTextEditor";
import Button from "../components/Button";
import StatusMessage from "../components/StatusMessage";
import { isTeacher, isStudent } from "../util/login";
import AssignmentAttachment from "../components/AssignmentAttachment";
import ConclusionSection from "../components/ConclusionSection";

import {
  listStuGroup,
  getUserId,
  listCourseMembers,
  getReview,
  getAssignment,
  updateAssignment,
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
  const [stuGroup, setStuGroup] = useState<StudentGroups[]>([]);
  const [classMembers, setClassMembers] = useState<User[]>([]);
  const [revieweeID, setRevieweeID] = useState(0);
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [review, setReview] = useState<number[]>([]);
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState("");

  useEffect(() => {
    (async () => {
      const fetchedID = await getUserId();
      const stus = await listStuGroup(Number(id), fetchedID);
      setStuGroup(stus);

      try {
        const data = await getAssignment(Number(id));
        setAssignment(data);
        setEditName(data.name ?? "");
        setEditDescription(data.description_html ?? "");
      } catch {
        // Assignment unavailable
      }

      if (revieweeID !== 0) {
        try {
          const reviewResponse = await getReview(Number(id), fetchedID, revieweeID);
          const reviewData = await reviewResponse.json();
          setReview(reviewData.grades);
        } catch {
          // No review yet — expected
        }
      }

      try {
        const members = await listCourseMembers(String(id));
        setClassMembers(members);
      } catch {
        // Members list unavailable
      }
    })();
  }, [revieweeID, id]);

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

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>) {
    setRevieweeID(Number(event.target.value));
  }

  const handleSaveDescription = async () => {
    try {
      setEditStatus("Saving...");
      await updateAssignment(Number(id), editName, editDescription);
      setAssignment((prev) =>
        prev ? { ...prev, name: editName, description_html: editDescription } : prev
      );
      setIsEditing(false);
      setEditStatus("Saved successfully!");
      setTimeout(() => setEditStatus(""), 3000);
    } catch {
      setEditStatus("Error saving. Please try again.");
    }
  };

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

      {/* Description section — teachers can edit, everyone sees rendered HTML */}
      {assignment && (
        <div className="assignment-description-section">
          {isTeacher() && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Description</Button>
          )}
          {isTeacher() && isEditing && (
            <div className="edit-description-form">
              <label>Assignment Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="edit-name-input"
                title="Assignment name"
                placeholder="Assignment name"
              />
              <label>Description:</label>
              <RichTextEditor
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Write assignment instructions..."
              />
              <div className="edit-description-actions">
                <Button onClick={handleSaveDescription}>Save</Button>
                <Button onClick={() => setIsEditing(false)} type="secondary">Cancel</Button>
              </div>
              <StatusMessage message={editStatus} type="success" />
            </div>
          )}
          {!isEditing && assignment.description_html && (
            <div
              className="assignment-description-html"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(assignment.description_html),
              }}
            />
          )}
          {!isEditing && !assignment.description_html && (
            <p className="assignment-no-description">No description added yet.</p>
          )}
        </div>
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
                title="Select group member"
              />
              <label htmlFor={stus.userID.toString()}>
                {nameFromId(stus.userID)}
              </label>
            </div>
          ))}

          <button
            className="submitReview"
            onClick={() => {
              if (revieweeID === 0) {
                alert("Please select a group member to review.");
                return;
              }
              window.location.href = `/assignments/${id}/review/${revieweeID}`;
            }}
          >
            Review This Member
          </button>
        </div>
      )}
    </>
  );
}