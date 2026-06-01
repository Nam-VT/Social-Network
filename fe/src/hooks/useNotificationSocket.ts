import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/useAuthStore';

export interface NotificationPayload {
  id: number;
  actorId: number;
  actorUsername: string;
  actorFullName: string;
  actorAvatarUrl: string;
  type: string;
  targetId: number;
  targetType: string;
  deepLink: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Hook kết nối WebSocket STOMP để nhận thông báo real-time.
 * Sử dụng native WebSocket (không SockJS) để tránh lỗi `global is not defined` trên Vite.
 */
export const useNotificationSocket = (onNotification?: (notification: NotificationPayload) => void) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clientRef = useRef<Client | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<NotificationPayload | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const client = new Client({
      // Native WebSocket - thay vì SockJS
      brokerURL: `ws://localhost:8080/ws`,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        console.log('[WS] Connected to notification channel');

        client.subscribe(`/user/queue/notifications`, (message) => {
          const notification: NotificationPayload = JSON.parse(message.body);
          setLatestNotification(notification);
          onNotification?.(notification);
        });

        client.subscribe(`/user/queue/unread-notifications`, (message) => {
          const count = parseInt(message.body, 10);
          setUnreadCount(count);
        });
      },

      onStompError: (frame) => {
        console.error('[WS] STOMP error:', frame.headers['message']);
      },

      onWebSocketError: (event) => {
        console.warn('[WS] WebSocket connection error, will retry...');
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token, user]);

  return { unreadCount, latestNotification, setUnreadCount };
};
