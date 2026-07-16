import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { Trash2, Search, ChevronLeft, ChevronRight, Users, ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { Link } from 'react-router-dom';
import { parseUTCDate } from '@/utils/parseUTCDate';

export const AdminGroupsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const size = 15;
  const queryClient = useQueryClient();

  const { data: groupsPage, isLoading } = useQuery({
    queryKey: ['admin', 'groups', keyword, page],
    queryFn: () => adminApi.getAllGroups(keyword || undefined, page, size),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: number) => adminApi.deleteGroup(groupId),
    onSuccess: () => {
      toast.success('Đã xóa nhóm thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirmDelete(null);
    },
    onError: () => toast.error('Không thể xóa nhóm này'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(inputValue);
    setPage(0);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="text-purple-500" />
          <h2 className="text-xl font-bold">Quản lý Hội nhóm</h2>
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-72 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Tìm kiếm tên nhóm..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Tìm
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-4 font-medium">Nhóm</th>
              <th className="px-5 py-4 font-medium">Người tạo</th>
              <th className="px-5 py-4 font-medium">Thành viên</th>
              <th className="px-5 py-4 font-medium">Loại</th>
              <th className="px-5 py-4 font-medium">Ngày tạo</th>
              <th className="px-5 py-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : groupsPage?.content.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Không tìm thấy nhóm nào.</td></tr>
            ) : (
              groupsPage?.content.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 to-pink-500 flex-shrink-0">
                        {g.coverUrl && <img src={g.coverUrl} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">{g.name}</div>
                        {g.description && (
                          <div className="text-xs text-gray-500 line-clamp-1 max-w-[180px]">{g.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 dark:text-gray-400">@{g.creatorUsername}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Users size={14} /> {g.memberCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      g.privacy === 'PUBLIC' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {g.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {parseUTCDate(g.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/groups/${g.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Xem nhóm"
                        target="_blank"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(g.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa nhóm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {groupsPage && groupsPage.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
          <div>Trang {groupsPage.number + 1} / {groupsPage.totalPages} ({groupsPage.totalElements.toLocaleString()} nhóm)</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={groupsPage.number === 0}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={groupsPage.number >= groupsPage.totalPages - 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Xóa nhóm"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn nhóm này và toàn bộ dữ liệu liên quan? Hành động không thể hoàn tác."
        confirmLabel="Xóa nhóm"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => confirmDelete !== null && deleteMutation.mutate(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
