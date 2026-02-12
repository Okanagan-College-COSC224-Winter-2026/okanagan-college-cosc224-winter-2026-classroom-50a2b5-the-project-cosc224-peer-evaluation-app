// ============================================================
// STUDENT GRADES (US20) — Dev 5
// ============================================================
// Add this at the bottom of src/util/api.ts

export const getStudentGrades = async (): Promise<StudentGradesResponse> => {
  const resp = await fetch(`${BASE_URL}/student/grades`, {
    method: 'GET',
    credentials: 'include'
  })

  maybeHandleExpire(resp);

  if (!resp.ok) {
    throw new Error(`Response status: ${resp.status}`);
  }

  return await resp.json()
}
