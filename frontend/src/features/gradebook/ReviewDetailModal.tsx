import Modal from "../../ui/Modal";
import { useStudentReviews } from "./useGradebook";

interface ReviewCriterion {
  id: number;
  criterion_name: string | null;
  score_max: number | null;
  grade: number | null;
  comments: string;
}

interface ReviewData {
  id: number;
  comments: string | null;
  reviewer: { name: string };
  criteria: ReviewCriterion[];
}

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: number;
  studentId: number;
  assignmentId: number;
  studentName: string;
  assignmentName: string;
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
                  {crit.criterion_name || "Criterion"}
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

function ReviewSection({ title, reviews }: { title: string; reviews: ReviewData[] }) {
  if (reviews.length === 0) return null;

  return (
    <div>
      <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide m-0 mb-3">
        {title}
      </h4>
      <div className="flex flex-col gap-3">
        {reviews.map((review, idx) => (
          <ReviewCard key={review.id} review={review} idx={idx} />
        ))}
      </div>
    </div>
  );
}

export default function ReviewDetailModal({
  isOpen,
  onClose,
  courseId,
  studentId,
  assignmentId,
  studentName,
  assignmentName,
}: ReviewDetailModalProps) {
  const { data, isLoading } = useStudentReviews(
    courseId,
    isOpen ? studentId : 0,
    isOpen ? assignmentId : 0
  );

  const individualReviews: ReviewData[] = data?.individualReviews ?? [];
  const groupReviews: ReviewData[] = data?.groupReviews ?? [];
  const hasNoReviews = individualReviews.length === 0 && groupReviews.length === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reviews: ${studentName} - ${assignmentName}`}
    >
      {isLoading ? (
        <p className="text-text-secondary text-sm">Loading reviews...</p>
      ) : hasNoReviews ? (
        <p className="text-text-secondary text-sm">No reviews found for this student.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <ReviewSection title="Individual Reviews" reviews={individualReviews} />
          <ReviewSection title="Group Reviews" reviews={groupReviews} />
        </div>
      )}
    </Modal>
  );
}
