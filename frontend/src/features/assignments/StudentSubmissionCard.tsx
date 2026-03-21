import { useState } from "react";
import toast from "react-hot-toast";
import { useUploadSubmission, useDeleteSubmission } from "../reviews/useSubmission";
import { cardClass, btnSecondary, btnOutline, fileInputClass } from "./assignmentStyles";
import type { AssignmentResourceItem } from "./useAssignmentDetail";

interface Props {
  assignmentId: number;
  resources: AssignmentResourceItem[];
  mySubmission: { download_url: string; filename: string } | null;
}

export default function StudentSubmissionCard({ assignmentId, resources, mySubmission }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate: uploadSubmission, isPending: isUploading } = useUploadSubmission(assignmentId);
  const { mutate: deleteSubmission } = useDeleteSubmission(assignmentId);

  return (
    <div className={cardClass}>
      <div className="px-5 md:px-8 py-4 border-b border-border">
        <h3 className="text-base font-semibold text-text-primary m-0">Supporting Documents</h3>
      </div>

      <div className="px-5 md:px-8 py-5 flex flex-col gap-5">
        {resources.length === 0 ? (
          <p className="text-text-secondary text-sm m-0">No supporting documents available.</p>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col">
            {resources.map((resource) => (
              <li key={resource.id} className="py-2.5 border-b border-border last:border-0">
                <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                  {resource.original_name}
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-text-primary m-0 mb-3">My Attachment</h4>
          {mySubmission ? (
            <div className="flex items-center gap-3 mb-3">
              <a href={mySubmission.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                {mySubmission.filename}
              </a>
              <button
                className={btnOutline}
                onClick={() => {
                  deleteSubmission(undefined, {
                    onSuccess: () => {
                      setSelectedFile(null);
                      toast.success("Attachment removed.");
                    },
                    onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to remove attachment."),
                  });
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm m-0 mb-3">No attachment uploaded yet.</p>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3">
            <input
              type="file"
              className={fileInputClass}
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <button
              className={btnSecondary}
              disabled={isUploading}
              onClick={() => {
                if (!selectedFile) {
                  toast.error("Please choose a file first.");
                  return;
                }
                uploadSubmission(selectedFile, {
                  onSuccess: () => {
                    setSelectedFile(null);
                    toast.success(mySubmission ? "Attachment updated." : "Attachment uploaded.");
                  },
                  onError: (error) => toast.error(error instanceof Error ? error.message : "Failed to upload attachment."),
                });
              }}
            >
              {isUploading ? "Uploading..." : mySubmission ? "Replace Attachment" : "Upload Attachment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
