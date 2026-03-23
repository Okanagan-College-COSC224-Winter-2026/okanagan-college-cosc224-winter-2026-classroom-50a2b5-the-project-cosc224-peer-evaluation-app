import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import "./Assignment.css";
import RubricCreator from "../components/RubricCreator";
import RubricDisplay from "../components/RubricDisplay";
import TabNavigation from "../components/TabNavigation";
import { isTeacher } from "../util/login";

import {
  listStuGroup,
  getUserId,
  createReview,
  createCriterion,
  getReview,
  downloadAssignmentFile,
  submitAssignmentFile,
  downloadMySubmissionFile,
  listAssignmentSubmissions,
  downloadStudentSubmissionFile,
} from "../util/api";

interface SelectedCriterion {
  row: number;
  column: number;
}

interface Submission {
  id: number;
  studentID: number;
  assignmentID: number;
  file_name: string;
  file_path: string;
  submitted_at?: string;
  student_name?: string;
}

export default function Assignment() {
  const { id } = useParams();
  const assignmentId = Number(id);

  const [stuGroup, setStuGroup] = useState<StudentGroups[]>([]);
  const [revieweeID, setRevieweeID] = useState<number>(0);
  const [stuID, setStuID] = useState<number>(0);
  const [selectedCriteria, setSelectedCriteria] = useState<
    SelectedCriterion[]
  >([]);
  const [review, setReview] = useState<number[]>([]);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string>("");

  const [teacherSubmissions, setTeacherSubmissions] = useState<Submission[]>(
    []
  );
  const [loadingTeacherSubmissions, setLoadingTeacherSubmissions] =
    useState(false);

  const loadTeacherSubmissions = async () => {
    try {
      console.log("Teacher mode: loading submissions for", assignmentId);
      setLoadingTeacherSubmissions(true);
      const submissions = await listAssignmentSubmissions(assignmentId);
      console.log("Teacher submissions response:", submissions);
      setTeacherSubmissions(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Failed to load submissions"
      );
    } finally {
      setLoadingTeacherSubmissions(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (isTeacher()) {
          await loadTeacherSubmissions();
          return;
        }

        const currentStuID = await getUserId();
        setStuID(currentStuID);

        const stus = await listStuGroup(assignmentId, currentStuID);
        setStuGroup(stus);

        try {
          const reviewResponse = await getReview(
            assignmentId,
            currentStuID,
            revieweeID
          );
          const reviewData = await reviewResponse.json();
          setReview(reviewData.grades || []);
        } catch (error) {
          console.error("Error fetching review:", error);
        }
      } catch (error) {
        console.error("Error loading assignment page:", error);
        setSubmissionMessage(
          error instanceof Error
            ? error.message
            : "Failed to load assignment page"
        );
      }
    })();
  }, [revieweeID, assignmentId]);

  const handleCriterionSelect = (row: number, column: number) => {
    const existingIndex = selectedCriteria.findIndex(
      (criterion) =>
        criterion.row === row && criterion.column === column
    );

    if (existingIndex >= 0) {
      setSelectedCriteria((prev) =>
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      setSelectedCriteria((prev) => {
        const filteredCriteria = prev.filter(
          (criterion) => criterion.row !== row
        );
        return [...filteredCriteria, { row, column }];
      });
    }
  };

  function handleRadioChange(
    event: ChangeEvent<HTMLInputElement>
  ): void {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
  }

  const handleDownloadAssignmentFile = async () => {
    try {
      setSubmissionMessage("");
      await downloadAssignmentFile(assignmentId);
    } catch (error) {
      console.error("Error downloading assignment file:", error);
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Failed to download assignment file"
      );
    }
  };

  const handleSubmissionFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    setSubmissionFile(file);
  };

  const handleUploadSubmission = async () => {
    if (!submissionFile) {
      setSubmissionMessage("Please choose a file first.");
      return;
    }

    try {
      setSubmissionMessage("");
      await submitAssignmentFile(assignmentId, submissionFile);
      setSubmissionMessage("Submission uploaded successfully.");
    } catch (error) {
      console.error("Error uploading submission:", error);
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Failed to upload submission"
      );
    }
  };

  const handleDownloadMySubmission = async () => {
    try {
      setSubmissionMessage("");
      await downloadMySubmissionFile(assignmentId);
    } catch (error) {
      console.error("Error downloading submission:", error);
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Failed to download your submission"
      );
    }
  };

  const handleDownloadStudentSubmission = async (studentId: number) => {
    try {
      setSubmissionMessage("");
      await downloadStudentSubmissionFile(assignmentId, studentId);
    } catch (error) {
      console.error("Error downloading student submission:", error);
      setSubmissionMessage(
        error instanceof Error
          ? error.message
          : "Failed to download student submission"
      );
    }
  };

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
          {
            label: "Group",
            path: `/assignments/${id}/group`,
          },
        ]}
      />

      <div className="assignmentPage">
        <div className="assignmentMainCard">
          <div className="assignmentSectionHeader">
            <h3>Rubric</h3>
          </div>

          <div className="assignmentRubricDisplay">
            <RubricDisplay
              rubricId={assignmentId}
              onCriterionSelect={handleCriterionSelect}
              grades={review}
            />
          </div>
        </div>

        {isTeacher() && (
          <>
            <div className="assignmentMainCard">
              <div className="assignmentSectionHeader">
                <h3>Edit Rubric</h3>
              </div>
              <div className="assignmentRubric">
                <RubricCreator id={assignmentId} />
              </div>
            </div>

            <div className="assignmentMainCard">
              <div className="assignmentSectionHeader">
                <h3>Student Submissions</h3>
              </div>

              <div className="assignmentButtonRow">
                <button
                  className="assignmentActionButton"
                  onClick={loadTeacherSubmissions}
                >
                  Refresh Submissions
                </button>
              </div>

              {loadingTeacherSubmissions ? (
                <p>Loading submissions...</p>
              ) : teacherSubmissions.length === 0 ? (
                <p>No submissions yet.</p>
              ) : (
                <div className="teacherSubmissionsList">
                  {teacherSubmissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="teacherSubmissionRow"
                    >
                      <div className="teacherSubmissionInfo">
                        <p className="teacherSubmissionStudent">
                          {submission.student_name ||
                            `Student ${submission.studentID}`}
                        </p>
                        <p className="teacherSubmissionFile">
                          {submission.file_name}
                        </p>
                        {submission.submitted_at && (
                          <p className="teacherSubmissionDate">
                            Submitted:{" "}
                            {new Date(
                              submission.submitted_at
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <button
                        className="assignmentActionButton"
                        onClick={() =>
                          handleDownloadStudentSubmission(
                            submission.studentID
                          )
                        }
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {!isTeacher() && (
          <div className="studentAssignmentGrid">
            <div className="studentCard">
              <div className="assignmentSectionHeader">
                <h3>Assignment File</h3>
              </div>
              <p className="assignmentHelperText">
                Download the file your teacher uploaded for this assignment.
              </p>
              <button
                className="assignmentActionButton"
                onClick={handleDownloadAssignmentFile}
              >
                Download Assignment File
              </button>
            </div>

            <div className="studentCard">
              <div className="assignmentSectionHeader">
                <h3>Your Submission</h3>
              </div>
              <p className="assignmentHelperText">
                Upload your work, then download it again anytime.
              </p>

              <input
                className="assignmentFileInput"
                type="file"
                onChange={handleSubmissionFileChange}
              />

              {submissionFile && (
                <p className="selectedFileName">
                  Selected file: {submissionFile.name}
                </p>
              )}

              <div className="assignmentButtonRow">
                <button
                  className="assignmentActionButton"
                  onClick={handleUploadSubmission}
                  disabled={!submissionFile}
                >
                  Upload Submission
                </button>

                <button
                  className="assignmentSecondaryButton"
                  onClick={handleDownloadMySubmission}
                >
                  Download My Submission
                </button>
              </div>
            </div>

            <div className="studentCard">
              <div className="assignmentSectionHeader">
                <h3>Peer Review</h3>
              </div>
              <p className="assignmentHelperText">
                Select one group member, choose rubric scores, then
                submit.
              </p>

              <div className="groupMembersList">
                {stuGroup.map((stus) => (
                  <label
                    key={stus.userID}
                    className={`groupMemberOption ${
                      revieweeID === stus.userID ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value={stus.userID}
                      name="groupMembers"
                      onChange={handleRadioChange}
                    />
                    <span>Student {stus.userID}</span>
                  </label>
                ))}
              </div>

              <button
                className="assignmentActionButton"
                onClick={async () => {
                  if (!revieweeID) {
                    setSubmissionMessage(
                      "Please select a group member to review."
                    );
                    return;
                  }

                  try {
                    setSubmissionMessage("");
                    const reviewResponse = await createReview(
                      assignmentId,
                      stuID,
                      revieweeID
                    );
                    const reviewData = await reviewResponse.json();

                    for (const criterion of selectedCriteria) {
                      await createCriterion(
                        reviewData.id,
                        criterion.row,
                        criterion.column,
                        ""
                      );
                    }

                    setSubmissionMessage(
                      "Review submitted successfully."
                    );
                  } catch (error) {
                    console.error("Error submitting review:", error);
                    setSubmissionMessage(
                      error instanceof Error
                        ? error.message
                        : "Failed to submit review"
                    );
                  }
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        )}

        {submissionMessage && (
          <div className="assignmentStatusMessage">
            {submissionMessage}
          </div>
        )}
      </div>
    </>
  );
}