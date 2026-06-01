import axiosClient from '@/api/axiosClient';

export interface Notification {
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

export const notificationApi = {
  getNotifications: async (page = 0, size = 10) => {
    const res = await axiosClient.get('/notifications', { params: { page, size } });
    return res.data.data; // Page<Notification>
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await axiosClient.get('/notifications/unread-count');
    return res.data.data;
  },

  markAsRead: async (id: number) => {
    await axiosClient.put(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    await axiosClient.put('/notifications/read-all');
  },
};

// Map type → nội dung hiển thị tiếng Việt
export const NOTIFICATION_TEXT: Record<string, { icon: string; text: string }> = {
  LIKE_POST:          { icon: '👍', text: 'đã thích bài viết của bạn' },
  LIKE_COMMENT:       { icon: '❤️', text: 'đã thích bình luận của bạn' },
  COMMENT:            { icon: '💬', text: 'đã bình luận về bài viết của bạn' },
  FRIEND_REQ:         { icon: '👥', text: 'đã gửi lời mời kết bạn' },
  FRIEND_ACCEPT:      { icon: '🎉', text: 'đã chấp nhận lời mời kết bạn' },
  FOLLOWED:           { icon: '✨', text: 'đã theo dõi bạn' },
  SHARE_POST:         { icon: '🔁', text: 'đã chia sẻ bài viết của bạn' },
  GROUP_INVITE:       { icon: '📩', text: 'đã mời bạn vào nhóm' },
  GROUP_JOIN_REQUEST: { icon: '🙋', text: 'muốn tham gia nhóm của bạn' },
  GROUP_JOIN_ACCEPT:  { icon: '🎉', text: 'đã phê duyệt yêu cầu tham gia nhóm của bạn' },
  GROUP_POST_APPROVED:{ icon: '✅', text: 'bài viết của bạn đã được duyệt' },
  GROUP_KICK:         { icon: '❌', text: 'đã mời bạn ra khỏi nhóm' },
  STORY_REACT:        { icon: '⭐', text: 'đã thả cảm xúc vào story của bạn' },
  STORY_REPLY:        { icon: '💬', text: 'đã phản hồi story của bạn' },
};
