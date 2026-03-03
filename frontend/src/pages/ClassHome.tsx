import AssignmentCard from "../components/AssignmentCard";
import Button from "../components/Button";
import "./ClassHome.css";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { listAssignments, listClasses, createAssignment } from "../util/api";
import TabNavigation from "../components/TabNavigation";
import { importCSV } from "../util/csv";
import Textbox from "../components/Textbox";
import StatusMessage from "../components/StatusMessage";
import { isTeacher } from "../util/login";
import { formatDueDate, getAssignmentStatus } from "../util/assignmentDates";
import Modal from "../components/Modal";

export default function ClassHome() {
  const { id } = useParams();
  const courseId = Number(id);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentDescription, setNewAssignmentDescription] = useState("");
  const [newAssignmentStartDate, setNewAssignmentStartDate] = useState("");
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState("");
  const [newAssignmentAnonymous, setNewAssignmentAnonymous] = useState(true);
  const [className, setClassName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const resp = await listAssignments(String(id));
      const classes = await listClasses();
      const currentClass = classes.find((c: { id: number }) => c.id === Number(id));
      setAssignments(resp);
      setClassName(currentClass?.name || null);
    })();
  }, [id]);
    
    const tryCreateAssignment = async () => {
      try {
        setStatusMessage('');
        const response = await createAssignment(
          courseId,
          newAssignmentName,
          newAssignmentDescription || undefined,
          newAssignmentStartDate || undefined,
          newAssignmentDueDate || undefined,
          newAssignmentAnonymous,
        );
        const createdAssignment = response?.assignment;

        if (!createdAssignment?.id) {
          throw new Error('Failed to create assignment');
        }

        setAssignments((prev) => [...prev, createdAssignment]);
        setNewAssignmentName("");
        setNewAssignmentDescription("");
        setNewAssignmentStartDate("");
        setNewAssignmentDueDate("");
        setNewAssignmentAnonymous(true);
        setStatusType('success');
        setStatusMessage('Assignment created successfully!');
        setIsModalOpen(false);
      } catch (error) {
        console.error('Error creating assignment:', error);
        setStatusType('error');
        setStatusMessage(error instanceof Error ? error.message : 'Error creating assignment.');
      }
    };
    
    return (
      <>
        <div className="ClassHeader">
          <div className="ClassHeaderLeft">
            <h2>{className}</h2>
          </div>

        <div className="ClassHeaderRight">
          {isTeacher() ? (
            <Button onClick={() => importCSV(id as string)}>
              Add Students via CSV
            </Button>
          ) : null}
        </div>
      </div>

      <TabNavigation
        tabs={[
          {
            label: "Home",
            path: `/classes/${id}/home`,
          },
          {
            label: "Members",
            path: `/classes/${id}/members`,
          },
          {
            label: "Groups",
            path: `/classes/${id}/groups`,
          },
        ]}
      />

      <StatusMessage message={statusMessage} type={statusType} />

      <div className="Class">
        <div className="Assignments">
          <div className="AssignmentsHeader">
            <h3>Assignments</h3>
            {isTeacher() && (
              <Button onClick={() => setIsModalOpen(true)}>
                + New Assignment
              </Button>
            )}
          </div>

          <div className="CourseAssignmentList">
            {assignments.length === 0 ? (
              <p className="NoAssignments">No assignments yet</p>
            ) : (
              <ul>
                {assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment.due_date);
                  return (
                    <li
                      key={assignment.id}
                      className="CourseAssignmentItem"
                    >
                      <div className="AssignmentMainRow">
                        <AssignmentCard id={assignment.id}>
                          {assignment.name}
                        </AssignmentCard>
                        <span className={`AssignmentStatus AssignmentStatus--${status.replace(/\s+/g, "")}`}>
                          {status}
                        </span>
                      </div>
                      <div className="AssignmentMeta">Due: {formatDueDate(assignment.due_date)}</div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Assignment"
        >
          <div className="NewAssignmentForm">
            <label>
              <span>Assignment Name</span>
              <Textbox
                placeholder="Enter assignment name..."
                onInput={setNewAssignmentName}
                value={newAssignmentName}
              />
            </label>

            <label>
              <span>Description</span>
              <textarea
                className="DescriptionTextarea"
                placeholder="Enter assignment description..."
                onChange={(e) => setNewAssignmentDescription(e.target.value)}
                value={newAssignmentDescription}
              />
            </label>

            <label>
              <span>Start Date</span>
              <Textbox
                type="datetime-local"
                onInput={setNewAssignmentStartDate}
                value={newAssignmentStartDate}
              />
            </label>

            <label>
              <span>Due Date</span>
              <Textbox
                type="datetime-local"
                onInput={setNewAssignmentDueDate}
                value={newAssignmentDueDate}
              />
            </label>

            <label className="CheckboxLabel">
              <input
                type="checkbox"
                checked={newAssignmentAnonymous}
                onChange={(e) => setNewAssignmentAnonymous(e.target.checked)}
              />
              <span>Anonymous submissions/reviews</span>
            </label>

            <div className="ModalActions">
              <Button
                onClick={() => setIsModalOpen(false)}
                type="secondary"
              >
                Cancel
              </Button>
              <Button onClick={tryCreateAssignment}>
                Create Assignment
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
}
