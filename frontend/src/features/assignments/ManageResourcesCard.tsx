import { useState } from "react";
import { useUploadAssignmentResource, useDeleteAssignmentResource } from "./useAssignments";
import { cardClass, btnSecondary, btnOutline, fileInputClass } from "./assignmentStyles";
import type { AssignmentResourceItem } from "./useAssignmentDetail";

interface Props {
  assignmentId: number;
  resources: AssignmentResourceItem[];
  onStatus: (type: "error" | "success", message: string) => void;
  onClearStatus: () => void;
}

export default function ManageResourcesCard({ assignmentId, resources, onStatus, onClearStatus }: Props) {
  const [resourceUpload, setResourceUpload] = useState<File | null>(null);

  const { mutate: uploadResource, isPending: isUploading } = useUploadAssignmentResource(assignmentId);
  const { mutate: deleteResource } = useDeleteAssignmentResource(assignmentId);

  return (
    <div className={cardClass}>
      <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents</h3>

      {resources.length === 0 ? (
        <p className="text-text-secondary text-sm m-0 mb-3">No supporting documents uploaded yet.</p>
      ) : (
        <ul className="m-0 p-0 list-none flex flex-col gap-2 mb-3">
          {resources.map((resource) => (
            <li key={resource.id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
              <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline truncate">
                {resource.original_name}
              </a>
              <button
                className={btnOutline}
                onClick={() => {
                  onClearStatus();
                  deleteResource(resource.id, {
                    onSuccess: () => onStatus("success", "Supporting document deleted successfully."),
                    onError: (error) => onStatus("error", error instanceof Error ? error.message : "Failed to delete supporting document."),
                  });
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 border-t border-border">
        <input
          type="file"
          className={fileInputClass}
          onChange={(e) => setResourceUpload(e.target.files?.[0] || null)}
        />
        <button
          className={btnSecondary}
          disabled={isUploading}
          onClick={() => {
            if (!resourceUpload) {
              onStatus("error", "Please choose a supporting document first.");
              return;
            }
            onClearStatus();
            uploadResource(resourceUpload, {
              onSuccess: () => {
                setResourceUpload(null);
                onStatus("success", "Supporting document uploaded successfully.");
              },
              onError: (error) => onStatus("error", error instanceof Error ? error.message : "Failed to upload supporting document."),
            });
          }}
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>
    </div>
  );
}
