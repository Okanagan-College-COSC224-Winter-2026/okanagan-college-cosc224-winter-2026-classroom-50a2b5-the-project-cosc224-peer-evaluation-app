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

export const getNotifications = (unreadOnly = false) => {
  const url = new URL(`${BASE_URL}/notification/`);
  if (unreadOnly) url.searchParams.set("unread_only", "true");
  return call(url.toString());
};

export const getUnreadCount = () =>
  call(`${BASE_URL}/notification/unread-count`);

export const markNotificationRead = (id: number) =>
  call(`${BASE_URL}/notification/${id}/read`, "PATCH");

export const markNotificationUnread = (id: number) =>
  call(`${BASE_URL}/notification/${id}/unread`, "PATCH");

export const markAllNotificationsRead = () =>
  call(`${BASE_URL}/notification/read-all`, "PATCH");

export const deleteNotification = (id: number) =>
  call(`${BASE_URL}/notification/${id}`, "DELETE");

export const deleteReadNotifications = () =>
  call(`${BASE_URL}/notification/read`, "DELETE");

export const deleteAllNotifications = () =>
  call(`${BASE_URL}/notification/all`, "DELETE");
