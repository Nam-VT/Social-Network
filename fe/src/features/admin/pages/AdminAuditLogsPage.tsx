import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { Clock, ShieldCheck } from 'lucide-react';
import { parseUTCDate } from '@/utils/parseUTCDate';

export const AdminAuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const size = 15;

  const { data: logsPage, isLoading } = useQuery({
    queryKey: ['admin', 'logs', page],
    queryFn: () => adminApi.getAuditLogs(page, size),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
        <ShieldCheck className="text-blue-500" />
        <h2 className="text-xl font-bold">Nhật ký Hệ thống (Audit Logs)</h2>
      </div>

      <div className="flex-1 overflow-auto p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Đang tải nhật ký...</div>
        ) : logsPage?.content.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Không có bản ghi nhật ký nào.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {logsPage?.content.map((log) => (
              <li key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex gap-4">
                <div className="mt-1 bg-blue-100 text-blue-600 p-2 rounded-full h-fit">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">@{log.adminUsername}</span>
                    <span className="text-sm font-semibold text-blue-600">{log.action}</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{log.details}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {parseUTCDate(log.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {logsPage && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
          <div>Trang {logsPage.number + 1} / {logsPage.totalPages}</div>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={logsPage.number === 0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >Trước</button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={logsPage.number >= logsPage.totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >Sau</button>
          </div>
        </div>
      )}
    </div>
  );
};
