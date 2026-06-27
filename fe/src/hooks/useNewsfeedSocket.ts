import { useEffect, useRef } from 'react';
import { useWebSocketClient } from '@/context/WebSocketContext';

export interface NewsfeedPayload {
  postId: number;
  author: string;
}

/**
 * Subscribe /topic/newsfeed/new để nhận event khi có bài viết public/friends mới.
 * Dùng shared STOMP client từ WebSocketContext.
 */
export const useNewsfeedSocket = (onNewPost: (payload: NewsfeedPayload) => void) => {
  const { client, isConnected } = useWebSocketClient();
  const onNewPostRef = useRef(onNewPost);
  onNewPostRef.current = onNewPost;

  useEffect(() => {
    if (!client || !isConnected) return;

    const topic = '/topic/newsfeed/new';
    const subscription = client.subscribe(topic, (message) => {
      try {
        const payload: NewsfeedPayload = JSON.parse(message.body);
        onNewPostRef.current(payload);
      } catch (e) {
        console.error('[useNewsfeedSocket] Failed to parse message:', e);
      }
    });

    console.log(`[NewsfeedWS] Subscribed to ${topic}`);

    return () => {
      subscription.unsubscribe();
      console.log(`[NewsfeedWS] Unsubscribed from ${topic}`);
    };
  }, [client, isConnected]);
};
