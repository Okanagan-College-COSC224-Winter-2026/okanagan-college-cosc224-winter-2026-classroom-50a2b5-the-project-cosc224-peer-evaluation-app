import { useState } from "react";
import { useParams } from "react-router-dom";
import TabNavigation from "../../ui/TabNavigation";
import Modal from "../../ui/Modal";
import { useClasses } from "../classes/useClasses";
import { useCourseGradeSummary, useReviewsForAssignment } from "./useReviews";

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

  // Modal state
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);

  // React Query hooks
  const { data: summaryData, isLoading: loading } = useCourseGradeSummary(Number(id));
  const { data: classesData } = useClasses();
  const { data: reviews = [], isLoading: modalLoading } = useReviewsForAssignment(selectedAssignmentId);

  const summaries: AssignmentSummary[] = summaryData?.assignments ?? [];
  const courseAverage: number | null = summaryData?.courseAverage ?? null;
  const courseMax: number | null = summaryData?.courseMax ?? null;

  const className = classesData?.find((c: { id: number }) => c.id === Number(id))?.name ?? null;

  const openAssignment = (summary: AssignmentSummary) => {
    setSelectedAssignment(summary);
    setSelectedAssignmentId(summary.id);
  };

  const closeModal = () => {
    setSelectedAssignment(null);
    setSelectedAssignmentId(0);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border">
        <h2 className="text-xl font-semibold text-text-primary m-0">{className}</h2>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
          { label: "Groups", path: `/classes/${id}/groups` },
          { label: "Evaluations", path: `/classes/${id}/evaluations` },
        ]}
      />

      {/* Evaluations content */}
      <div className="p-4 md:p-6 w-full max-w-4xl">
        <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">My Evaluations</h3>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading evaluations...</p>
        ) : summaries.length === 0 ? (
          <p className="text-text-secondary text-sm">No assignments in this course yet.</p>
        ) : (
          <>
            {/* Assignment list */}
            <ul className="list-none m-0 p-0 flex flex-col gap-2 rounded-xl border border-border bg-bg-secondary p-3">
              {summaries.map((s) => (
                <li
                  key={s.id}
                  className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 px-3 py-2.5 rounded-lg bg-white transition-colors ${
                    s.reviewCount > 0
                      ? "cursor-pointer hover:bg-blue-50"
                      : ""
                  }`}
                  onClick={() => s.reviewCount > 0 && openAssignment(s)}
                >
                  <span className="font-medium text-text-primary text-sm">{s.name}</span>
                  <div className="flex items-center gap-3 text-sm">
                    {s.reviewCount === 0 ? (
                      <span className="text-text-secondary italic">No reviews yet</span>
                    ) : (
                      <>
                        <span className="text-text-secondary">
                          {s.reviewCount} review{s.reviewCount !== 1 ? "s" : ""}
                        </span>
                        {s.averageScore !== null && (
                          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                            Avg: {s.averageScore.toFixed(1)}{s.maxScore !== null ? ` / ${s.maxScore}` : ""}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Course total */}
            {courseAverage !== null && (
              <div className="flex justify-between items-center mt-3 px-3.5 py-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <span className="font-semibold text-sm text-text-primary">Course Average:</span>
                <span className="font-bold text-lg text-blue-600">
                  {courseAverage.toFixed(1)}{courseMax !== null ? ` / ${courseMax.toFixed(1)}` : ""}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review detail modal */}
      <Modal
        isOpen={selectedAssignment !== null}
        onClose={closeModal}
        title={`Reviews: ${selectedAssignment?.name || ""}`}
      >
        {modalLoading ? (
          <p className="text-text-secondary text-sm">Loading reviews...</p>
        ) : (reviews as ReviewData[]).length === 0 ? (
          <p className="text-text-secondary text-sm">No reviews found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {(reviews as ReviewData[]).map((review, idx) => {
              const scoredCriteria = review.criteria.filter((c) => c.grade !== null);
              const total = scoredCriteria.reduce((sum, c) => sum + (c.grade ?? 0), 0);
              const totalMax = scoredCriteria
                .filter((c) => c.score_max !== null)
                .reduce((sum, c) => sum + (c.score_max ?? 0), 0);

              return (
                <div key={review.id} className="border border-border rounded-xl p-3 sm:p-4 bg-bg-secondary">
                  {/* Review header */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-text-primary">Review {idx + 1}</span>
                    <span className="text-xs text-text-secondary">by {review.reviewer.name}</span>
                  </div>

                  {review.criteria.length === 0 ? (
                    <p className="text-text-secondary text-xs m-0">No criteria scores recorded.</p>
                  ) : (
                    <>
                      {/* Criteria table */}
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-1.5 px-2 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border">
                              Criteria
                            </th>
                            <th className="text-left py-1.5 px-2 text-xs font-semibold text-text-secondary uppercase tracking-wide border-b border-border w-16">
                              Score
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {review.criteria.map((crit) => (
                            <tr key={crit.id}>
                              <td className="py-1.5 px-2 text-text-primary border-b border-border/50">
                                {crit.criterion_name || `Criterion ${crit.criterionRowID}`}
                              </td>
                              <td className="py-1.5 px-2 font-semibold border-b border-border/50 w-16">
                                {crit.grade !== null
                                  ? `${crit.grade}${crit.score_max !== null ? ` / ${crit.score_max}` : ""}`
                                  : "\u2014"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Review-level comments */}
                      {review.comments && review.comments.trim() !== "" && (
                        <div className="mt-2.5 pt-2 border-t border-border">
                          <span className="font-semibold text-xs text-text-secondary">Comments:</span>
                          <p className="mt-1 text-sm text-text-primary leading-relaxed m-0">
                            {review.comments}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {scoredCriteria.length > 0 && (
                    <div className="text-right mt-2 text-sm text-text-primary">
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
