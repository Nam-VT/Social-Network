import { useEffect, useRef } from 'react';
import { useWebSocketClient } from '@/context/WebSocketContext';
import type { StoryViewResponse } from '@/features/stories/types';

export interface StoryViewPayload {
  storyId: number;
  viewCount: number;
  views: StoryViewResponse[];
}

/**
 * Subscribe /topic/stories/{storyId}/views để nhận update real-time
 * về số lượt view và danh sách người xem/cảm xúc của 1 story.
 */
export const useStoryViewSocket = (
  storyId: number | undefined,
  onUpdate: (payload: StoryViewPayload) => void
) => {
  const { client, isConnected } = useWebSocketClient();
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!storyId || !client || !isConnected) return;

    const topic = `/topic/stories/${storyId}/views`;
    const subscription = client.subscribe(topic, (message) => {
      try {
        const payload: StoryViewPayload = JSON.parse(message.body);
        onUpdateRef.current(payload);
      } catch (e) {
        console.error('[useStoryViewSocket] Failed to parse message:', e);
      }
    });

    console.log(`[StoryViewWS] Subscribed to ${topic}`);

    return () => {
      subscription.unsubscribe();
      console.log(`[StoryViewWS] Unsubscribed from ${topic}`);
    };
  }, [storyId, client, isConnected]);
};
