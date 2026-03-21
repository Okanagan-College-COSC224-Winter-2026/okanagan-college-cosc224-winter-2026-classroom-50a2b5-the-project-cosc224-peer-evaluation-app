import { useState } from "react";
import { useParams } from "react-router-dom";
import Modal from "../../ui/Modal";
import { useCourseGradeSummary, useReviewsForAssignment } from "./useReviews";

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

interface AssignmentSummary {
  id: number;
  name: string;
  reviewCount: number;
  averageScore: number | null;
  maxScore: number | null;
}

export default function ClassEvaluations() {
  const { id } = useParams();

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);

  const { data: summaryData, isLoading: loading } = useCourseGradeSummary(Number(id));
  const { data: reviews = [], isLoading: modalLoading } = useReviewsForAssignment(selectedAssignmentId);

  const summaries: AssignmentSummary[] = summaryData?.assignments ?? [];
  const courseAverage: number | null = summaryData?.courseAverage ?? null;
  const courseMax: number | null = summaryData?.courseMax ?? null;

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
      <div className="p-4 md:p-8 w-full max-w-260 mx-auto flex flex-col gap-6">
        {/* Header */}
        <h2 className="text-2xl font-semibold text-text-primary m-0">Evaluations</h2>

        {loading ? (
          <p className="text-text-secondary text-sm">Loading evaluations...</p>
        ) : summaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-8 flex flex-col items-center gap-2">
              <span className="text-3xl">📋</span>
              <p className="text-text-secondary text-sm m-0">No assignments in this course yet.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Course average banner */}
            {courseAverage !== null && (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide m-0 mb-1">Course Average</p>
                    <p className="text-2xl font-bold text-text-primary m-0">
                      {courseAverage.toFixed(1)}
                      {courseMax !== null && (
                        <span className="text-base font-normal text-text-secondary"> / {courseMax.toFixed(1)}</span>
                      )}
                    </p>
                  </div>
                  {courseMax !== null && courseMax > 0 && (
                    <div className="w-full sm:w-48">
                      <div className="h-2.5 bg-bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-btn-primary rounded-full transition-all"
                          style={{ width: `${Math.min((courseAverage / courseMax) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-secondary m-0 mt-1 text-right">
                        {((courseAverage / courseMax) * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment list card */}
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="px-5 md:px-8 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-text-primary m-0">Assignments</h3>
              </div>

              <div className="divide-y divide-border">
                {summaries.map((s) => (
                  <div
                    key={s.id}
                    className={`px-5 md:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 transition-colors ${
                      s.reviewCount > 0 ? "cursor-pointer hover:bg-bg-secondary" : ""
                    }`}
                    onClick={() => s.reviewCount > 0 && openAssignment(s)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.reviewCount > 0 ? "bg-btn-primary" : "bg-gray-300"}`} />
                      <span className="font-medium text-text-primary text-sm">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm pl-5 sm:pl-0">
                      {s.reviewCount === 0 ? (
                        <span className="text-text-secondary text-xs">No reviews yet</span>
                      ) : (
                        <>
                          <span className="text-text-secondary text-xs">
                            {s.reviewCount} review{s.reviewCount !== 1 ? "s" : ""}
                          </span>
                          {s.averageScore !== null && (
                            <span className="font-semibold text-btn-primary bg-btn-primary/10 px-2.5 py-0.5 rounded-full text-xs">
                              {s.averageScore.toFixed(1)}{s.maxScore !== null ? ` / ${s.maxScore}` : ""}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                <div key={review.id} className="rounded-xl border border-border overflow-hidden">
                  {/* Review header */}
                  <div className="px-4 py-3 bg-bg-secondary flex justify-between items-center border-b border-border">
                    <span className="font-semibold text-sm text-text-primary">Review {idx + 1}</span>
                    <span className="text-xs text-text-secondary">by {review.reviewer.name}</span>
                  </div>

                  <div className="p-4">
                    {review.criteria.length === 0 ? (
                      <p className="text-text-secondary text-xs m-0">No criteria scores recorded.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {review.criteria.map((crit) => (
                          <div key={crit.id} className="flex justify-between items-center py-1.5">
                            <span className="text-sm text-text-primary">
                              {crit.criterion_name || `Criterion ${crit.criterionRowID}`}
                            </span>
                            <span className="text-sm font-semibold text-text-primary">
                              {crit.grade !== null
                                ? `${crit.grade}${crit.score_max !== null ? ` / ${crit.score_max}` : ""}`
                                : "\u2014"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {scoredCriteria.length > 0 && (
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                        <span className="text-sm font-semibold text-text-primary">Total</span>
                        <span className="text-sm font-bold text-btn-primary">
                          {total}{totalMax > 0 ? ` / ${totalMax}` : ""}
                        </span>
                      </div>
                    )}

                    {review.comments && review.comments.trim() !== "" && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Comments</span>
                        <p className="mt-1.5 text-sm text-text-primary leading-relaxed m-0">
                          {review.comments}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
