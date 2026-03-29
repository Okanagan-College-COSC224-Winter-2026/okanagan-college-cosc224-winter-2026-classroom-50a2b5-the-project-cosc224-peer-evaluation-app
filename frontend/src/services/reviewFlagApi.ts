import { BASE_URL, maybeHandleExpire } from "./apiBase";

export async function flagReview(reviewID: number, reason: string) {
  const response = await fetch(`${BASE_URL}/review-flag/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ reviewID, reason }),
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function getFlaggedReviewsForCourse(courseId: number) {
  const response = await fetch(`${BASE_URL}/review-flag/course/${courseId}`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function dismissFlag(flagId: number) {
  const response = await fetch(`${BASE_URL}/review-flag/${flagId}`, {
    method: "DELETE",
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function getFlagsForReview(reviewId: number) {
  const response = await fetch(`${BASE_URL}/review-flag/review/${reviewId}`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}
