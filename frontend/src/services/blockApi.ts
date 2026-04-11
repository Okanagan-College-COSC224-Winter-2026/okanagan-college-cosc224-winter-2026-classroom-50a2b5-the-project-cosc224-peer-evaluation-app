import { BASE_URL, maybeHandleExpire } from "./apiBase";

async function call(url: string, method = "GET") {
  const response = await fetch(url, { method, credentials: "include" });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export const getBlockedStudents = () => call(`${BASE_URL}/block/`);

export const unblockStudent = (studentId: number) =>
  call(`${BASE_URL}/block/${studentId}`, "DELETE");

export const blockAndRejectRequest = (requestId: number) =>
  call(`${BASE_URL}/enrollment-request/${requestId}/block`, "POST");
