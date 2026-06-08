import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, ShieldCheck, ArrowLeft, FileText, Component } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

export const AdminLayout: React.FC = () => {
  const { user } = useAuthStore();

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Người dùng', path: '/admin/users', icon: Users },
    { name: 'Bài viết', path: '/admin/posts', icon: FileText },
    { name: 'Hội nhóm', path: '/admin/groups', icon: Component },
    { name: 'Báo cáo', path: '/admin/reports', icon: AlertTriangle },
    { name: 'Nhật ký', path: '/admin/logs', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex text-gray-800 dark:text-gray-200">
      {/* Sidebar Admin — Desktop */}
      <aside className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-gray-200 dark:border-gray-700 gap-3">
          <ShieldCheck size={26} className="text-blue-600 flex-shrink-0" />
          <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
            Admin Panel
          </h1>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-0.5 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors text-sm ${isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors text-sm"
          >
            <ArrowLeft size={18} />
            Về trang chủ
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Mobile */}
        <header className="md:hidden h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-blue-600" />
            <h1 className="font-bold text-sm">Admin Panel</h1>
          </div>
          <NavLink to="/" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <ArrowLeft size={18} />
          </NavLink>
        </header>

        {/* Content Box */}
        <div className="flex-1 overflow-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>

        {/* Bottom Tab Bar — Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center h-16 z-50 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 px-3 py-1 transition-colors flex-1 min-w-[56px] ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <item.icon size={18} />
              <span className="text-[9px] font-medium leading-tight whitespace-nowrap">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </main>
    </div>
  );
};
