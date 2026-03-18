import TabNavigation from "../../ui/TabNavigation";
import StatusMessage from "../../ui/StatusMessage";
import { useAssignmentDetail } from "./useAssignmentDetail";
import { cardClass } from "./assignmentStyles";
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
    statusMessage,
    statusType,
    showStatus,
    clearStatus,
  } = useAssignmentDetail();

  return (
    <>
      <TabNavigation
        tabs={[
          { label: teacherMode ? "Review" : "Home", path: `/assignments/${id}` },
          ...(teacherMode ? [{ label: "Management", path: `/assignments/${id}/manage` }] : []),
        ]}
      />

      <div className="flex flex-row justify-between items-center px-4 md:px-6 py-3 border-b border-border bg-white">
        <h2 className="text-xl font-semibold text-text-primary m-0 min-w-0 truncate">
          {assignment?.name ? assignment.name : `Assignment ${id}`}
        </h2>
      </div>

      <div className="p-4 md:p-6 w-full max-w-260 mx-auto flex flex-col gap-4">
        {assignment?.description && (
          <p className="px-4 py-3 bg-bg-secondary rounded-lg text-sm whitespace-pre-wrap border border-border text-text-primary m-0">
            {assignment.description}
          </p>
        )}

        {statusMessage && <StatusMessage message={statusMessage} type={statusType} />}

        {teacherMode && assignment && isManageTab && (
          <>
            <ManageAssignmentCard
              assignmentId={assignmentId}
              assignment={assignment}
              onStatus={showStatus}
              onClearStatus={clearStatus}
            />
            <ManageResourcesCard
              assignmentId={assignmentId}
              resources={resourceList}
              onStatus={showStatus}
              onClearStatus={clearStatus}
            />
            <ManageRubricSection
              assignmentId={assignmentId}
              rubricId={rubricId}
              review={review}
              onCriterionSelect={() => {}}
              onCommentChange={() => {}}
              onStatus={showStatus}
            />
          </>
        )}

        {teacherMode && !isManageTab && (
          <div className={cardClass}>
            <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Supporting Documents (Student Preview)</h3>
            {resourceList.length === 0 ? (
              <p className="text-text-secondary text-sm m-0">No supporting documents available.</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {resourceList.map((resource) => (
                  <li key={resource.id} className="py-1.5 border-b border-border last:border-0">
                    <a href={resource.download_url} target="_blank" rel="noreferrer" className="text-btn-primary text-sm hover:underline">
                      {resource.original_name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {teacherMode && !isManageTab && rubricId && (
          <div className={cardClass}>
            <h3 className="text-base font-semibold text-text-primary mt-0 mb-3">Rubric Preview</h3>
            <RubricDisplay rubricId={rubricId} onCriterionSelect={() => {}} grades={review} />
          </div>
        )}


        {!teacherMode && (
          <>
            <StudentSubmissionCard
              assignmentId={assignmentId}
              resources={resourceList}
              mySubmission={mySubmission}
              onStatus={showStatus}
              onClearStatus={clearStatus}
            />
            <PeerReviewSection
              assignmentId={assignmentId}
              rubricId={rubricId}
              review={review}
              groupMembers={groupMembers}
              revieweeID={revieweeID}
              setRevieweeID={setRevieweeID}
              onStatus={showStatus}
            />
          </>
        )}
      </div>
    </>
  );
}
