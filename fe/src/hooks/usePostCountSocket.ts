import { useEffect, useRef } from 'react';
import { useWebSocketClient } from '@/context/WebSocketContext';

/**
 * Payload khớp chính xác với BE PostCountUpdate DTO.
 * reactionCounts key = ReactionType enum: LIKE | HEART | HAHA | WOW | SAD | ANGRY
 */
export interface PostCountPayload {
  postId: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  reactionCounts: Record<'LIKE' | 'HEART' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY', number>;
}

/**
 * Subscribe /topic/posts/{postId}/counts để nhận count update real-time.
 * Dùng shared STOMP client từ WebSocketContext (không tạo kết nối mới).
 * Tự động unsubscribe khi component unmount.
 */
export const usePostCountSocket = (
  postId: number | string,
  onUpdate: (payload: PostCountPayload) => void
) => {
  const { client, isConnected } = useWebSocketClient();
  // Giữ ref của onUpdate để tránh re-subscribe do closure thay đổi
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!client || !isConnected) return;

    const topic = `/topic/posts/${postId}/counts`;
    const subscription = client.subscribe(topic, (message) => {
      try {
        const payload: PostCountPayload = JSON.parse(message.body);
        onUpdateRef.current(payload);
      } catch (e) {
        console.error('[usePostCountSocket] Failed to parse message:', e);
      }
    });

    console.log(`[PostCountWS] Subscribed to ${topic}`);

    return () => {
      subscription.unsubscribe();
      console.log(`[PostCountWS] Unsubscribed from ${topic}`);
    };
    // Chỉ re-subscribe khi postId hoặc kết nối thay đổi
  }, [postId, client, isConnected]);
};
