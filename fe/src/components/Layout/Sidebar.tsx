import { NavLink } from 'react-router-dom';
import { Home, User, MessageSquare, Users, Bookmark } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import '@/styles/layout/sidebar.css';

export const Sidebar = () => {
  const user = useAuthStore(state => state.user);

  const MENU_ITEMS = [
    { path: '/', label: 'Trang chủ', icon: Home },
    { path: '/profile', label: 'Trang cá nhân', icon: User },
    { path: '/chat', label: 'Tin nhắn', icon: MessageSquare },
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
              className={({ isActive }) => 
                `sidebar-menu-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-divider"></div>

      {/* Footer links placeholder */}
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
