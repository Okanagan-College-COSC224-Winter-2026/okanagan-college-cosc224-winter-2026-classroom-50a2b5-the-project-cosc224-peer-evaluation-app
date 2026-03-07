import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./ClassEvaluations.css";
import TabNavigation from "../components/TabNavigation";
import Modal from "../components/Modal";
import { listAssignments, listClasses, getReviewsForAssignment } from "../util/api";

// Shape of a single review returned by GET /review/assignment/<id>
interface ReviewCriterion {
  id: number;
  reviewID: number;
  criterionRowID: number;
  criterion_name: string | null;
  score_max: number | null;
  grade: number | null;
  comments: string;
}

interface ReviewData {
  id: number;
  assignmentID: number;
  comments: string | null;
  reviewer: { id: number | null; name: string; email: string | null };
  reviewee: { id: number | null; name: string; email: string | null };
  criteria: ReviewCriterion[];
}

// Summary info displayed in the assignment list
interface AssignmentSummary {
  id: number;
  name: string;
  reviewCount: number;
  averageScore: number | null;
  maxScore: number | null;
}

export default function ClassEvaluations() {
  const { id } = useParams();
  const [className, setClassName] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<AssignmentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummary | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Load assignments and compute review summaries
  useEffect(() => {
    (async () => {
      try {
        const [assignments, classes] = await Promise.all([
          listAssignments(String(id)),
          listClasses(),
        ]);
        const currentClass = classes.find((c: { id: number }) => c.id === Number(id));
        setClassName(currentClass?.name || null);

        // For each assignment, fetch reviews and compute summary stats
        const results: AssignmentSummary[] = await Promise.all(
          assignments.map(async (assignment: Assignment) => {
            try {
              const reviewsData: ReviewData[] = await getReviewsForAssignment(assignment.id);

              // Compute the total score per review, then average those totals
              const reviewTotals = reviewsData
                .map((r) => {
                  const scored = r.criteria.filter((c) => c.grade !== null);
                  if (scored.length === 0) return null;
                  return scored.reduce((sum, c) => sum + (c.grade ?? 0), 0);
                })
                .filter((t): t is number => t !== null);

              const avg =
                reviewTotals.length > 0
                  ? reviewTotals.reduce((sum, t) => sum + t, 0) / reviewTotals.length
                  : null;

              // Compute max possible score per review (sum of all score_max values)
              // Use the first review's criteria as reference (all reviews share the same rubric)
              const firstReview = reviewsData.find((r) => r.criteria.length > 0);
              const maxScore = firstReview
                ? firstReview.criteria
                    .filter((c) => c.score_max !== null)
                    .reduce((sum, c) => sum + (c.score_max ?? 0), 0)
                : null;

              return {
                id: assignment.id,
                name: assignment.name,
                reviewCount: reviewsData.length,
                averageScore: avg,
                maxScore: maxScore && maxScore > 0 ? maxScore : null,
              };
            } catch {
              return {
                id: assignment.id,
                name: assignment.name,
                reviewCount: 0,
                averageScore: null,
                maxScore: null,
              };
            }
          })
        );

        setSummaries(results);
      } catch (err) {
        console.error("Failed to load evaluations:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const openAssignment = async (summary: AssignmentSummary) => {
    setSelectedAssignment(summary);
    setModalLoading(true);
    try {
      const data: ReviewData[] = await getReviewsForAssignment(summary.id);
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setReviews([]);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <div className="ClassHeader">
        <div className="ClassHeaderLeft">
          <h2>{className}</h2>
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
          { label: "Groups", path: `/classes/${id}/groups` },
          { label: "Evaluations", path: `/classes/${id}/evaluations` },
        ]}
      />

      <div className="Evaluations">
        <h3>My Evaluations</h3>

        {loading ? (
          <p className="EvalLoading">Loading evaluations...</p>
        ) : summaries.length === 0 ? (
          <p className="EvalEmpty">No assignments in this course yet.</p>
        ) : (
          <>
            <ul className="EvalAssignmentList">
              {summaries.map((s) => (
                <li
                  key={s.id}
                  className={`EvalAssignmentItem ${s.reviewCount > 0 ? "hasReviews" : ""}`}
                  onClick={() => s.reviewCount > 0 && openAssignment(s)}
                >
                  <div className="EvalAssignmentName">{s.name}</div>
                  <div className="EvalAssignmentStats">
                    {s.reviewCount === 0 ? (
                      <span className="EvalNoReviews">No reviews yet</span>
                    ) : (
                      <>
                        <span className="EvalReviewCount">
                          {s.reviewCount} review{s.reviewCount !== 1 ? "s" : ""}
                        </span>
                        {s.averageScore !== null && (
                          <span className="EvalAvgScore">
                            Avg: {s.averageScore.toFixed(1)}{s.maxScore !== null ? ` / ${s.maxScore}` : ""}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Course total — average of all assignment averages */}
            {(() => {
              const scored = summaries.filter((s) => s.averageScore !== null);
              if (scored.length === 0) return null;
              const courseAvg =
                scored.reduce((sum, s) => sum + (s.averageScore ?? 0), 0) / scored.length;
              const courseMax = scored.some((s) => s.maxScore !== null)
                ? scored.reduce((sum, s) => sum + (s.maxScore ?? 0), 0) / scored.length
                : null;
              return (
                <div className="EvalCourseTotal">
                  <span className="EvalCourseTotalLabel">Course Average:</span>
                  <span className="EvalCourseTotalValue">
                    {courseAvg.toFixed(1)}{courseMax !== null ? ` / ${courseMax.toFixed(1)}` : ""}
                  </span>
                </div>
              );
            })()}
          </>
        )}
      </div>

      <Modal
        isOpen={selectedAssignment !== null}
        onClose={() => setSelectedAssignment(null)}
        title={`Reviews: ${selectedAssignment?.name || ""}`}
      >
        {modalLoading ? (
          <p>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div className="EvalReviewStack">
            {reviews.map((review, idx) => {
              const scoredCriteria = review.criteria.filter((c) => c.grade !== null);
              const total = scoredCriteria.reduce((sum, c) => sum + (c.grade ?? 0), 0);
              const totalMax = scoredCriteria
                .filter((c) => c.score_max !== null)
                .reduce((sum, c) => sum + (c.score_max ?? 0), 0);

              return (
                <div key={review.id} className="EvalReviewCard">
                  <div className="EvalReviewHeader">
                    <span className="EvalReviewLabel">
                      Review {idx + 1}
                    </span>
                    <span className="EvalReviewerName">
                      by {review.reviewer.name}
                    </span>
                  </div>

                  {review.criteria.length === 0 ? (
                    <p className="EvalNoCriteria">No criteria scores recorded.</p>
                  ) : (
                    <>
                      <table className="EvalCriteriaTable">
                        <thead>
                          <tr>
                            <th>Criteria</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {review.criteria.map((crit) => (
                            <tr key={crit.id}>
                              <td>{crit.criterion_name || `Criterion ${crit.criterionRowID}`}</td>
                              <td>
                                {crit.grade !== null
                                  ? `${crit.grade}${crit.score_max !== null ? ` / ${crit.score_max}` : ""}`
                                  : "\u2014"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Show review-level comments at the bottom */}
                      {review.comments && review.comments.trim() !== "" && (
                        <div className="EvalReviewComments">
                          <span className="EvalCommentsLabel">Comments:</span>
                          <p className="EvalCommentsText">
                            {review.comments}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {scoredCriteria.length > 0 && (
                    <div className="EvalReviewTotal">
                      Total: <strong>{total}{totalMax > 0 ? ` / ${totalMax}` : ""}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
