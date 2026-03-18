import { useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import Modal from "../../ui/Modal";
import RubricDisplay from "../reviews/RubricDisplay";
import { useSubmitReview } from "../reviews/useReviews";
import { cardClass, btnPrimary } from "./assignmentStyles";
import type { GroupMember } from "./useAssignmentDetail";

interface SelectedCriterion {
  row: number;
  column: number;
}

interface Props {
  assignmentId: number;
  rubricId: number | null;
  review: number[];
  groupMembers: GroupMember[];
  revieweeID: number;
  setRevieweeID: (id: number) => void;
}

export default function PeerReviewSection({ assignmentId, rubricId, review, groupMembers, revieweeID, setRevieweeID }: Props) {
  const [selectedCriteria, setSelectedCriteria] = useState<SelectedCriterion[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedMemberName, setSelectedMemberName] = useState("");
  const [reviewedMembers, setReviewedMembers] = useState<Set<number>>(new Set());

  const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview();

  function handleCriterionSelect(row: number, column: number) {
    setSelectedCriteria((prev) => {
      const filtered = prev.filter((c) => c.row !== row);
      return [...filtered, { row, column }];
    });
  }

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedID = Number(event.target.value);
    setRevieweeID(selectedID);
    const member = groupMembers.find((m) => m.id === selectedID);
    setSelectedMemberName(member?.name || "");
    setIsReviewModalOpen(true);
  }

  function handleSubmitReview(closeModal?: boolean) {
    submitReview(
      {
        assignmentID: assignmentId,
        revieweeID,
        criteria: selectedCriteria.map((c) => ({ criterionRowID: c.row, grade: c.column, comments: "" })),
        comments: reviewComment,
      },
      {
        onSuccess: () => {
          if (closeModal) setIsReviewModalOpen(false);
          setReviewedMembers((prev) => new Set(prev).add(revieweeID));
          toast.success("Review submitted successfully.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Failed to submit review.");
        },
      }
    );
  }

  return (
    <>
      <div className={cardClass}>
        <div className="px-5 md:px-8 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-primary m-0">Peer Review</h3>
        </div>

        <div className="px-5 md:px-8 py-5 flex flex-col gap-4">
          <p className="text-sm text-text-secondary m-0">Select a group member to review</p>
          {groupMembers.length === 0 ? (
            <p className="text-text-secondary text-sm m-0">No group members found. You may not be assigned to a group yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {groupMembers.map((member) => (
                <label key={member.id} className="flex items-center gap-2.5 cursor-pointer text-sm text-text-primary py-1">
                  <input
                    type="radio"
                    id={member.id.toString()}
                    value={member.id}
                    name="groupMembers"
                    onChange={handleRadioChange}
                    className="w-4 h-4 accent-btn-primary"
                  />
                  {member.name}
                  {reviewedMembers.has(member.id) && (
                    <span className="text-xs text-emerald-600 font-medium">(reviewed)</span>
                  )}
                </label>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-border">
            <button className={btnPrimary} disabled={isSubmitting} onClick={() => handleSubmitReview()}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title={`Review: ${selectedMemberName}`}>
        <RubricDisplay rubricId={rubricId} onCriterionSelect={handleCriterionSelect} onCommentChange={setReviewComment} grades={review} />
        <div className="flex justify-end pt-4 mt-2 border-t border-border">
          <button className={btnPrimary} disabled={isSubmitting} onClick={() => handleSubmitReview(true)}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </Modal>
    </>
  );
}
