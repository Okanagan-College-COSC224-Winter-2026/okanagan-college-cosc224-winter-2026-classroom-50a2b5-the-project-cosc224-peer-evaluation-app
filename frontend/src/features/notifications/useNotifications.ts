import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../../services/notificationApi";
import { connectSocket } from "../../services/socket";
import { getUserId } from "../../util/login";

/**
 * Hook that sets up the WebSocket connection and listens for real-time
 * notification events. When a "new_notification" event arrives, it
 * instantly invalidates the notification queries so the UI updates.
 *
 * Falls back to polling (60s) in case the socket connection drops.
 */
export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    const socket = connectSocket(userId);

    const handleNewNotification = (data: unknown) => {
      console.log("[socket] new_notification received:", data);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [queryClient]);
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 60000, // Fallback poll every 60s (socket handles real-time)
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 60000, // Fallback poll every 60s (socket handles real-time)
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: number) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}
