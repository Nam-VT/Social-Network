import { NavLink } from 'react-router-dom';
import { Home, User, MessageSquare, Users, Bookmark, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/features/profile/api/profileApi';
import { chatApi } from '@/features/chat/api/chatApi';
import '@/styles/layout/sidebar.css';

export const Sidebar = () => {
  const user = useAuthStore(state => state.user);

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => profileApi.getPendingRequests(),
  });
  const pendingCount = (pendingRequests as any[]).length;

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: chatApi.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!user,
  });

  const MENU_ITEMS = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/profile', label: 'Trang cá nhân', icon: User },
    { path: '/friends', label: 'Bạn bè', icon: UserPlus, badge: pendingCount },
    { path: '/chat', label: 'Tin nhắn', icon: MessageSquare, badge: unreadMessages as number },
    { path: '/groups', label: 'Hội nhóm', icon: Users },
    { path: '/saved', label: 'Đã lưu', icon: Bookmark },
  ];

  return (
    <div className="sidebar-wrapper">
      <nav className="flex-1 space-y-1">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => 
                `sidebar-menu-item ${isActive ? 'active' : ''}`
              }
            >
            <div className="relative inline-flex">
                <Icon className="sidebar-icon" />
                {(item as any).badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {(item as any).badge > 9 ? '9+' : (item as any).badge}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-links">
          <a href="#">Quyền riêng tư</a>
          <a href="#">Điều khoản</a>
          <a href="#">Quảng cáo</a>
          <a href="#">Cookie</a>
        </div>
        <div className="mt-2">
          Antigravity Social © 2026
        </div>
      </div>
    </div>
  );
};
