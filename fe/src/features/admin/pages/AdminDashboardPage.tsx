import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, FileText, Component, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { NavLink } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { parseUTCDate } from '@/utils/parseUTCDate';

// Hook count-up animation
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = React.useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    startRef.current = null;
    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

const StatCard = ({ title, value, icon: Icon, color, bg, isLoading }: any) => {
  const animated = useCountUp(isLoading ? 0 : value);
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between min-h-[112px]">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
        {isLoading ? (
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1" />
        ) : (
          <h3 className="text-3xl font-bold tabular-nums">{animated.toLocaleString()}</h3>
        )}
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isLoading ? 'bg-gray-100 dark:bg-gray-700' : bg} ${color}`}>
        <Icon size={24} className={isLoading ? 'text-gray-300 dark:text-gray-600' : ''} />
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC = () => {
  usePageTitle('Admin Dashboard');
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminApi.getStats()
  });

  const { data: recentLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin', 'recent-logs'],
    queryFn: () => adminApi.getAuditLogs(0, 8),
  });

  const statCards = [
    { title: 'Tổng Người Dùng', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Tổng Bài Viết', value: stats?.totalPosts ?? 0, icon: FileText, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Tổng Nhóm', value: stats?.totalGroups ?? 0, icon: Component, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Báo Cáo Chờ Duyệt', value: stats?.pendingReports ?? 0, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ];

  const logs = recentLogs?.content || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tổng quan hệ thống</h2>

      {/* Stat Cards — always render layout, skeleton inside each card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <StatCard key={idx} {...card} isLoading={isLoading} />
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

        {isLoadingLogs ? (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {[1,2,3,4,5].map(i => (
              <li key={i} className="px-6 py-4 flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </li>
            ))}
          </ul>
        ) : logs.length === 0 ? (
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
                  <p className="text-xs text-gray-400 mt-1">{parseUTCDate(log.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
