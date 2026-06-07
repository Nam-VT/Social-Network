import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Hook tự động đồng bộ thông tin user mới nhất từ /users/me khi app khởi động.
 * Đặt ở AppLayout để chạy sau khi đăng nhập, đảm bảo avatar/fullName luôn cập nhật.
 */
export const useAuthSync = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const updateUser = useAuthStore((state) => state.updateUser);
  const user = useAuthStore((state) => state.user);

  const { data: freshUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: authApi.getCurrentUser,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!freshUser) return;
    // Map dữ liệu từ UserProfileResponse về User entity
    const updated = {
      ...(user || {}),
      id: freshUser.id ?? user?.id,
      username: freshUser.username ?? user?.username,
      email: freshUser.email ?? user?.email,
      avatarUrl: freshUser.avatarUrl,
      fullName: freshUser.fullName,
      status: 'ONLINE' as const,
    };
    updateUser(updated as any);
  }, [freshUser]);
};
