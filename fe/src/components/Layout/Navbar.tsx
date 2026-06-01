import { Link } from 'react-router-dom';
import { Moon, Sun, Menu, UserCircle } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { NavbarChatDropdown } from './NavbarChatDropdown';
import { NavbarFriendsDropdown } from './NavbarFriendsDropdown';
import { NavbarNotificationDropdown } from './NavbarNotificationDropdown';
import { NavbarSearch } from './NavbarSearch';
import '@/styles/layout/navbar.css';

export const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  return (
    <nav className="navbar-wrapper">
      {/* Left side: Logo & Search */}
      <div className="navbar-left">
        <Link to="/" className="flex items-center gap-2">
          <span className="navbar-logo-text">
            Social Network
          </span>
        </Link>

        <NavbarSearch />
      </div>

      {/* Center: Mobile Menu Toggle */}
      <div className="navbar-center-mobile">
        <button className="navbar-icon-btn" onClick={toggleMobileMenu} aria-label="Mở menu">
          <Menu size={24} />
        </button>
      </div>

      {/* Right side: Actions & User */}
      <div className="navbar-right">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="navbar-icon-btn"
          aria-label="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Messages Dropdown */}
        <NavbarChatDropdown />

        {/* Friends Dropdown */}
        <NavbarFriendsDropdown />

        {/* Notifications */}
        <NavbarNotificationDropdown />

        {/* User Menu / Avatar */}
        <div className="relative group ml-2">
          <button className="flex items-center gap-2 outline-none">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-light)]" />
            ) : (
              <UserCircle size={40} style={{ color: 'var(--color-text-secondary)' }} />
            )}
          </button>

          <div className="navbar-user-dropdown-menu">
            <Link to={`/profile/${user?.username}`} className="navbar-user-name block hover:underline">
              {user?.fullName || user?.username || 'Người dùng'}
            </Link>
            <Link to="/settings" className="navbar-dropdown-link">
              Cài đặt & Quyền riêng tư
            </Link>
            {user?.role === 'ADMIN' && (
              <Link to="/admin" className="navbar-dropdown-link font-bold text-blue-600 dark:text-blue-400">
                Quản trị hệ thống (Admin)
              </Link>
            )}
            <button
              onClick={logout}
              className="navbar-dropdown-logout"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
