import { BASE_URL, maybeHandleExpire } from "./apiBase";

export async function getNotifications(unreadOnly = false) {
  const url = new URL(`${BASE_URL}/notification/`);
  if (unreadOnly) url.searchParams.set("unread_only", "true");
  const response = await fetch(url.toString(), { credentials: "include" });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function getUnreadCount() {
  const response = await fetch(`${BASE_URL}/notification/unread-count`, {
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function markNotificationRead(notificationId: number) {
  const response = await fetch(`${BASE_URL}/notification/${notificationId}/read`, {
    method: "PATCH",
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}

export async function markAllNotificationsRead() {
  const response = await fetch(`${BASE_URL}/notification/read-all`, {
    method: "PATCH",
    credentials: "include",
  });
  maybeHandleExpire(response);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.msg || `Response status: ${response.status}`);
  }
  return response.json();
}
