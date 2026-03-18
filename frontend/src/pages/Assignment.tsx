import { useEffect, useState, ChangeEvent } from "react"
import { useParams } from "react-router-dom"
import "./Assignment.css"
import RubricCreator from "../components/RubricCreator"
import RubricDisplay from "../components/RubricDisplay"
import TabNavigation from "../components/TabNavigation"
import ReviewFileUpload from "../components/ReviewFileUpload"
import { isTeacher } from "../util/login"
import {
  listStuGroup,
  getUserId,
  createReview,
  getReview,
  uploadReviewFiles,
} from "../util/api"

export default function Assignment() {
  const { id } = useParams()
  const [stuGroup, setStuGroup] = useState([])
  const [revieweeID, setRevieweeID] = useState(0)
  const [stuID, setStuID] = useState(0)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploadStatus, setUploadStatus] = useState<string | null>(null)
  const [grades, setGrades] = useState<any>({})
  const [selectedCriterion, setSelectedCriterion] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const fetchedID = await getUserId()
      setStuID(fetchedID)
      const stus = await listStuGroup(Number(id), fetchedID)
      setStuGroup(stus)
      if (revieweeID > 0) {
        try {
          const reviewResponse = await getReview(Number(id), fetchedID, revieweeID)
          const reviewData = await reviewResponse.json()
          console.log("Review grades:", reviewData.grades)
        } catch {
          /* No review yet */
        }
      }
    })()
  }, [revieweeID, id])

  function handleRadioChange(event: ChangeEvent<HTMLInputElement>): void {
    setRevieweeID(Number(event.target.value))
  }

  const handleSubmitReview = async () => {
    setUploadStatus(null)
    if (revieweeID === 0) {
      alert("Please select a group member to review.")
      return
    }
    try {
      const reviewResponse = await createReview(Number(id), stuID, revieweeID)
      const reviewData = await reviewResponse.json()

      if (attachedFiles.length > 0) {
        await uploadReviewFiles(reviewData.id, attachedFiles)
        setUploadStatus(`${attachedFiles.length} file(s) uploaded successfully.`)
        setAttachedFiles([])
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      setUploadStatus("Error uploading files. Review may have been submitted.")
    }
  }

  return (
    <>
      <h1>Assignment {id}</h1>

      {isTeacher() && <RubricCreator id={Number(id)} />}

      {!isTeacher() && (
        <>
          <h3>Select a group member to review</h3>
          {stuGroup.map((stus: any) => (
            <span key={stus.userID}>
              <input
                type="radio"
                id={stus.userID.toString()}
                value={stus.userID}
                name="groupMembers"
                onChange={handleRadioChange}
              />
              <label htmlFor={stus.userID.toString()}>{stus.userID}</label>
              &nbsp;
            </span>
          ))}

          <RubricDisplay 
            rubricId={Number(id)} 
            grades={grades}
            onCriterionSelect={(row: number, column: number) => setSelectedCriterion(`${row}-${column}`)}
          />

          <ReviewFileUpload files={attachedFiles} onChange={setAttachedFiles} />

          {uploadStatus && (
            <p style={{ color: uploadStatus.startsWith("Error") ? "red" : "green" }}>
              {uploadStatus}
            </p>
          )}

          <button type="button" onClick={handleSubmitReview}>
            Submit Review
          </button>
        </>
      )}
    </>
  )
}