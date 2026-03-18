import TabNavigation from "../../ui/TabNavigation";
import { useAssignmentDetail } from "./useAssignmentDetail";
import ManageAssignmentCard from "./ManageAssignmentCard";
import ManageResourcesCard from "./ManageResourcesCard";
import ManageRubricSection from "./ManageRubricSection";
import StudentSubmissionCard from "./StudentSubmissionCard";
import PeerReviewSection from "./PeerReviewSection";
import RubricDisplay from "../reviews/RubricDisplay";

export default function AssignmentDetail() {
  const {
    id,
    assignmentId,
    assignment,
    teacherMode,
    isManageTab,
    rubricId,
    review,
    resourceList,
    groupMembers,
    mySubmission,
    revieweeID,
    setRevieweeID,
  } = useAssignmentDetail();

  return (
    <>
      <TabNavigation
        tabs={[
          { label: teacherMode ? "Review" : "Home", path: `/assignments/${id}` },
          ...(teacherMode ? [{ label: "Management", path: `/assignments/${id}/manage` }] : []),
        ]}
      />

      <div className="p-4 md:p-8 w-full max-w-260 mx-auto flex flex-col gap-6">
        {/* Header row — Wild Oasis style: title + tag side by side */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-text-primary m-0">
            {assignment?.name ? assignment.name : `Assignment ${id}`}
          </h2>
          {assignment && (
            <span className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-btn-primary/10 text-btn-primary">
              {isManageTab ? "Managing" : teacherMode ? "Reviewing" : "Active"}
            </span>
          )}
        </div>

        {/* Detail card — colored header strip + data rows */}
        {!isManageTab && assignment && (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-btn-primary px-5 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="text-white font-medium text-sm">
                {assignment.name}
              </span>
              {(assignment.start_date || assignment.due_date) && (
                <span className="text-white/80 text-xs">
                  {assignment.start_date && new Date(assignment.start_date).toLocaleDateString()}
                  {assignment.start_date && assignment.due_date && " — "}
                  {assignment.due_date && new Date(assignment.due_date).toLocaleDateString()}
                </span>
              )}
            </div>

            <div className="px-5 md:px-8 py-5 flex flex-col gap-4">
              {assignment.description && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Description</span>
                  <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap m-0">
                    {assignment.description}
                  </p>
                </div>
              )}

              {resourceList.length > 0 && (
                <div className="flex flex-col gap-2 pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    {teacherMode ? "Documents (Student Preview)" : "Supporting Documents"}
                  </span>
                  <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                    {resourceList.map((resource) => (
                      <li key={resource.id}>
                        <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                          {resource.original_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {resourceList.length === 0 && teacherMode && (
                <div className="flex flex-col gap-1 pt-3 border-t border-border">
                  <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Documents</span>
                  <p className="text-text-secondary text-sm m-0">No supporting documents available.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rubric preview on review tab */}
        {teacherMode && !isManageTab && rubricId && (
          <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 md:px-8 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-text-primary m-0">Rubric Preview</h3>
            </div>
            <div className="px-5 md:px-8 py-5">
              <RubricDisplay rubricId={rubricId} onCriterionSelect={() => {}} grades={review} />
            </div>
          </div>
        )}

        {/* Management tab — cards */}
        {teacherMode && assignment && isManageTab && (
          <>
            <ManageAssignmentCard
              assignmentId={assignmentId}
              assignment={assignment}
            />
            <ManageResourcesCard
              assignmentId={assignmentId}
              resources={resourceList}
            />
            <ManageRubricSection
              assignmentId={assignmentId}
              rubricId={rubricId}
              review={review}
              onCriterionSelect={() => {}}
              onCommentChange={() => {}}
            />
          </>
        )}

        {/* Student view */}
        {!teacherMode && (
          <>
            <StudentSubmissionCard
              assignmentId={assignmentId}
              resources={resourceList}
              mySubmission={mySubmission}
            />
            <PeerReviewSection
              assignmentId={assignmentId}
              rubricId={rubricId}
              review={review}
              groupMembers={groupMembers}
              revieweeID={revieweeID}
              setRevieweeID={setRevieweeID}
            />
          </>
        )}
      </div>
    </>
  );
}
