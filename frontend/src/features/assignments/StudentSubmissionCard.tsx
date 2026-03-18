import { useState } from "react";
import { useUploadSubmission, useDeleteSubmission } from "../reviews/useSubmission";
import { cardClass, btnSecondary, btnOutline, fileInputClass } from "./assignmentStyles";
import type { AssignmentResourceItem } from "./useAssignmentDetail";

interface Props {
  assignmentId: number;
  resources: AssignmentResourceItem[];
  mySubmission: { download_url: string; filename: string } | null;
  onStatus: (type: "error" | "success", message: string) => void;
  onClearStatus: () => void;
}

export default function StudentSubmissionCard({ assignmentId, resources, mySubmission, onStatus, onClearStatus }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { mutate: uploadSubmission, isPending: isUploading } = useUploadSubmission(assignmentId);
  const { mutate: deleteSubmission } = useDeleteSubmission(assignmentId);

  return (
    <div className={cardClass}>
      <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents</h3>
      {resources.length === 0 ? (
        <p className="text-text-secondary text-sm m-0 mb-4">No supporting documents available.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-2 mb-4">
          {resources.map((resource) => (
            <li key={resource.id} className="py-1.5 border-b border-border last:border-0">
              <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                {resource.original_name}
              </a>
            </li>
          ))}
        </ul>
      )}

      <h3 className="text-base font-semibold text-text-primary mb-3 mt-4">My Attachment</h3>
      {mySubmission ? (
        <div className="flex items-center gap-3 mb-3">
          <a href={mySubmission.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
            {mySubmission.filename}
          </a>
          <button
            className={btnOutline}
            onClick={() => {
              onClearStatus();
              deleteSubmission(undefined, {
                onSuccess: () => {
                  setSelectedFile(null);
                  onStatus("success", "Attachment removed successfully.");
                },
                onError: (error) => onStatus("error", error instanceof Error ? error.message : "Failed to remove attachment."),
              });
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <p className="text-text-secondary text-sm m-0 mb-3">No attachment uploaded yet.</p>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
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
              onStatus("error", "Please choose a file first.");
              return;
            }
            onClearStatus();
            uploadSubmission(selectedFile, {
              onSuccess: () => {
                setSelectedFile(null);
                onStatus("success", mySubmission ? "Attachment updated successfully." : "Attachment uploaded successfully.");
              },
              onError: (error) => onStatus("error", error instanceof Error ? error.message : "Failed to upload attachment."),
            });
          }}
        >
          {isUploading ? "Uploading..." : mySubmission ? "Replace Attachment" : "Upload Attachment"}
        </button>
      </div>
    </div>
  );
}
