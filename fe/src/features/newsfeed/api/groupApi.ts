import axiosClient from '@/api/axiosClient';

export interface CreateGroupPayload {
  name: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  requirePostApproval: boolean;
}

export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  coverUrl?: string;
  avatarUrl?: string;
  privacy?: 'PUBLIC' | 'PRIVATE';
  requirePostApproval?: boolean;
}

export const groupApi = {
  createGroup: async (payload: CreateGroupPayload) => {
    const res = await axiosClient.post('/groups', payload);
    return res.data;
  },

  updateGroup: async (groupId: number | string, payload: UpdateGroupPayload) => {
    const res = await axiosClient.put(`/groups/${groupId}`, payload);
    return res.data;
  },

  deleteGroup: async (groupId: number | string) => {
    const res = await axiosClient.delete(`/groups/${groupId}`);
    return res.data;
  },

  getGroupById: async (groupId: number | string) => {
    const res = await axiosClient.get(`/groups/${groupId}`);
    return res.data.data;
  },

  joinGroup: async (groupId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/join`);
    return res.data;
  },

  leaveGroup: async (groupId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/leave`);
    return res.data;
  },

  getMembers: async (groupId: number | string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/${groupId}/members`, { params: { page, size } });
    return res.data.data;
  },

  getPendingRequests: async (groupId: number | string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/${groupId}/members/pending`, { params: { page, size } });
    return res.data.data;
  },

  inviteToGroup: async (groupId: number | string, friendId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/invite`, { friendId });
    return res.data;
  },

  approveJoinRequest: async (groupId: number | string, userId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/members/${userId}/approve`);
    return res.data;
  },

  kickMember: async (groupId: number | string, userId: number | string) => {
    const res = await axiosClient.delete(`/groups/${groupId}/members/${userId}`);
    return res.data;
  },

  changeRole: async (groupId: number | string, userId: number | string, role: 'ADMIN' | 'MODERATOR' | 'MEMBER') => {
    const res = await axiosClient.put(`/groups/${groupId}/members/${userId}/role`, { role });
    return res.data;
  },

  approvePost: async (groupId: number | string, postId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/posts/${postId}/approve`);
    return res.data;
  },

  rejectPost: async (groupId: number | string, postId: number | string) => {
    const res = await axiosClient.post(`/groups/${groupId}/posts/${postId}/reject`);
    return res.data;
  },

  getGroupFeed: async (groupId: number | string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/${groupId}/feed`, { params: { page, size } });
    return res.data.data;
  },

  getGroupPendingPosts: async (groupId: number | string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/${groupId}/posts/pending`, { params: { page, size } });
    return res.data.data;
  },

  searchGroups: async (q: string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/search`, { params: { q, page, size } });
    return res.data.data;
  },

  getMyGroups: async (page = 0, size = 20) => {
    const res = await axiosClient.get(`/groups/my`, { params: { page, size } });
    return res.data.data;
  },
};
