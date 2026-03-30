import Modal from "../../ui/Modal";

interface ReviewDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  assignmentName: string;
}

export default function ReviewDetailModal({
  isOpen,
  onClose,
  studentName,
  assignmentName,
}: ReviewDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reviews: ${studentName} - ${assignmentName}`}
    >
      <div className="flex flex-col gap-4">
        {/* Individual Reviews Section */}
        <div>
          <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide m-0 mb-3">
            Individual Reviews
          </h4>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-bg-secondary flex justify-between items-center border-b border-border">
              <span className="font-semibold text-sm text-text-primary">Review 1</span>
              <span className="text-xs text-text-secondary">by Reviewer A</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-text-primary">Code Quality</span>
                <span className="text-sm font-semibold text-text-primary">8 / 10</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-text-primary">Documentation</span>
                <span className="text-sm font-semibold text-text-primary">7 / 10</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                <span className="text-sm font-semibold text-text-primary">Total</span>
                <span className="text-sm font-bold text-btn-primary">15 / 20</span>
              </div>
            </div>
          </div>
        </div>

        {/* Group Reviews Section */}
        <div>
          <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wide m-0 mb-3">
            Group Reviews
          </h4>
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-bg-secondary flex justify-between items-center border-b border-border">
              <span className="font-semibold text-sm text-text-primary">Review 1</span>
              <span className="text-xs text-text-secondary">by Reviewer B</span>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-text-primary">Teamwork</span>
                <span className="text-sm font-semibold text-text-primary">9 / 10</span>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                <span className="text-sm font-semibold text-text-primary">Total</span>
                <span className="text-sm font-bold text-btn-primary">9 / 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
