import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import axiosClient from '@/api/axiosClient';

/**
 * Trang callback sau khi đăng nhập Google OAuth2 thành công.
 * Backend redirect về đây kèm token trong URL params.
 * Trang này sẽ lưu token vào AuthStore rồi chuyển về trang chủ.
 */
export const OAuth2CallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    // Lưu token trước để có thể gọi API
    localStorage.setItem('token', token);

    // Gọi API lấy thông tin user từ token. Phải truyền header tường minh vì lúc này 
    // Zustand store chưa có token (interceptor sẽ không tự gắn được).
    axiosClient
      .get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        const user = res.data.data;
        setAuth(user, token);
        navigate('/', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--color-text-secondary)] font-medium">
          Đang xử lý đăng nhập Google...
        </p>
      </div>
    </div>
  );
};
