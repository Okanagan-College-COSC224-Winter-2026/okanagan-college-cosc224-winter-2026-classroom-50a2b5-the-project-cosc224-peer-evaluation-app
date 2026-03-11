import { BASE_URL, maybeHandleExpire } from "./apiBase";

export const createReview = async (
  assignmentID: number,
  reviewerID: number,
  revieweeID: number
) => {
  const response = await fetch(`${BASE_URL}/create_review`, {
    method: "POST",
    body: JSON.stringify({
      assignmentID,
      reviewerID,
      revieweeID,
    }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response;
};

export const createCriterion = async (
  reviewID: number,
  criterionRowID: number,
  grade: number,
  comments: string
) => {
  const response = await fetch(`${BASE_URL}/create_criterion`, {
    method: "POST",
    body: JSON.stringify({
      reviewID,
      criterionRowID,
      grade,
      comments,
    }),
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  maybeHandleExpire(response);

  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }
  return response;
};

export const getReview = async (
  assignmentID: number,
  reviewerID: number,
  revieweeID: number
) => {
  const resp = await fetch(
    `${BASE_URL}/review?assignmentID=${assignmentID}&reviewerID=${reviewerID}&revieweeID=${revieweeID}`,
    { credentials: "include" }
  );

  maybeHandleExpire(resp);

  return resp;
};
