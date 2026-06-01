import { useParams } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Loader2, Hash } from 'lucide-react';
import { searchApi } from '@/api/searchApi';
import { PostItem, PostSkeleton } from '@/features/newsfeed/components/PostItem';

export const HashtagPage = () => {
  const { tag } = useParams();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['hashtag-posts', tag],
    queryFn: ({ pageParam = 0 }) => searchApi.getPostsByHashtag(tag || '', pageParam, 10),
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = allPages.length;
      return lastPage.content.length === 10 ? nextPage : undefined;
    },
    enabled: !!tag,
    initialPageParam: 0,
  });

  const posts = data?.pages.flatMap((page) => page.content) || [];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Hashtag Header */}
      <div className="bg-[var(--color-bg-primary)] p-6 sm:p-8 rounded-2xl shadow-sm border border-[var(--color-border-light)] flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
          <Hash size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">#{tag}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Các bài viết có chứa thẻ này</p>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length > 0 ? (
          posts.map((post: any) => (
            <PostItem key={post.id} post={post} />
          ))
        ) : (
          <div className="bg-[var(--color-bg-primary)] p-8 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center text-center">
            <Hash size={48} className="text-[var(--color-text-secondary)] opacity-50 mb-4" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Chưa có bài viết nào</h3>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Hãy là người đầu tiên đăng bài viết với hashtag #{tag}
            </p>
          </div>
        )}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold text-sm rounded-full hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Đang tải...
              </>
            ) : (
              'Xem thêm bài viết'
            )}
          </button>
        </div>
      )}
    </div>
  );
};
