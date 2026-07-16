import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Luôn gửi Cookie kèm theo mọi request
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

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Xử lý lỗi chung (401, 403, 500)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Bắt lỗi 401 (hết hạn token) và tránh vòng lặp vô hạn
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Nếu có request khác đang gọi refresh token rồi, đưa các request sau vào hàng đợi
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh-token. Cookie refreshToken sẽ được trình duyệt tự động đính kèm
        // nhờ withCredentials: true. Không cần gửi trong body nữa.
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const rs = await axios.post(`${baseURL}/auth/refresh-token`, {}, {
          withCredentials: true, // Bắt buộc để trình duyệt gửi Cookie
        });

        const { token: newToken, user } = rs.data.data;
        
        // Cập nhật token mới vào store (refreshToken đã nằm trong Cookie rồi)
        useAuthStore.getState().setAuth(user, newToken);

        // Chạy lại tất cả các request đang xếp hàng
        processQueue(null, newToken);

        // Chạy lại request gốc vừa bị lỗi
        originalRequest.headers.Authorization = 'Bearer ' + newToken;
        return axiosClient(originalRequest);
      } catch (_error) {
        // Nếu chính refresh token cũng lỗi (ví dụ: đã quá 7 ngày) -> Văng ra bắt đăng nhập lại
        processQueue(_error, null);
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(_error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
