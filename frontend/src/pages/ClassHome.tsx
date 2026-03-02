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

<<<<<<< HEAD
=======
//US9 - import the model for assignment editor
import AssignmentEditor from "../components/AssignmentEditor";
import { editAssignment, deleteAssignment } from "../util/api";

>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
export default function ClassHome() {
  const { id } = useParams();
  const idNew = Number(id)
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [className, setClassName] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'error' | 'success'>('error');

<<<<<<< HEAD
=======
  
  // Define update payload type to avoid `any`
  type AssignmentUpdate = {
    name?: string
    due_date?: string | null
    rubric?: string | null
  }

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null); //edit assignment component state

>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
  useEffect(() => {
    (async () => {
      const resp = await listAssignments(String(id));
      const classes = await listClasses();
      const currentClass = classes.find((c: { id: number }) => c.id === Number(id));
      setAssignments(resp);
      setClassName(currentClass?.name || null);
    })();
<<<<<<< HEAD
  }, []);
=======
  }, [id]);
>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
    
    const tryCreateAssingment = async () => {
      try {
        setStatusMessage('');
        const response = await createAssignment(idNew, newAssignmentName);
        const createdAssignment = response?.assignment;

        if (!createdAssignment?.id) {
          throw new Error('Failed to create assignment');
        }

        setAssignments((prev) => [...prev, createdAssignment]);
        setNewAssignmentName("");
        setStatusType('success');
        setStatusMessage('Assignment created successfully!');
      } catch (error) {
        console.error('Error creating assignment:', error);
        setStatusType('error');
        setStatusMessage('Error creating assignment.');
      }
    };
<<<<<<< HEAD
=======

    //US9 - handle edit assignment
    const handleEditAssignment = async (updates: AssignmentUpdate) => {
      if (!editingAssignment) return;
      try {
      await editAssignment(editingAssignment.id, updates);
      setStatusType('success');
      setStatusMessage('Assignment updated successfully!');
    
     // Refresh assignments list
      const resp = await listAssignments(String(id));
      setAssignments(resp);
      setEditingAssignment(null);
      } catch (error) {
      console.error('Error updating assignment:', error);
      setStatusType('error');
      setStatusMessage('Error updating assignment.');
    }
  };
//US9 - handle delete assignment
const handleDeleteAssignment = async (assignmentId: number) => {
  try {
    await deleteAssignment(assignmentId);
    setStatusType('success');
    setStatusMessage('Assignment deleted successfully!');
    
    // Refresh assignments list
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
  } catch (error) {
    console.error('Error deleting assignment:', error);
    setStatusType('error');
    setStatusMessage('Error deleting assignment.');
  }
};
>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
    
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
        ]}
      />

      <StatusMessage message={statusMessage} type={statusType} />

<<<<<<< HEAD
=======

>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
      <div className="Class">
        <div className="Assignments">
          <ul className="Assignment">
            {assignments.map((assignment) => {
              return (
                <li key={assignment.id}>
<<<<<<< HEAD
                  <AssignmentCard id={assignment.id}>
=======
                  <AssignmentCard 
                    id={assignment.id}
                    onEdit={() => setEditingAssignment(assignment)}
                    onDelete={handleDeleteAssignment}
                    isTeacher={isTeacher()}
                  >
>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
                    {assignment.name}
                  </AssignmentCard>
                </li>
              );
            })}
          </ul>
        </div>

        {isTeacher() ? (
          <div className="AssInputChunk">
            <span>New Assignment Name:</span>
            <Textbox
              placeholder="New Assignment..."
              onInput={setNewAssignmentName}
              className="AssignmentInput"
            />
            <Button
              onClick={() =>
                tryCreateAssingment()
              }
            >
              Add
            </Button>
          </div>
        ) : null}
      </div>
<<<<<<< HEAD
=======



      {editingAssignment && (
        <AssignmentEditor
          assignment={editingAssignment}
          onSave={handleEditAssignment}
          onCancel={() => setEditingAssignment(null)}
        />
      )}
>>>>>>> 2d1214aa1b6b5d771ee7dd2b19b3ababf49f6831
    </>
  );
}
