import AssignmentCard from "../components/AssignmentCard";
import Button from "../components/Button";
import "./ClassHome.css";
import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { listAssignments, getClassName, createAssignment } from "../util/api";
import TabNavigation from "../components/TabNavigation";
import { importCSV } from "../util/csv";
import Textbox from "../components/Textbox";
import { isTeacher } from "../util/login";

export default function ClassHome() {
  const { id } = useParams();
  const idNew = Number(id)
  const [assignments, setAssignments] = useState<Course[]>([]);
  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [className, setClassName] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const resp = await listAssignments(String(id));
      const classData = await getClassName(String(id));
      setAssignments(resp);
      setClassName(classData.className);
    })();
  }, []);
    
    const tryCreateAssingment = async () => {
      try {
        const response = await createAssignment(idNew, newAssignmentName);
        
        if (!response.id) {
          throw new Error('Failed to create assignment');
        }

        alert('Assignment created successfully!');
      } catch (error) {
        console.error('Error creating assignment:', error);
        alert('Error creating assignment.');
      }

      window.location.reload();
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
        ]}
      />

      <div className="Class">
        <div className="Assignments">
          <ul className="Assignment">
            {assignments.map((assignment) => {
              return (
                <li>
                  <AssignmentCard id={assignment.id}>
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
    </>
  );
}
