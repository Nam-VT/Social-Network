import { useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/useAuthStore';
import type { ChatMessage } from '../api/chatApi';

interface UseChatSocketOptions {
  roomId: number | null;
  onMessage: (msg: ChatMessage) => void;
  onTyping: (payload: { username: string; isTyping: boolean }) => void;
  onMessageUpdated?: (msg: ChatMessage) => void;
  onReadReceipt?: (payload: { userId: number; messageId: number }) => void;
}

/**
 * Hook kết nối WebSocket STOMP cho real-time chat.
 * Subscribe 2 topic:
 *  - /topic/chat/{roomId}         → tin nhắn mới
 *  - /topic/chat/{roomId}/typing  → trạng thái đang gõ
 *  - /topic/chat/{roomId}/read    → read receipts
 */
export const useChatSocket = ({
  roomId,
  onMessage,
  onTyping,
  onMessageUpdated,
  onReadReceipt,
}: UseChatSocketOptions) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const clientRef = useRef<Client | null>(null);
  const subscriptionsRef = useRef<{ msg?: any; typing?: any; read?: any }>({});

  // Dùng ref để tránh stale closure trong WebSocket callbacks
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onMessageUpdatedRef = useRef(onMessageUpdated);
  const onReadReceiptRef = useRef(onReadReceipt);

  // Cập nhật ref mỗi render để callback luôn là latest
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);
  useEffect(() => { onMessageUpdatedRef.current = onMessageUpdated; }, [onMessageUpdated]);
  useEffect(() => { onReadReceiptRef.current = onReadReceipt; }, [onReadReceipt]);

  // Gửi trạng thái đang gõ lên server
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!clientRef.current?.connected || !roomId || !user) return;
      clientRef.current.publish({
        destination: `/app/chat/${roomId}/typing`,
        body: JSON.stringify({ username: user.username, isTyping }),
      });
    },
    [roomId, user]
  );

  useEffect(() => {
    if (!token || !user) return;

    // Tái sử dụng client đã kết nối nếu có
    if (!clientRef.current) {
      const client = new Client({
        brokerURL: import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
        connectHeaders: { Authorization: `Bearer ${token}` },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onStompError: (frame) => {
          console.error('[ChatWS] STOMP error:', frame.headers['message']);
        },
        onWebSocketError: () => {
          console.warn('[ChatWS] WebSocket error, will retry...');
        },
      });
      client.activate();
      clientRef.current = client;
    }

    return () => {
      // Không deactivate client khi đổi roomId, chỉ unsubscribe
    };
  }, [token, user]);

  // Subscribe/Unsubscribe khi roomId thay đổi
  useEffect(() => {
    if (!roomId) return;

    const doSubscribe = (client: Client) => {
      // Unsubscribe topic cũ nếu có
      subscriptionsRef.current.msg?.unsubscribe();
      subscriptionsRef.current.typing?.unsubscribe();
      subscriptionsRef.current.read?.unsubscribe();

      // Dùng ref để tránh stale closure
      subscriptionsRef.current.msg = client.subscribe(
        `/topic/chat/${roomId}`,
        (message) => {
          const msg: ChatMessage = JSON.parse(message.body);
          if (msg.isRecalled || msg.isEdited) {
            onMessageUpdatedRef.current?.(msg);
          } else {
            onMessageRef.current(msg);
          }
        }
      );

      subscriptionsRef.current.typing = client.subscribe(
        `/topic/chat/${roomId}/typing`,
        (message) => {
          const payload = JSON.parse(message.body);
          onTypingRef.current(payload);
        }
      );

      subscriptionsRef.current.read = client.subscribe(
        `/topic/chat/${roomId}/read`,
        (message) => {
          const payload = JSON.parse(message.body);
          onReadReceiptRef.current?.(payload);
        }
      );
    };

    const client = clientRef.current;
    if (!client) return;

    if (client.connected) {
      doSubscribe(client);
    } else {
      // Đợi kết nối rồi subscribe
      const previousOnConnect = client.onConnect;
      client.onConnect = (frame) => {
        previousOnConnect?.(frame);
        doSubscribe(client);
      };
    }

    return () => {
      subscriptionsRef.current.msg?.unsubscribe();
      subscriptionsRef.current.typing?.unsubscribe();
      subscriptionsRef.current.read?.unsubscribe();
      subscriptionsRef.current = {};
    };
  }, [roomId]);

  return { sendTyping };
};
