import { useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Modal from "../../ui/Modal";
import { isTeacher, isAdmin } from "../../util/login";
import { useCourseGradeSummary, useReviewsForAssignment, useFlagReview, useFlaggedReviewsForCourse, useDismissFlag } from "./useReviews";

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
  const courseId = Number(id);
  const teacherOrAdmin = isTeacher() || isAdmin();

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [flagModalReviewId, setFlagModalReviewId] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [showFlagged, setShowFlagged] = useState(false);

  const { data: summaryData, isLoading: loading } = useCourseGradeSummary(courseId);
  const { data: reviews = [], isLoading: modalLoading } = useReviewsForAssignment(selectedAssignmentId);
  const { mutate: flagReviewMut, isPending: flagging } = useFlagReview();
  const { data: flaggedReviews = [], isLoading: flaggedLoading } = useFlaggedReviewsForCourse(teacherOrAdmin ? courseId : 0);
  const { mutate: dismissFlagMut } = useDismissFlag();

  function handleFlagSubmit() {
    if (!flagModalReviewId || !flagReason.trim()) return;
    flagReviewMut(
      { reviewID: flagModalReviewId, reason: flagReason.trim() },
      {
        onSuccess: () => {
          toast.success("Review flagged for moderation.");
          setFlagModalReviewId(null);
          setFlagReason("");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to flag review.");
        },
      }
    );
  }

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

  function handleDismissFlag(flagId: number) {
    dismissFlagMut(flagId, {
      onSuccess: () => toast.success("Flag dismissed."),
      onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to dismiss flag."),
    });
  }

  return (
    <>
      <div className="p-4 md:p-8 w-full max-w-260 mx-auto flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-text-primary m-0">Evaluations</h2>
          {teacherOrAdmin && (
            <button
              onClick={() => setShowFlagged(!showFlagged)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                showFlagged
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-transparent text-text-secondary border-border hover:bg-bg-secondary"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
              Flagged Reviews{flaggedReviews.length > 0 ? ` (${flaggedReviews.length})` : ""}
            </button>
          )}
        </div>

        {/* Flagged reviews section (teacher/admin only) */}
        {teacherOrAdmin && showFlagged && (
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-4 border-b border-red-200 bg-red-50/50">
              <h3 className="text-base font-semibold text-red-700 m-0">Flagged Reviews</h3>
            </div>
            {flaggedLoading ? (
              <div className="px-5 py-6">
                <p className="text-text-secondary text-sm m-0">Loading...</p>
              </div>
            ) : (flaggedReviews as any[]).length === 0 ? (
              <div className="px-5 py-6">
                <p className="text-text-secondary text-sm m-0">No flagged reviews.</p>
              </div>
            ) : (
              <div className="divide-y divide-red-100">
                {(flaggedReviews as any[]).map((review: any) => (
                  <div key={review.id} className="px-5 md:px-8 py-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-text-primary">
                          <span className="font-medium">{review.reviewer?.name}</span>
                          <span className="text-text-secondary"> reviewed </span>
                          <span className="font-medium">{review.reviewee?.name}</span>
                        </div>
                        {review.comments && (
                          <p className="text-xs text-text-secondary m-0 mt-1 italic">"{review.comments}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                          {review.flag_count} flag{review.flag_count !== 1 ? "s" : ""}
                        </span>
                        <button
                          onClick={() => handleDismissFlag(review.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-text-secondary hover:bg-bg-secondary border border-border transition-colors cursor-pointer bg-transparent"
                          title="Dismiss flag"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-text-secondary text-sm">Loading evaluations...</p>
        ) : summaries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-8 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
                </svg>
              </div>
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

      {/* Flag confirmation modal */}
      <Modal
        isOpen={flagModalReviewId !== null}
        onClose={() => { setFlagModalReviewId(null); setFlagReason(""); }}
        title="Flag Review"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary m-0">
            Please explain why you are reporting this review. Your report will be reviewed by the course instructor.
          </p>
          <textarea
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Reason for flagging..."
            maxLength={500}
            className="px-3 py-2.5 border border-border rounded-lg bg-bg-secondary text-text-primary text-sm min-h-[80px] resize-y focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors w-full"
          />
          <div className="flex gap-3 justify-end pt-2 border-t border-border">
            <button
              onClick={() => { setFlagModalReviewId(null); setFlagReason(""); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
            >
              Cancel
            </button>
            <button
              onClick={handleFlagSubmit}
              disabled={flagging || !flagReason.trim()}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {flagging ? "Submitting..." : "Submit Flag"}
            </button>
          </div>
        </div>
      </Modal>

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

                    {/* Flag button */}
                    <div className="mt-3 pt-3 border-t border-border flex justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setFlagModalReviewId(review.id); }}
                        className="px-2.5 py-1 rounded-md text-xs font-medium text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer bg-transparent flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                        </svg>
                        Report
                      </button>
                    </div>
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
