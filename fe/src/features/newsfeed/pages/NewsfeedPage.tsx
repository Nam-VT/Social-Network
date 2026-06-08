import { useEffect, useRef, useCallback, useState } from 'react';
import { CreatePostBox } from '../components/CreatePostBox';
import { PostItem, PostSkeleton } from '../components/PostItem';
import { postApi } from '../api/postApi';
import { StoryBar } from '../../stories/components/StoryBar';
import { usePageTitle } from '@/hooks/usePageTitle';

// Infinite scroll dùng cursor-based pagination.
// BE trả về List<PostResponse> theo cursor (ISO datetime của bài cuối cùng).
// Nếu trả về ít hơn size → đã hết bài.

const PAGE_SIZE = 10;

export const NewsfeedPage = () => {
  usePageTitle('Trang chủ');
  const [posts, setPosts] = useState<any[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);   // initial load
  const [isFetching, setIsFetching] = useState(false); // load-more
  const [hasMore, setHasMore] = useState(true);
  const [isError, setIsError] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Fetch a page of posts
  const fetchPosts = useCallback(async (currentCursor: string | null, replace = false) => {
    try {
      if (replace) {
        setIsLoading(true);
        setIsError(false);
      } else {
        setIsFetching(true);
      }

      const res = await postApi.getNewsFeed(currentCursor);
      const newPosts: any[] = res?.data || [];

      if (replace) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => {
          // De-duplicate by id
          const existingIds = new Set(prev.map((p) => p.id));
          return [...prev, ...newPosts.filter((p) => !existingIds.has(p.id))];
        });
      }

      // If fewer than PAGE_SIZE → no more posts
      setHasMore(newPosts.length >= PAGE_SIZE);

      // Cursor = createdAt of last post (ISO string)
      if (newPosts.length > 0) {
        setCursor(newPosts[newPosts.length - 1].createdAt);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchPosts(null, true);
  }, [fetchPosts]);

  // IntersectionObserver — watch sentinel at bottom
  useEffect(() => {
    if (!hasMore || isFetching || isLoading) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchPosts(cursor);
        }
      },
      { rootMargin: '200px' } // Trigger 200px before sentinel is visible
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetching, isLoading, cursor, fetchPosts]);

  const handlePostCreated = useCallback(() => {
    // Refresh từ đầu sau khi đăng bài mới
    setCursor(null);
    setHasMore(true);
    fetchPosts(null, true);
  }, [fetchPosts]);

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <StoryBar />
      <CreatePostBox onPostCreated={handlePostCreated} />

      <div className="mt-4 flex flex-col gap-2">
        {/* Initial skeleton loading */}
        {isLoading && (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <div className="p-4 text-center text-red-500 bg-red-50 rounded-xl">
            Có lỗi xảy ra khi tải bảng tin.{' '}
            <button
              className="underline font-medium hover:text-red-700"
              onClick={() => fetchPosts(null, true)}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && posts.length === 0 && (
          <div className="p-8 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-light)]">
            Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!
          </div>
        )}

        {/* Post list */}
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}

        {/* Load-more skeleton (bottom) */}
        {isFetching && (
          <>
            <PostSkeleton />
            <PostSkeleton />
          </>
        )}

        {/* End-of-feed indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="py-6 text-center text-sm text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[var(--color-border-light)]" />
              <span>Bạn đã xem hết bài viết 🎉</span>
              <div className="flex-1 h-px bg-[var(--color-border-light)]" />
            </div>
          </div>
        )}

        {/* Sentinel - IntersectionObserver target */}
        {hasMore && <div ref={sentinelRef} className="h-4" />}
      </div>
    </div>
  );
};
