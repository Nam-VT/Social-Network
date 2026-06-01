import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Component, AlertCircle } from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats()
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

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4">Hoạt động gần đây (Mock)</h3>
        <p className="text-gray-500">Khu vực này có thể gắn biểu đồ (Recharts) về số lượng bài viết hoặc đăng ký mới trong 7 ngày qua.</p>
      </div>
    </div>
  );
};
