import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuthStore } from '@/store/useAuthStore';
import { useQueryClient } from '@tanstack/react-query';
import type { ChatMessage, ChatRoom } from '../api/chatApi';

export interface ChatNotificationPayload {
  message: ChatMessage;
  room: ChatRoom;
}

/**
 * Hook kết nối WebSocket STOMP nhận thông báo tin nhắn mới toàn cầu.
 * Đặt hook này ở component gốc (VD: AppLayout) để luôn nhận tin nhắn dù ở màn hình nào.
 */
export const useGlobalChatSocket = (onNewMessage?: (payload: ChatNotificationPayload) => void) => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    const client = new Client({
      brokerURL: import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      
      onConnect: () => {
        console.log('[GlobalChatWS] Connected to /user/queue/chat');

        // Lắng nghe tin nhắn chat cá nhân/nhóm
        client.subscribe('/user/queue/chat', (message) => {
          const payload: ChatNotificationPayload = JSON.parse(message.body);
          const newMsg = payload.message;
          const room = payload.room;

          // 1. Cập nhật danh sách Inbox
          queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
          queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });

          // 2. Cập nhật cache tin nhắn nếu đang mở ChatWindow của phòng đó
          queryClient.setQueryData(['messages', room.id], (oldData: any) => {
            if (!oldData) return oldData;
            
            // Lấy trang đầu tiên
            const firstPage = oldData.pages[0];
            if (!firstPage) return oldData;

            // Kiểm tra trùng lặp
            const exists = firstPage.content.find((m: ChatMessage) => m.id === newMsg.id);
            if (exists) return oldData;

            const updatedFirstPage = {
              ...firstPage,
              content: [newMsg, ...firstPage.content], // Infinite query fetch DESC
            };

            return {
              ...oldData,
              pages: [updatedFirstPage, ...oldData.pages.slice(1)],
            };
          });

          // 3. Hiển thị Toast Notification nếu người dùng KHÔNG ở trang chat của room đó
          const isCurrentRoom = window.location.pathname.includes(`/chat/${room.id}`);
          if (!isCurrentRoom && newMsg.senderId !== user.id) {
            onNewMessage?.(payload);
            // Feature 2: Âm thanh ping + Tab flash
            import('@/utils/messageNotification').then(({ playMessageSound, startTabFlash }) => {
              playMessageSound();
              startTabFlash(`${newMsg.senderFullName}: ${newMsg.content || 'Đã gửi một ảnh'}`);
            });
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [token, user, queryClient]);
};
