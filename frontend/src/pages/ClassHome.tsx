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
  }, [])

  const tryCreateAssingment = async () => {
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
    <div>
      <TabNavigation tabs={[{ label: "Home", path: `/class/${id}` }, { label: "Members", path: `/class/${id}/members` }]} />
      <h2>{className}</h2>
      {isTeacher() && (
        <Button onClick={() => importCSV(id as string)}>Add Students via CSV</Button>
      )}
      {assignments.map((assignment) => (
        <AssignmentCard key={assignment.id} id={assignment.id}>{assignment.name}</AssignmentCard>
      ))}
      {isTeacher() && (
        <div>
          <h3>New Assignment</h3>
          <label>Name:</label>
          <Textbox onInput={(val) => setNewAssignmentName(val)} placeholder="Assignment name" />
          <label>Description:</label>
          <RichTextEditor value={newAssignmentDescription} onChange={setNewAssignmentDescription} placeholder="Write assignment instructions..." />
          <Button onClick={() => tryCreateAssingment()}>Add</Button>
          <StatusMessage message={statusMessage} type={statusType} />
        </div>
      )}
    </div>
  )
}
