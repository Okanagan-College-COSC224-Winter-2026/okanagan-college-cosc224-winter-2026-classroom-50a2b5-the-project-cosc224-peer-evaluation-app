import { useState } from "react";
import RubricCreator from "../reviews/RubricCreator";
import RubricDisplay from "../reviews/RubricDisplay";
import Modal from "../../ui/Modal";
import { useDeleteRubric } from "../reviews/useRubric";
import { cardClass, btnDanger } from "./assignmentStyles";

interface Props {
  assignmentId: number;
  rubricId: number | null;
  review: number[];
  onCriterionSelect: (row: number, column: number) => void;
  onCommentChange: (comment: string) => void;
  onStatus: (type: "error" | "success", message: string) => void;
}

export default function ManageRubricSection({ assignmentId, rubricId, review, onCriterionSelect, onCommentChange, onStatus }: Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { mutate: deleteRubric, isPending: isDeleting } = useDeleteRubric(assignmentId);

  if (rubricId) {
    return (
      <>
        <div className={cardClass}>
          <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Rubric Preview</h3>
          <RubricDisplay rubricId={rubricId} onCriterionSelect={onCriterionSelect} onCommentChange={onCommentChange} grades={review} />
          <div className="mt-4 pt-3 border-t border-border">
            <button className={btnDanger} onClick={() => setIsDeleteModalOpen(true)}>
              Delete Rubric
            </button>
          </div>
        </div>

        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Rubric">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-text-secondary m-0">
              Are you sure you want to delete this rubric? All criteria will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end pt-2 border-t border-border">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-secondary transition-colors cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                disabled={isDeleting}
                onClick={() => {
                  deleteRubric(rubricId, {
                    onSuccess: () => {
                      setIsDeleteModalOpen(false);
                      onStatus("success", "Rubric deleted successfully.");
                    },
                    onError: (error) => {
                      setIsDeleteModalOpen(false);
                      onStatus("error", error instanceof Error ? error.message : "Failed to delete rubric.");
                    },
                  });
                }}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold border-none cursor-pointer transition-all duration-150 hover:bg-red-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <div className={cardClass}>
      <RubricCreator
        id={assignmentId}
        onRubricCreated={() => onStatus("success", "Rubric created successfully.")}
      />
    </div>
  );
}
