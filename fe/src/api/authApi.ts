import axiosClient from './axiosClient';
import type { AuthResponse } from '@/entities/user';

export const authApi = {
  login: async (credentials: any): Promise<AuthResponse> => {
    const res = await axiosClient.post('/auth/signin', credentials);
    return res.data.data;
  },

  register: async (userData: any): Promise<any> => {
    const res = await axiosClient.post('/auth/signup', userData);
    return res.data.data;
  },

  getCurrentUser: async (): Promise<any> => {
    const res = await axiosClient.get('/users/me');
    return res.data.data;
  }
};
