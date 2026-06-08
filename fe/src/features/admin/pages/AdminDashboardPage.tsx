import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Component, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { NavLink } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats()
  });

  const { data: recentLogs } = useQuery({
    queryKey: ['admin', 'recent-logs'],
    queryFn: () => adminApi.getAuditLogs(0, 8),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse h-32"></div>
        ))}
      </div>
    );
  }

  if (isError || !stats) {
    return <div className="text-red-500">Lỗi khi tải dữ liệu thống kê.</div>;
  }

  const statCards = [
    { title: 'Tổng Người Dùng', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Tổng Bài Viết', value: stats.totalPosts, icon: FileText, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Tổng Nhóm', value: stats.totalGroups, icon: Component, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Báo Cáo Chờ Duyệt', value: stats.pendingReports, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  const logs = recentLogs?.content || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tổng quan hệ thống</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{card.title}</p>
              <h3 className="text-3xl font-bold">{card.value.toLocaleString()}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity — Real Audit Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            Hoạt động gần đây
          </h3>
          <NavLink
            to="/admin/logs"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight size={14} />
          </NavLink>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Chưa có hoạt động nào được ghi nhận.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((log: any) => (
              <li key={log.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="mt-0.5 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">@{log.adminUsername}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600">{log.action}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 truncate">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
