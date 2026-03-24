import { useState } from "react";
import toast from "react-hot-toast";
import RubricCreator from "../reviews/RubricCreator";
import RubricDisplay from "../reviews/RubricDisplay";
import Modal from "../../ui/Modal";
import { useDeleteRubric } from "../reviews/useRubric";
import { cardClass, btnDanger } from "./assignmentStyles";

interface Props {
  assignmentId: number;
  rubricId: number | null;
  groupRubricId: number | null;
  review: number[];
  groupReview: number[];
  onCriterionSelect: (row: number, column: number) => void;
  onCommentChange: (comment: string) => void;
}

type RubricTab = "individual" | "group";

function RubricTabContent({
  assignmentId,
  rubricId,
  rubricType,
  review,
  onCriterionSelect,
  onCommentChange,
  onDeleteRequest,
}: {
  assignmentId: number;
  rubricId: number | null;
  rubricType: RubricTab;
  review: number[];
  onCriterionSelect: (row: number, column: number) => void;
  onCommentChange: (comment: string) => void;
  onDeleteRequest: () => void;
}) {
  if (rubricId) {
    return (
      <>
        <RubricDisplay rubricId={rubricId} onCriterionSelect={onCriterionSelect} onCommentChange={onCommentChange} grades={review} />
        <div className="mt-5 pt-4 border-t border-border">
          <button className={btnDanger} onClick={onDeleteRequest}>
            Delete Rubric
          </button>
        </div>
      </>
    );
  }

  return <RubricCreator id={assignmentId} rubricType={rubricType} />;
}

export default function ManageRubricSection({
  assignmentId,
  rubricId,
  groupRubricId,
  review,
  groupReview,
  onCriterionSelect,
  onCommentChange,
}: Props) {
  const [activeTab, setActiveTab] = useState<RubricTab>("individual");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const currentRubricId = activeTab === "individual" ? rubricId : groupRubricId;
  const label = activeTab === "group" ? "Group Rubric" : "Individual Rubric";

  const { mutate: deleteIndividual, isPending: isDeletingIndividual } = useDeleteRubric(assignmentId, "individual");
  const { mutate: deleteGroup, isPending: isDeletingGroup } = useDeleteRubric(assignmentId, "group");

  const deleteRubric = activeTab === "individual" ? deleteIndividual : deleteGroup;
  const isDeleting = isDeletingIndividual || isDeletingGroup;

  const tabs: { key: RubricTab; label: string }[] = [
    { key: "individual", label: "Individual" },
    { key: "group", label: "Group" },
  ];

  return (
    <>
      <div className={cardClass}>
        <div className="px-5 md:px-8 py-4 border-b border-border flex items-center justify-between gap-4">
          <h3 className="text-base font-semibold text-text-primary m-0">Rubrics</h3>
          <div className="flex bg-bg-secondary rounded-lg p-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer border-none ${
                  activeTab === tab.key
                    ? "bg-white text-text-primary shadow-sm"
                    : "bg-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="px-5 md:px-8 py-5">
          <RubricTabContent
            assignmentId={assignmentId}
            rubricId={activeTab === "individual" ? rubricId : groupRubricId}
            rubricType={activeTab}
            review={activeTab === "individual" ? review : groupReview}
            onCriterionSelect={onCriterionSelect}
            onCommentChange={onCommentChange}
            onDeleteRequest={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={`Delete ${label}`}>
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
                if (!currentRubricId) return;
                deleteRubric(currentRubricId, {
                  onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    toast.success("Rubric deleted successfully.");
                  },
                  onError: (error) => {
                    setIsDeleteModalOpen(false);
                    toast.error(error instanceof Error ? error.message : "Failed to delete rubric.");
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
