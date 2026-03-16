import AssignmentCard from "../components/AssignmentCard"
import Button from "../components/Button"
import "./ClassHome.css"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { listAssignments, listClasses, createAssignment } from "../util/api"
import TabNavigation from "../components/TabNavigation"
import { importCSV } from "../util/csv"
import Textbox from "../components/Textbox"
import StatusMessage from "../components/StatusMessage"
import { isTeacher } from "../util/login"
import RichTextEditor from "../components/RichTextEditor"

export default function ClassHome() {
  const { id } = useParams()
  const idNew = Number(id)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [newAssignmentName, setNewAssignmentName] = useState("")
  const [newAssignmentDescription, setNewAssignmentDescription] = useState("")
  const [className, setClassName] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [statusType, setStatusType] = useState<"error" | "success">("error")

  useEffect(() => {
    (async () => {
      const resp = await listAssignments(String(id))
      const classes = await listClasses()
      const currentClass = classes.find((c: { id: number }) => c.id === Number(id))
      setAssignments(resp)
      setClassName(currentClass?.name || null)
    })()
  }, [id])

  const tryCreateAssignment = async () => {
    try {
      setStatusMessage("")
      const response = await createAssignment(idNew, newAssignmentName, newAssignmentDescription)
      const createdAssignment = response?.assignment
      if (!createdAssignment?.id) throw new Error("Failed to create assignment")
      setAssignments((prev) => [...prev, createdAssignment])
      setNewAssignmentName("")
      setNewAssignmentDescription("")
      setStatusType("success")
      setStatusMessage("Assignment created successfully!")
    } catch (error) {
      console.error("Error creating assignment:", error)
      setStatusType("error")
      setStatusMessage("Error creating assignment.")
    }
  }

  return (
    <div className="ClassHome">
      <div className="ClassHeader">
        <div className="ClassHeaderLeft">
          <h2>{className}</h2>
        </div>
        <div className="ClassHeaderRight">
          {isTeacher() && (
            <Button onClick={() => importCSV(id as string)}>
              Add Students via CSV
            </Button>
          )}
        </div>
      </div>

      <TabNavigation
        tabs={[
          { label: "Home",    path: `/classes/${id}/home` },
          { label: "Members", path: `/classes/${id}/members` },
        ]}
      />

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {assignments.map((assignment) => (
          <li key={assignment.id}>
            <AssignmentCard id={assignment.id}>
              {assignment.name}
            </AssignmentCard>
          </li>
        ))}
      </ul>

      {isTeacher() && (
        <div className="NewAssignment">
          <h3>New Assignment</h3>
          <label>Name:</label>
          <Textbox
            onInput={(val) => setNewAssignmentName(val)}
            placeholder="Assignment name"
          />
          <label>Description:</label>
          <RichTextEditor
            value={newAssignmentDescription}
            onChange={setNewAssignmentDescription}
            placeholder="Write assignment instructions..."
          />
          <Button onClick={tryCreateAssignment}>Add</Button>
          <StatusMessage message={statusMessage} type={statusType} />
        </div>
      )}
    </div>
  )
}