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
  review_type?: string;
  reviewer: { id: number | null; name: string; email: string | null };
  reviewee: { id: number | null; name: string; email: string | null; type?: string };
  criteria: ReviewCriterion[];
}

interface AssignmentSummary {
  id: number;
  name: string;
  individualReviewCount: number;
  individualAverage: number | null;
  individualMax: number | null;
  groupReviewCount: number;
  groupAverage: number | null;
  groupMax: number | null;
}

function ReviewCard({ review, idx }: { review: ReviewData; idx: number }) {
  const scoredCriteria = review.criteria.filter((c) => c.grade !== null);
  const total = scoredCriteria.reduce((sum, c) => sum + (c.grade ?? 0), 0);
  const totalMax = scoredCriteria
    .filter((c) => c.score_max !== null)
    .reduce((sum, c) => sum + (c.score_max ?? 0), 0);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
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
}

function AssignmentList({
  title,
  summaries,
  reviewCountKey,
  averageKey,
  maxKey,
  onOpen,
  totalPct,
}: {
  title: string;
  summaries: AssignmentSummary[];
  reviewCountKey: "individualReviewCount" | "groupReviewCount";
  averageKey: "individualAverage" | "groupAverage";
  maxKey: "individualMax" | "groupMax";
  onOpen: (summary: AssignmentSummary) => void;
  totalPct: number | null;
}) {
  const totalLabel = title.replace("Reviews", "Total");

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 md:px-8 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-text-primary m-0">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {summaries.map((s) => {
          const count = s[reviewCountKey];
          const avg = s[averageKey];
          const max = s[maxKey];

          return (
            <div
              key={s.id}
              className={`px-5 md:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 transition-colors ${
                count > 0 ? "cursor-pointer hover:bg-bg-secondary" : ""
              }`}
              onClick={() => count > 0 && onOpen(s)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${count > 0 ? "bg-btn-primary" : "bg-gray-300"}`} />
                <span className="font-medium text-text-primary text-sm">{s.name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm pl-5 sm:pl-0">
                {count === 0 ? (
                  <span className="text-text-secondary text-xs">No reviews yet</span>
                ) : (
                  <>
                    <span className="text-text-secondary text-xs">
                      {count} review{count !== 1 ? "s" : ""}
                    </span>
                    {avg !== null && max !== null && max > 0 && (
                      <span className="font-semibold text-btn-primary bg-btn-primary/10 px-2.5 py-0.5 rounded-full text-xs">
                        {((avg / max) * 100).toFixed(0)}%
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {totalPct !== null && (
        <div className="px-5 md:px-8 py-4 bg-bg-secondary border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary">{totalLabel}</span>
          <span className="font-bold text-btn-primary text-sm">
            {totalPct.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

export default function ClassEvaluations() {
  const { id } = useParams();

  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentSummary | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number>(0);
  const [modalReviewType, setModalReviewType] = useState<"individual" | "group">("individual");

  const { data: summaryData, isLoading: loading } = useCourseGradeSummary(Number(id));
  const { data: reviews = [], isLoading: modalLoading } = useReviewsForAssignment(
    selectedAssignmentId,
    selectedAssignmentId ? modalReviewType : undefined
  );

  const summaries: AssignmentSummary[] = summaryData?.assignments ?? [];

  // Equal-weight course total: average of per-assignment percentages
  const coursePct = (() => {
    const pcts = summaries
      .map((a) => {
        let earned = 0, max = 0;
        if (a.individualAverage != null && a.individualMax) { earned += a.individualAverage; max += a.individualMax; }
        if (a.groupAverage != null && a.groupMax) { earned += a.groupAverage; max += a.groupMax; }
        return max > 0 ? earned / max : null;
      })
      .filter((p): p is number => p !== null);
    return pcts.length > 0 ? pcts.reduce((s, p) => s + p, 0) / pcts.length * 100 : null;
  })();
  // Equal-weight per-type totals
  const individualPct = (() => {
    const pcts = summaries
      .filter((a) => a.individualAverage != null && a.individualMax && a.individualMax > 0)
      .map((a) => a.individualAverage! / a.individualMax!);
    return pcts.length > 0 ? pcts.reduce((s, p) => s + p, 0) / pcts.length * 100 : null;
  })();
  const groupPct = (() => {
    const pcts = summaries
      .filter((a) => a.groupAverage != null && a.groupMax && a.groupMax > 0)
      .map((a) => a.groupAverage! / a.groupMax!);
    return pcts.length > 0 ? pcts.reduce((s, p) => s + p, 0) / pcts.length * 100 : null;
  })();

  const openAssignment = (summary: AssignmentSummary, reviewType: "individual" | "group") => {
    setSelectedAssignment(summary);
    setSelectedAssignmentId(summary.id);
    setModalReviewType(reviewType);
  };

  const closeModal = () => {
    setSelectedAssignment(null);
    setSelectedAssignmentId(0);
  };

  return (
    <>
      <div className="p-4 md:p-8 w-full max-w-260 mx-auto flex flex-col gap-6">
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
            {/* Individual reviews per assignment */}
            <AssignmentList
              title="Individual Reviews"
              summaries={summaries}
              reviewCountKey="individualReviewCount"
              averageKey="individualAverage"
              maxKey="individualMax"
              onOpen={(s) => openAssignment(s, "individual")}
              totalPct={individualPct}
            />

            {/* Group reviews per assignment */}
            {summaries.some((s) => s.groupReviewCount > 0) && (
              <AssignmentList
                title="Group Reviews"
                summaries={summaries}
                reviewCountKey="groupReviewCount"
                averageKey="groupAverage"
                maxKey="groupMax"
                onOpen={(s) => openAssignment(s, "group")}
                totalPct={groupPct}
              />
            )}

            {/* Course total card */}
            {coursePct !== null && (
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-5 md:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide m-0 mb-1">Course Total</p>
                    <p className="text-xl font-bold text-btn-primary m-0">
                      {coursePct.toFixed(0)}%
                    </p>
                  </div>
                  <div className="w-full sm:w-48">
                    <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-btn-primary rounded-full transition-all"
                        style={{ width: `${Math.min(coursePct, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Review detail modal */}
      <Modal
        isOpen={selectedAssignment !== null}
        onClose={closeModal}
        title={`${modalReviewType === "group" ? "Group" : "Individual"} Reviews: ${selectedAssignment?.name || ""}`}
      >
        {modalLoading ? (
          <p className="text-text-secondary text-sm">Loading reviews...</p>
        ) : (reviews as ReviewData[]).length === 0 ? (
          <p className="text-text-secondary text-sm">No reviews found.</p>
        ) : (() => {
          const typedReviews = reviews as ReviewData[];
          const allTotal = typedReviews.reduce((sum, r) => {
            return sum + r.criteria.filter((c) => c.grade !== null).reduce((s, c) => s + (c.grade ?? 0), 0);
          }, 0);
          const allMax = typedReviews.reduce((sum, r) => {
            return sum + r.criteria.filter((c) => c.grade !== null && c.score_max !== null).reduce((s, c) => s + (c.score_max ?? 0), 0);
          }, 0);
          return (
            <div className="flex flex-col gap-4">
              {typedReviews.map((review, idx) => (
                <ReviewCard key={review.id} review={review} idx={idx} />
              ))}
              {allMax > 0 && (
                <div className="rounded-xl border border-border bg-bg-secondary px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-semibold text-text-primary">Overall</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-secondary">
                      {allTotal} / {allMax}
                    </span>
                    <span className="font-bold text-btn-primary text-sm">
                      {((allTotal / allMax) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
