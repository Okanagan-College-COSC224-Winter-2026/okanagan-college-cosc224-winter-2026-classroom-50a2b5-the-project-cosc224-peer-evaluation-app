import AssignmentCard from "../components/AssignmentCard";
import Button from "../components/Button";
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

function getStatusClasses(status: string): string {
  const base = "text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap"
  const s = status.replace(/\s+/g, "")
  if (s === "Upcoming") return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`
  if (s === "Overdue") return `${base} bg-red-50 text-red-700 border border-red-200`
  return `${base} bg-slate-100 text-text-secondary border border-border`
}

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
      <div className="flex flex-row justify-between items-center px-4 py-3 border-b border-border">
        <h2 className="text-xl font-semibold text-text-primary">{className}</h2>
        <div>
          {isTeacher() ? (
            <Button onClick={() => importCSV(id as string)}>
              Add Students via CSV
            </Button>
          ) : null}
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home", path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
          { label: "Groups", path: `/classes/${id}/groups` },
        ]}
      />

      <StatusMessage message={statusMessage} type={statusType} />

      <div className="p-4 md:p-6 w-full">
        <div className="flex flex-col items-stretch w-full gap-5 max-w-3xl">
          <div className="flex justify-between items-center gap-4">
            <h3 className="m-0 text-text-primary text-base font-semibold">Assignments</h3>
            {isTeacher() && (
              <Button onClick={() => setIsModalOpen(true)}>
                + New Assignment
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
            {assignments.length === 0 ? (
              <p className="m-0 text-text-secondary text-sm p-4">No assignments yet</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col divide-y divide-border">
                {assignments.map((assignment) => {
                  const status = getAssignmentStatus(assignment.due_date);
                  return (
                    <li key={assignment.id} className="p-3 bg-white hover:bg-bg-secondary transition-colors">
                      <div className="flex justify-between items-center gap-3">
                        <AssignmentCard id={assignment.id} className="flex-1 p-0">
                          {assignment.name}
                        </AssignmentCard>
                        <span className={getStatusClasses(status)}>
                          {status}
                        </span>
                      </div>
                      <div className="text-text-secondary text-xs mt-1 ml-11">
                        Due: {formatDueDate(assignment.due_date)}
                      </div>
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
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-text-primary text-sm font-medium">Assignment Name</span>
              <Textbox
                placeholder="Enter assignment name..."
                onInput={setNewAssignmentName}
                value={newAssignmentName}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-text-primary text-sm font-medium">Description</span>
              <textarea
                className="px-3 py-2 border border-border rounded-lg bg-bg-secondary text-text-primary font-[inherit] text-sm min-h-[110px] resize-y focus:outline-none focus:ring-2 focus:ring-btn-primary focus:border-btn-primary transition-colors"
                placeholder="Enter assignment description..."
                onChange={(e) => setNewAssignmentDescription(e.target.value)}
                value={newAssignmentDescription}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-text-primary text-sm font-medium">Start Date</span>
              <Textbox
                type="datetime-local"
                onInput={setNewAssignmentStartDate}
                value={newAssignmentStartDate}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-text-primary text-sm font-medium">Due Date</span>
              <Textbox
                type="datetime-local"
                onInput={setNewAssignmentDueDate}
                value={newAssignmentDueDate}
              />
            </label>

            <label className="flex flex-row items-center gap-2">
              <input
                type="checkbox"
                className="w-auto p-0 m-0"
                checked={newAssignmentAnonymous}
                onChange={(e) => setNewAssignmentAnonymous(e.target.checked)}
              />
              <span>Anonymous submissions/reviews</span>
            </label>

            <div className="flex gap-3 mt-2 justify-end">
              <Button onClick={() => setIsModalOpen(false)} type="secondary">
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
