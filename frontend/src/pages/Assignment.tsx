import { useEffect, useState, ChangeEvent } from "react"
import { useParams } from "react-router-dom"
import DOMPurify from "dompurify"
import "./Assignment.css"
import RubricCreator from "../components/RubricCreator"
import TabNavigation from "../components/TabNavigation"
import RichTextEditor from "../components/RichTextEditor"
import Button from "../components/Button"
import StatusMessage from "../components/StatusMessage"
import ReviewFileUpload from "../components/ReviewFileUpload"
import { isTeacher, isStudent } from "../util/login"
import {
  listStuGroup,
  getUserId,
  listCourseMembers,
  getReview,
  getAssignment,
  updateAssignment,
  uploadReviewFiles,
} from "../util/api"


export default function Assignment() {
  const { id } = useParams()
  const [stuGroup, setStuGroup] = useState<StudentGroups[]>([])
  const [classMembers, setClassMembers] = useState<User[]>([])
  const [revieweeID, setRevieweeID] = useState<number>(0)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)


  useEffect(() => {
    (async () => {
      const fetchedID = await getUserId()
      const stus = await listStuGroup(Number(id), fetchedID)
      setStuGroup(stus)
      if (revieweeID > 0) {
        try {
          const reviewResponse = await getReview(Number(id), fetchedID, revieweeID)
          const reviewData = await reviewResponse.json()
          console.log("Review grades:", reviewData.grades)
        } catch { /* No review yet */ }
      }
      try {
        const members = await listCourseMembers(String(id))
        setClassMembers(members)
      } catch { /* Members unavailable */ }
      try {
        const data = await getAssignment(Number(id))
        setAssignment(data)
        setEditName(data.name ?? "")
        setEditDescription(data.description_html ?? "")
      } catch { /* Assignment unavailable */ }
    })()
  }, [id])


  const nameFromId = (userId: number) =>
    classMembers.find((m) => m.id === userId)?.name || `Student #${userId}`


  function handleRadioChange(event: ChangeEvent<HTMLInputElement>) {
    setRevieweeID(Number(event.target.value))
  }


  const handleSaveDescription = async () => {
    try {
      setEditStatus("Saving...")
      await updateAssignment(Number(id), editName, editDescription)
      setAssignment((prev) => prev ? { ...prev, name: editName, description_html: editDescription } : prev)
      setIsEditing(false)
      setEditStatus("Saved successfully!")
      setTimeout(() => setEditStatus(""), 3000)
    } catch {
      setEditStatus("Error saving. Please try again.")
    }
  }


  const handleSubmitReview = async () => {
    setUploadStatus(null)
    if (revieweeID === 0) {
      alert("Please select a group member to review.")
      return
    }
    try {
      window.location.href = `/assignments/${id}/review/${revieweeID}`
    } catch {
      setUploadStatus("Error navigating to review page.")
    }
  }


  const handleReviewWithFiles = async (reviewId: number) => {
    if (attachedFiles.length > 0) {
      try {
        await uploadReviewFiles(reviewId, attachedFiles)
        setUploadStatus(`${attachedFiles.length} file(s) uploaded successfully.`)
        setAttachedFiles([])
      } catch {
        setUploadStatus("Error uploading files.")
      }
    }
  }


  const tabs = [
    { label: "Home", path: `/assignments/${id}` },
    { label: "Group", path: `/assignments/${id}/group` },
  ]
  if (isStudent()) {
    tabs.push({ label: "Feedback", path: `/assignments/${id}/feedback` })
  }


  return (
    <div>
      <TabNavigation tabs={tabs} />
      <h2>Assignment {id}</h2>


      {assignment && (
        <div className="assignment-description-section">
          {isTeacher() && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Description</Button>
          )}
          {isTeacher() && isEditing && (
            <div className="edit-description-form">
              <label>Assignment Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="edit-name-input"
                title="Assignment name"
                placeholder="Assignment name"
              />
              <label>Description:</label>
              <RichTextEditor
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Write assignment instructions..."
              />
              <div className="edit-description-actions">
                <Button onClick={handleSaveDescription}>Save</Button>
                <Button onClick={() => setIsEditing(false)} type="secondary">Cancel</Button>
              </div>
              <StatusMessage message={editStatus} type="success" />
            </div>
          )}
          {!isEditing && assignment.description_html && (
            <div
              className="assignment-description-html"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(assignment.description_html) }}
            />
          )}
          {!isEditing && !assignment.description_html && (
            <p className="assignment-no-description">No description added yet.</p>
          )}
        </div>
      )}


      {isTeacher() && <RubricCreator id={Number(id)} />}


      {!isTeacher() && (
        <div>
          <h3>Select a group member to review</h3>
          {stuGroup.map((stus) => (
            <div key={stus.userID}>
              <input
                type="radio"
                id={stus.userID.toString()}
                value={stus.userID}
                name="groupMembers"
                onChange={handleRadioChange}
                title="Select group member"
              />
              <label htmlFor={stus.userID.toString()}>
                {nameFromId(stus.userID)}
              </label>
            </div>
          ))}

          <ReviewFileUpload files={attachedFiles} onChange={setAttachedFiles} />

          {uploadStatus && (
            <p style={{ color: uploadStatus.startsWith("Error") ? "red" : "green" }}>
              {uploadStatus}
            </p>
          )}

          <Button
            onClick={() => {
              if (revieweeID === 0) {
                alert("Please select a group member to review.")
                return
              }
              window.location.href = `/assignments/${id}/review/${revieweeID}`
            }}
          >
            Review This Member
          </Button>
        </div>
      )}
    </div>
  )
}
