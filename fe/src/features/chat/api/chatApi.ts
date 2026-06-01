import axiosClient from '@/api/axiosClient';

// ==================== TYPES ====================

export interface ChatRoom {
  id: number;
  roomName: string;
  roomType: 'PRIVATE' | 'GROUP';
  avatarUrl?: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  lastMessageSenderName?: string;
  unreadCount: number;
  memberCount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  chatRoomId: number;
  senderId: number;
  senderUsername: string;
  senderFullName: string;
  senderAvatarUrl?: string;
  content?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'FILE';
  isEdited: boolean;
  isRecalled: boolean;
  isPinned: boolean;
  replyToMessageId?: number;
  replyToMessageContent?: string;
  replyToSenderName?: string;
  reactions?: MessageReaction[];
  createdAt: string;
}

export interface MessageReaction {
  userId: number;
  username: string;
  avatarUrl?: string;
  reactionType: string;
}

export interface ChatMember {
  userId: number;
  username: string;
  fullName: string;
  avatarUrl?: string;
  isOnline?: boolean;
  role?: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  lastReadMessageId?: number;
}

export interface SendMessagePayload {
  content?: string;
  mediaUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'FILE';
  replyToMessageId?: number;
}

export interface CreateGroupPayload {
  roomName: string;
  memberUserIds: number[];
  avatarUrl?: string;
}

// ==================== API FUNCTIONS ====================

export const chatApi = {

  // === INBOX ===
  getInbox: async (page = 0, size = 20) => {
    const res = await axiosClient.get('/chat/inbox', { params: { page, size } });
    return res.data.data; // Page<ChatRoomResponse>
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await axiosClient.get('/chat/unread-count');
    return res.data.data;
  },

  getRoom: async (roomId: number): Promise<ChatRoom> => {
    const res = await axiosClient.get(`/chat/rooms/${roomId}`);
    return res.data.data;
  },

  // === MESSAGES ===
  getMessages: async (roomId: number, page = 0, size = 30) => {
    const res = await axiosClient.get(`/chat/rooms/${roomId}/messages`, {
      params: { page, size },
    });
    return res.data.data; // Page<ChatMessageResponse>
  },

  sendMessage: async (roomId: number, payload: SendMessagePayload): Promise<ChatMessage> => {
    const res = await axiosClient.post(`/chat/rooms/${roomId}/messages`, payload);
    return res.data.data;
  },

  markAsRead: async (roomId: number, messageId: number): Promise<void> => {
    await axiosClient.post(`/chat/rooms/${roomId}/messages/${messageId}/read`);
  },

  editMessage: async (messageId: number, content: string): Promise<ChatMessage> => {
    const res = await axiosClient.put(`/chat/messages/${messageId}`, { content });
    return res.data.data;
  },

  recallMessage: async (messageId: number): Promise<void> => {
    await axiosClient.delete(`/chat/messages/${messageId}`);
  },

  // === REACTIONS ===
  reactToMessage: async (messageId: number, reactionType: string): Promise<ChatMessage> => {
    const res = await axiosClient.post(`/chat/messages/${messageId}/reactions`, { reactionType });
    return res.data.data;
  },

  removeReaction: async (messageId: number): Promise<void> => {
    await axiosClient.delete(`/chat/messages/${messageId}/reactions`);
  },

  // === MEDIA GALLERY ===
  getMediaGallery: async (roomId: number): Promise<ChatMessage[]> => {
    const res = await axiosClient.get(`/chat/rooms/${roomId}/media`);
    return res.data.data;
  },

  // === GROUP MANAGEMENT ===
  createGroup: async (payload: CreateGroupPayload): Promise<ChatRoom> => {
    const res = await axiosClient.post('/chat/groups', payload);
    return res.data.data;
  },

  updateGroup: async (roomId: number, payload: { roomName?: string; avatarUrl?: string }): Promise<ChatRoom> => {
    const res = await axiosClient.put(`/chat/groups/${roomId}`, payload);
    return res.data.data;
  },

  getGroupMembers: async (roomId: number): Promise<ChatMember[]> => {
    const res = await axiosClient.get(`/chat/groups/${roomId}/members`);
    return res.data.data;
  },

  addMembers: async (roomId: number, memberUserIds: number[]): Promise<void> => {
    await axiosClient.post(`/chat/groups/${roomId}/members`, { memberUserIds });
  },

  removeMember: async (roomId: number, userId: number): Promise<void> => {
    await axiosClient.delete(`/chat/groups/${roomId}/members/${userId}`);
  },

  leaveGroup: async (roomId: number): Promise<void> => {
    await axiosClient.post(`/chat/groups/${roomId}/leave`);
  },

  // === DIRECT MESSAGE ===
  // Tìm room DM đã tồn tại với user này, hoặc tạo mới
  getOrCreateDirectRoom: async (targetUserId: number): Promise<ChatRoom> => {
    const res = await axiosClient.post('/chat/direct', { targetUserId });
    return res.data.data;
  },
};
