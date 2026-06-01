import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { postApi } from '../api/postApi';
import { PostItem, PostSkeleton } from '../components/PostItem';

/**
 * Trang chi tiết bài viết — hiển thị một post cụ thể theo ID.
 * Truy cập qua: /post/:id
 * Dùng để điều hướng từ thông báo (like, comment, share...).
 */
export const PostDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['post-detail', id],
    queryFn: () => postApi.getPostById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  return (
    <div className="max-w-[680px] mx-auto px-4 py-4">
      {/* Header back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] border border-[var(--color-border-light)] transition-colors"
          title="Quay lại"
        >
          <ArrowLeft size={18} className="text-[var(--color-text-primary)]" />
        </button>
        <div>
          <h1 className="font-bold text-lg text-[var(--color-text-primary)] leading-tight">Bài viết</h1>
          {post && (
            <p className="text-xs text-[var(--color-text-secondary)]">
              của{' '}
              <Link
                to={`/profile/${post.authorUsername}`}
                className="font-semibold hover:underline text-[var(--color-accent)]"
              >
                {post.authorFullName || post.authorUsername}
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && <PostSkeleton />}

      {/* Error */}
      {isError && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
          <AlertCircle size={40} className="text-red-400" />
          <h2 className="font-bold text-lg text-[var(--color-text-primary)]">
            Không tìm thấy bài viết
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Bài viết này có thể đã bị xóa hoặc không có quyền xem.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
          >
            Về trang chủ
          </button>
        </div>
      )}

      {/* Post */}
      {post && !isLoading && (
        <PostItem post={post} defaultShowComments />
      )}
    </div>
  );
};
