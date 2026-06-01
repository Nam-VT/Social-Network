import axiosClient from '@/api/axiosClient';
import type { SystemStats, UserAdminResponse, ReportResponse, AuditLog, PageResponse } from '../types';

export const adminApi = {
  // Thống kê
  getStats: async (): Promise<SystemStats> => {
    const res = await axiosClient.get('/admin/stats');
    return res.data.data;
  },

  // Quản lý Users
  getUsers: async (page = 0, size = 20): Promise<PageResponse<UserAdminResponse>> => {
    const res = await axiosClient.get('/admin/users', { params: { page, size } });
    return res.data.data;
  },

  banUser: async (userId: number): Promise<void> => {
    const res = await axiosClient.put(`/admin/users/${userId}/ban`);
    return res.data.data;
  },

  unbanUser: async (userId: number): Promise<void> => {
    const res = await axiosClient.put(`/admin/users/${userId}/unban`);
    return res.data.data;
  },

  // Xóa nóng bài viết
  deletePost: async (postId: number): Promise<void> => {
    const res = await axiosClient.delete(`/admin/posts/${postId}`);
    return res.data.data;
  },

  // Lịch sử Audit Logs
  getAuditLogs: async (page = 0, size = 20): Promise<PageResponse<AuditLog>> => {
    const res = await axiosClient.get('/admin/audit-logs', { params: { page, size } });
    return res.data.data;
  },
};

export const reportApi = {
  // Dành cho User tạo báo cáo
  createReport: async (payload: { targetId: number; targetType: string; reason: string; description?: string }) => {
    const res = await axiosClient.post('/reports', payload);
    return res.data.data;
  },

  // Dành cho Admin lấy báo cáo
  getReports: async (status?: string, page = 0, size = 20): Promise<PageResponse<ReportResponse>> => {
    const res = await axiosClient.get('/reports', { params: { status, page, size } });
    return res.data.data;
  },

  // Admin cập nhật báo cáo
  updateReportStatus: async (reportId: number, status: 'RESOLVED' | 'DISMISSED'): Promise<void> => {
    const res = await axiosClient.put(`/reports/${reportId}`, { status });
    return res.data.data;
  }
};
