import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/useAuthStore';
import { usePresenceStore } from '@/store/usePresenceStore';

/**
 * Hook lắng nghe /topic/presence để cập nhật trạng thái online/offline real-time.
 * Đặt ở AppLayout để luôn hoạt động dù đang ở màn hình nào.
 */
export const usePresenceSocket = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setOnline = usePresenceStore((state) => state.setOnline);
  const setOffline = usePresenceStore((state) => state.setOffline);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const client = new Client({
      brokerURL: `ws://localhost:8080/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        console.log('[PresenceWS] Connected to /topic/presence');

        client.subscribe('/topic/presence', (message) => {
          const payload: { username: string; online: boolean; lastSeenAt?: string } = JSON.parse(message.body);
          if (payload.online) {
            setOnline(payload.username);
          } else {
            setOffline(payload.username, payload.lastSeenAt);
          }
        });
      },

      onStompError: (frame) => {
        console.error('[PresenceWS] STOMP error:', frame.headers['message']);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token, user, setOnline, setOffline]);
};
