import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Gắn Token vào Header
axiosClient.interceptors.request.use(
  (config: any) => {
    // Lấy token trực tiếp từ Zustand thay vì localStorage rời rạc
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý lỗi chung (401, 403, 500)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Dùng Zustand để logout toàn bộ state (đồng bộ với PublicRoute/PrivateRoute)
      useAuthStore.getState().logout();
      
      // Prevent infinite redirect loop
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
