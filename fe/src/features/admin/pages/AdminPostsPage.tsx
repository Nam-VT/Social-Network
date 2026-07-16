import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { Trash2, Search, ChevronLeft, ChevronRight, ExternalLink, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { toast } from '@/components/ui/Toast';
import { Link } from 'react-router-dom';
import { parseUTCDate } from '@/utils/parseUTCDate';

export const AdminPostsPage: React.FC = () => {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const size = 15;
  const queryClient = useQueryClient();

  const { data: postsPage, isLoading } = useQuery({
    queryKey: ['admin', 'posts', keyword, page],
    queryFn: () => adminApi.getAllPosts(keyword || undefined, page, size),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: number) => adminApi.deletePost(postId),
    onSuccess: () => {
      toast.success('Đã xóa bài viết thành công');
      queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setConfirmDelete(null);
    },
    onError: () => toast.error('Không thể xóa bài viết này'),
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
          <FileText className="text-green-500" />
          <h2 className="text-xl font-bold">Quản lý Bài viết</h2>
        </div>
        <form onSubmit={handleSearch} className="relative w-full sm:w-72 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Tìm kiếm nội dung..."
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
              <th className="px-5 py-4 font-medium">ID</th>
              <th className="px-5 py-4 font-medium">Tác giả</th>
              <th className="px-5 py-4 font-medium">Nội dung</th>
              <th className="px-5 py-4 font-medium">Hiển thị</th>
              <th className="px-5 py-4 font-medium">Ngày đăng</th>
              <th className="px-5 py-4 font-medium text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : postsPage?.content.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-500">Không tìm thấy bài viết nào.</td></tr>
            ) : (
              postsPage?.content.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-5 py-4 text-gray-500">#{p.id}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {p.authorAvatarUrl ? (
                        <img src={p.authorAvatarUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{p.authorFullName}</div>
                        <div className="text-xs text-gray-500">@{p.authorUsername}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-2">{p.content || <span className="italic text-gray-400">Không có nội dung</span>}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.visibility === 'PUBLIC' ? 'bg-green-100 text-green-700' :
                      p.visibility === 'FRIENDS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {p.visibility}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 whitespace-nowrap">
                    {parseUTCDate(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/post/${p.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Xem bài viết"
                        target="_blank"
                      >
                        <ExternalLink size={16} />
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Xóa bài viết"
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
      {postsPage && postsPage.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500">
          <div>Trang {postsPage.number + 1} / {postsPage.totalPages} ({postsPage.totalElements.toLocaleString()} bài)</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={postsPage.number === 0}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={postsPage.number >= postsPage.totalPages - 1}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Xóa bài viết"
        message="Bạn có chắc chắn muốn xóa vĩnh viễn bài viết này? Hành động không thể hoàn tác."
        confirmLabel="Xóa ngay"
        variant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => confirmDelete !== null && deleteMutation.mutate(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
