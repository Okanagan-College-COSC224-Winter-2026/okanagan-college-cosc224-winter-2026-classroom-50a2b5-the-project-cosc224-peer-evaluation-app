import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
  deleteReadNotifications,
  deleteAllNotifications,
} from "../../services/notificationApi";
import { connectSocket } from "../../services/socket";
import { getUserId } from "../../util/login";

const KEYS = {
  list: ["notifications"] as const,
  count: ["notifications-unread-count"] as const,
};

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: KEYS.list });
  queryClient.invalidateQueries({ queryKey: KEYS.count });
}

/**
 * Sets up the WebSocket connection and listens for real-time push events.
 * Falls back to 60s polling if the socket drops.
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const socket = connectSocket(userId);

    const handleNew = (data: unknown) => {
      console.log("[socket] new_notification received:", data);
      invalidateAll(queryClient);
    };

    socket.on("new_notification", handleNew);
    return () => { socket.off("new_notification", handleNew); };
  }, [queryClient]);
}

export function useNotifications() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () => getNotifications(),
    refetchInterval: 60000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: KEYS.count,
    queryFn: getUnreadCount,
    refetchInterval: 60000,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useMarkUnread() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationUnread(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteNotification(id),
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteReadNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteReadNotifications,
    onSuccess: () => invalidateAll(queryClient),
  });
}

export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllNotifications,
    onSuccess: () => invalidateAll(queryClient),
  });
}
