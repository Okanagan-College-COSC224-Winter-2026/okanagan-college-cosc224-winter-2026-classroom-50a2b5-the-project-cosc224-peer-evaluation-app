import { BASE_URL, maybeHandleExpire } from "./apiBase";

export async function requestEnrollment(courseID: number) {
  const response = await fetch(`${BASE_URL}/enrollment-request/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ courseID }),
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function getMyEnrollmentRequests() {
  const response = await fetch(`${BASE_URL}/enrollment-request/my`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function getPendingRequests(courseId: number) {
  const response = await fetch(`${BASE_URL}/enrollment-request/course/${courseId}`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function approveRequest(requestId: number) {
  const response = await fetch(`${BASE_URL}/enrollment-request/${requestId}/approve`, {
    method: "POST",
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function rejectRequest(requestId: number) {
  const response = await fetch(`${BASE_URL}/enrollment-request/${requestId}/reject`, {
    method: "POST",
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function browseAllCourses() {
  const response = await fetch(`${BASE_URL}/class/browse_classes`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}
