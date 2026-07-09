import axiosClient from '@/api/axiosClient';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  coverUrl?: string;
  gender?: string;
  birthDate?: string;
  relationshipStatus?: string;
  friendListVisibility?: string;
  isOnline?: boolean;
  lastSeenAt?: string;
  friendCount: number;
  followerCount: number;
  followingCount: number;
  friendshipStatus: string; // "NONE", "FRIEND", "PENDING_SENT", "PENDING_RECEIVED"
  isFollowing: boolean;
  isBlocked: boolean;
}

export const profileApi = {
  // === PROFILE ===
  getMyProfile: async () => {
    const res = await axiosClient.get('/users/me');
    return res.data.data;
  },
  getUserProfile: async (username: string) => {
    const res = await axiosClient.get(`/users/${username}`);
    return res.data.data;
  },
  updateProfile: async (payload: Partial<UserProfile>) => {
    const res = await axiosClient.put('/users/me', payload);
    return res.data.data;
  },
  updatePrivacy: async (friendListVisibility: string) => {
    const res = await axiosClient.put('/users/me/privacy', { friendListVisibility });
    return res.data.data;
  },
  
  // Media upload expects FormData
  updateAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },
  updateCover: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosClient.post('/users/me/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // === FRIENDSHIP ===
  getPendingRequests: async () => {
    const res = await axiosClient.get('/friends/requests/pending');
    return res.data?.data ?? res.data ?? [];
  },
  getSentRequests: async () => {
    const res = await axiosClient.get('/friends/requests/sent');
    return res.data.data;
  },
  cancelFriendRequest: async (userId: number) => {
    const res = await axiosClient.delete(`/friends/request/cancel/${userId}`);
    return res.data;
  },
  getFriendSuggestions: async () => {
    const res = await axiosClient.get('/friends/suggestions');
    return res.data.data;
  },
  sendFriendRequest: async (userId: number) => {
    const res = await axiosClient.post(`/friends/request/${userId}`);
    return res.data;
  },
  acceptFriendRequest: async (userId: number) => {
    const res = await axiosClient.post(`/friends/accept/${userId}`);
    return res.data;
  },
  rejectFriendRequest: async (userId: number) => {
    const res = await axiosClient.delete(`/friends/request/${userId}`);
    return res.data;
  },
  unfriend: async (userId: number) => {
    const res = await axiosClient.delete(`/friends/${userId}`);
    return res.data;
  },

  // === FOLLOW ===
  followUser: async (userId: number) => {
    const res = await axiosClient.post(`/users/${userId}/follow`);
    return res.data;
  },
  unfollowUser: async (userId: number) => {
    const res = await axiosClient.delete(`/users/${userId}/follow`);
    return res.data;
  },

  // === POSTS BY USER ===
  getUserPosts: async (username: string, page = 0, size = 10) => {
    const res = await axiosClient.get(`/posts/user/${username}`, { params: { page, size } });
    return res.data.data; // Return Page object directly, consistent with other APIs
  },

  // === FRIENDS BY USER ===
  getUserFriends: async (username: string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/friends/${username}`, { params: { page, size } });
    return res.data;
  },
  getMutualFriends: async (username: string, limit = 5) => {
    const res = await axiosClient.get(`/friends/mutual/${username}`, { params: { limit } });
    return res.data.data;
  }
};
