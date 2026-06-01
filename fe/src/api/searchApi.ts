import axiosClient from './axiosClient';

export interface SuggestItem {
  type: 'USER' | 'POST' | 'GROUP';
  id: number;
  text: string;
  subText: string;
  avatarUrl: string;
}

export const searchApi = {
  suggest: async (keyword: string): Promise<SuggestItem[]> => {
    const res = await axiosClient.get('/search/suggest', { params: { q: keyword } });
    // BE trả về ApiResponse<List<SuggestItem>> → res.data.data là list thật
    return res.data?.data ?? res.data;
  },

  searchUsers: async (keyword: string, page = 0, size = 20) => {
    const res = await axiosClient.get('/search/users', { params: { q: keyword, page, size } });
    // BE trả về ApiResponse<Page<UserProfileResponse>> → res.data.data là Page thật
    return res.data?.data ?? res.data;
  },

  searchPosts: async (keyword: string, page = 0, size = 20) => {
    const res = await axiosClient.get('/search/posts', { params: { q: keyword, page, size } });
    return res.data?.data ?? res.data;
  },

  searchGroups: async (keyword: string, page = 0, size = 20) => {
    const res = await axiosClient.get('/search/groups', { params: { q: keyword, page, size } });
    return res.data?.data ?? res.data;
  },

  getTrendingHashtags: async (limit = 10) => {
    const res = await axiosClient.get('/hashtags/trending', { params: { limit } });
    return res.data?.data ?? res.data;
  },

  getPostsByHashtag: async (tag: string, page = 0, size = 20) => {
    const res = await axiosClient.get(`/hashtags/${tag}/posts`, { params: { page, size } });
    return res.data?.data ?? res.data;
  }
};

