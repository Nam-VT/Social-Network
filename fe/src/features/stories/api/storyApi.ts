import axiosClient from '../../../api/axiosClient';
import type { StoryCreateRequest, StoryGroupResponse, StoryReplyRequest, StoryResponse } from '../types';

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

export const storyApi = {
  // Đăng story mới
  createStory: (data: StoryCreateRequest): Promise<ApiResponse<null>> => {
    return axiosClient.post('/stories', data);
  },

  // Lấy feed story của bạn bè (và của mình)
  getActiveStories: (): Promise<ApiResponse<StoryGroupResponse[]>> => {
    return axiosClient.get('/stories/active');
  },

  // Lấy danh sách story của chính mình (chỉ những cái còn active)
  getMyStories: (): Promise<ApiResponse<StoryResponse[]>> => {
    return axiosClient.get('/stories/me');
  },

  // Đánh dấu đã xem
  viewStory: (storyId: number): Promise<ApiResponse<null>> => {
    return axiosClient.post(`/stories/${storyId}/view`);
  },

  // Thả reaction
  reactToStory: (storyId: number, type: string): Promise<ApiResponse<null>> => {
    return axiosClient.post(`/stories/${storyId}/react`, null, { params: { type } });
  },

  // Trả lời story
  replyToStory: (storyId: number, data: StoryReplyRequest): Promise<ApiResponse<null>> => {
    return axiosClient.post(`/stories/${storyId}/reply`, data);
  },

  // Xóa story
  deleteStory: (storyId: number): Promise<ApiResponse<null>> => {
    return axiosClient.delete(`/stories/${storyId}`);
  },

  // Lưu trữ (Archive) story
  archiveStory: (storyId: number, visibility: string = 'PUBLIC'): Promise<ApiResponse<null>> => {
    return axiosClient.post(`/stories/${storyId}/archive`, null, { params: { visibility } });
  },

  // Bỏ lưu trữ
  unarchiveStory: (storyId: number): Promise<ApiResponse<null>> => {
    return axiosClient.delete(`/stories/${storyId}/archive`);
  },

  // Xem kho lưu trữ của user (Highlights)
  getArchivedStories: (username: string): Promise<ApiResponse<StoryResponse[]>> => {
    return axiosClient.get(`/stories/archive/${username}`);
  },
};
