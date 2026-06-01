import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi, reportApi } from '../api/adminApi';
import { Trash2, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export const AdminReportsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const size = 10;
  const queryClient = useQueryClient();

  const { data: reportsPage, isLoading } = useQuery({
    queryKey: ['admin', 'reports', filterStatus, page],
    queryFn: () => reportApi.getReports(filterStatus === 'ALL' ? undefined : filterStatus, page, size),
    placeholderData: keepPreviousData,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: 'RESOLVED' | 'DISMISSED' }) => 
      reportApi.updateReportStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: number) => adminApi.deletePost(postId),
    onSuccess: (_, postId) => {
      alert(`Đã xóa bài viết ID: ${postId} thành công!`);
      // Sau khi xóa bài, tự động chuyển trạng thái báo cáo về RESOLVED (nếu muốn)
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
    },
  });

  const handleUpdateStatus = (id: number, status: 'RESOLVED' | 'DISMISSED') => {
    if (window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái thành ${status}?`)) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const handleDeletePost = (postId: number) => {
    if (window.confirm('CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn bài viết khỏi hệ thống. Tiếp tục?')) {
      deletePostMutation.mutate(postId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-red-500" />
          <h2 className="text-xl font-bold">Kiểm duyệt Báo cáo</h2>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
          {['PENDING', 'RESOLVED', 'DISMISSED', 'ALL'].map(status => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); setPage(0); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filterStatus === status 
                  ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600' 
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {status === 'ALL' ? 'Tất cả' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 font-medium">Người Báo cáo</th>
              <th className="px-6 py-4 font-medium">Nội dung / Lý do</th>
              <th className="px-6 py-4 font-medium">Đối tượng</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
              <th className="px-6 py-4 font-medium text-right">Xử lý</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Đang tải báo cáo...</td>
              </tr>
            ) : reportsPage?.content.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Không có báo cáo nào ở trạng thái này.</td>
              </tr>
            ) : (
              reportsPage?.content.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    @{r.reporterUsername}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-red-600 dark:text-red-400 mb-1">{r.reason}</div>
                    <div className="text-gray-500 max-w-xs truncate" title={r.description}>{r.description || 'Không có mô tả chi tiết'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                        {r.targetType} #{r.targetId}
                      </span>
                      {r.targetType === 'POST' && (
                        <button className="text-blue-500 text-xs flex items-center hover:underline w-fit">
                          Xem bài viết <ExternalLink size={12} className="ml-1" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                      r.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                      r.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'RESOLVED')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Đã xử lý (Hợp lệ)"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'DISMISSED')}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Bỏ qua (Báo cáo sai)"
                          >
                            <XCircle size={20} />
                          </button>
                        </>
                      )}
                      
                      {/* Luôn cho phép xóa bài viết nếu target là POST, phòng trường hợp admin muốn xóa luôn */}
                      {r.targetType === 'POST' && (
                        <button
                          onClick={() => handleDeletePost(r.targetId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2 border-l border-gray-200"
                          title="Xóa ngay bài viết này"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {reportsPage && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
          <div>Hiển thị trang {reportsPage.number + 1} / {reportsPage.totalPages}</div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={reportsPage.number === 0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Trước
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={reportsPage.number >= reportsPage.totalPages - 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
