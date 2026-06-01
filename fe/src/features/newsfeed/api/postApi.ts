import axiosClient from '@/api/axiosClient';

export interface CreatePostPayload {
  content: string;
  visibility: string;
  groupId?: number | null;
  mediaList?: { mediaUrl: string; mediaType: string }[];
}

export interface ReactionPayload {
  targetId: number | string;
  targetType: 'POST' | 'COMMENT';
  reactionType: string; // 'LIKE', 'LOVE', etc.
}

export interface CommentPayload {
  postId: number | string;
  content: string;
  parentId?: number | string | null;
  mediaUrl?: string;
}

export const uploadApi = {
  uploadMultiple: async (files: File[], folder: string = 'posts') => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('folder', folder);
    
    const res = await axiosClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return res.data.data; // List<String> URLs
  }
};

export const postApi = {
  getNewsFeed: async (cursor: string | null = null) => {
    // BE expects LocalDateTime format: 2026-05-11T15:00:00 (no Z, no ms)
    const formattedCursor = cursor
      ? cursor.replace('Z', '').split('.')[0]
      : undefined;
    const res = await axiosClient.get('/posts/feed', {
      params: { cursor: formattedCursor, size: 10 }
    });
    return res.data;
  },

  getPostById: async (postId: number | string) => {
    const res = await axiosClient.get(`/posts/${postId}`);
    return res.data.data; // PostResponse
  },

  createPost: async (payload: CreatePostPayload) => {
    const res = await axiosClient.post('/posts', payload);
    return res.data;
  },
  updatePost: async (postId: number | string, payload: { content?: string; visibility?: string }) => {
    const res = await axiosClient.put(`/posts/${postId}`, payload);
    return res.data;
  },
  deletePost: async (postId: number | string) => {
    const res = await axiosClient.delete(`/posts/${postId}`);
    return res.data;
  },
  toggleReaction: async (payload: { targetId: number | string; targetType: string; reactionType: string }) => {
    const res = await axiosClient.post('/reactions', payload);
    return res.data;
  },
  getComments: async (postId: number | string, page = 0, size = 10) => {
    const res = await axiosClient.get(`/posts/${postId}/comments`, { params: { page, size } });
    return res.data;
  },
  createComment: async (payload: { postId: number | string; content: string; parentId?: number | string; mediaUrl?: string }) => {
    const res = await axiosClient.post('/comments', payload);
    return res.data;
  },
  updateComment: async (payload: { postId: number | string; commentId: number | string; content: string; mediaUrl?: string }) => {
    const res = await axiosClient.put(`/posts/${payload.postId}/comments/${payload.commentId}`, { 
      content: payload.content,
      mediaUrl: payload.mediaUrl 
    });
    return res.data;
  },
  deleteComment: async (postId: number | string, commentId: number | string) => {
    const res = await axiosClient.delete(`/posts/${postId}/comments/${commentId}`);
    return res.data;
  },
  getCommentReplies: async (commentId: number | string, page = 0, size = 5) => {
    const res = await axiosClient.get(`/comments/${commentId}/replies`, { params: { page, size } });
    return res.data;
  },

  // Feature #6: Share Post
  sharePost: async (postId: number | string, content?: string) => {
    const res = await axiosClient.post(`/posts/${postId}/share`, { content });
    return res.data;
  },

  // Feature #4: Search Users for Mentions
  searchUsers: async (keyword: string, size = 8) => {
    const res = await axiosClient.get('/search/users', { params: { q: keyword, page: 0, size } });
    return res.data;
  },

  // Feature #9: Save/Bookmark Post
  savePost: async (postId: number | string) => {
    const res = await axiosClient.post(`/posts/${postId}/save`);
    return res.data;
  },
  unsavePost: async (postId: number | string) => {
    const res = await axiosClient.delete(`/posts/${postId}/save`);
    return res.data;
  },
  getSavedPosts: async (page = 0, size = 10) => {
    const res = await axiosClient.get(`/posts/saved`, { params: { page, size } });
    return res.data.data; // Spring Page
  },
};


