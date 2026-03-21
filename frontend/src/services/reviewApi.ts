import { BASE_URL, maybeHandleExpire } from "./apiBase";

export const submitReview = async (
  assignmentID: number,
  revieweeID: number,
  criteria: { criterionRowID: number; grade: number; comments: string }[],
  comments: string = ""
) => {
  const response = await fetch(`${BASE_URL}/review/submit`, {
    method: "POST",
    body: JSON.stringify({ assignmentID, revieweeID, comments, criteria }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return await response.json();
};

export const getReview = async (
  assignmentID: number,
  revieweeID: number
) => {
  const resp = await fetch(
    `${BASE_URL}/review/lookup?assignmentID=${assignmentID}&revieweeID=${revieweeID}`,
    { credentials: "include" }
  );

  maybeHandleExpire(resp);
  return resp;
};

export const getReviewsForAssignment = async (assignmentID: number) => {
  const resp = await fetch(`${BASE_URL}/review/assignment/${assignmentID}`, {
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  return await resp.json();
};

export const getCourseGradeSummary = async (
  courseID: number,
  studentID?: number
) => {
  const url = new URL(`${BASE_URL}/review/course/${courseID}/summary`);
  if (studentID !== undefined) {
    url.searchParams.set("studentID", String(studentID));
  }
  const resp = await fetch(url.toString(), {
    credentials: "include",
  });

  maybeHandleExpire(resp);

  if (!resp.ok) {
    const data = await resp.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${resp.status}`);
  }

  return await resp.json();
};
