import { useParams, Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';
import { postApi } from '@/features/newsfeed/api/postApi';
import { ProfileHeader } from '../components/ProfileHeader';
import { EditProfileModal } from '../components/EditProfileModal';
import { ProfileTabs, type TabKey } from '@/features/profile/components/ProfileTabs';
import { CreatePostBox } from '@/features/newsfeed/components/CreatePostBox';
import { PostItem, PostSkeleton } from '@/features/newsfeed/components/PostItem';
import { Loader2, User, Calendar, Heart } from 'lucide-react';
import '@/styles/profile/profile.css';
import { useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

export const ProfilePage = ({ defaultTab = 'posts' }: { defaultTab?: TabKey } = {}) => {
  const { username: usernameParam } = useParams<{ username: string }>();

  // Trường hợp 1: /profile (không param) → gọi /users/me → luôn là trang mình
  // Trường hợp 2: /profile/:username → gọi /users/:username → so sánh sau
  const isDirectOwnProfile = !usernameParam; // Truy cập /profile trực tiếp = trang mình

  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── Profile query: 2 strategies ─────────────────────────────────────────
  // Strategy A: /profile (no param) → call GET /users/me
  const myProfileQuery = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => profileApi.getMyProfile(),
    enabled: isDirectOwnProfile,
  });

  // Strategy B: /profile/:username → call GET /users/:username
  const otherProfileQuery = useQuery({
    queryKey: ['profile', usernameParam],
    queryFn: () => profileApi.getUserProfile(usernameParam!),
    enabled: !!usernameParam,
  });

  // Merge results
  const profile = isDirectOwnProfile ? myProfileQuery.data : otherProfileQuery.data;
  const isProfileLoading = isDirectOwnProfile ? myProfileQuery.isLoading : otherProfileQuery.isLoading;
  const isProfileError = isDirectOwnProfile ? myProfileQuery.isError : otherProfileQuery.isError;

  // Xác định isOwnProfile
  const isOwnProfile = isDirectOwnProfile || (!!profile && !!myProfileQuery.data && profile.username === myProfileQuery.data.username);

  // resolvedUsername: lấy trực tiếp từ params hoặc my profile query — KHÔNG phụ thuộc vào profile merge
  const resolvedUsername = usernameParam || myProfileQuery.data?.username;

  // ── Posts – useInfiniteQuery ───────────────────────────────────────────────
  const {
    data: postsData,
    isPending: isPostsPending,
    isLoading: isPostsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchPosts,
  } = useInfiniteQuery({
    queryKey: ['user-posts', resolvedUsername],
    queryFn: ({ pageParam = 0 }) => profileApi.getUserPosts(resolvedUsername!, pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage: any, allPages) => {
      // lastPage is now a Spring Page object: { content: [...], totalPages, last, ... }
      const content = lastPage?.content ?? [];
      const isLast = lastPage?.last ?? true;
      return (!isLast && content.length >= PAGE_SIZE) ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: !!resolvedUsername,
  });

  // Extract posts from Spring Page content
  const posts = postsData?.pages.flatMap((p: any) => p?.content ?? []) ?? [];

  // Show skeleton when: username not resolved yet, OR posts are fetching for first time
  const isPostsShowingLoader = !resolvedUsername || isPostsPending || isPostsLoading;

  // Scroll-to-top khi đổi profile
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resolvedUsername]);

  // ── Friends query (shown in Friends tab) ────────────────────────────────
  const { data: friendsData, isLoading: isFriendsLoading, isError: isFriendsError } = useQuery({
    queryKey: ['profile-friends', resolvedUsername],
    queryFn: () => profileApi.getUserFriends(resolvedUsername!),
    enabled: activeTab === 'friends' && !!resolvedUsername,
    retry: false, // Không retry khi lỗi privacy
  });

  // ── Saved posts query ───────────────────────────────────────────────────
  const {
    data: savedPostsData,
    isPending: isSavedPostsPending,
    isLoading: isSavedPostsLoading,
    isFetchingNextPage: isFetchingNextSavedPage,
    fetchNextPage: fetchNextSavedPage,
    hasNextPage: hasNextSavedPage,
  } = useInfiniteQuery({
    queryKey: ['saved-posts'],
    queryFn: ({ pageParam = 0 }) => postApi.getSavedPosts(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage: any, allPages) => {
      const content = lastPage?.content ?? [];
      const isLast = lastPage?.last ?? true;
      return (!isLast && content.length >= PAGE_SIZE) ? allPages.length : undefined;
    },
    initialPageParam: 0,
    enabled: activeTab === 'saved' && isOwnProfile,
  });

  const savedPosts = savedPostsData?.pages.flatMap((p: any) => p?.content ?? []) ?? [];
  const isSavedPostsShowingLoader = isSavedPostsPending || isSavedPostsLoading;

  // IntersectionObserver cho infinite scroll
  useEffect(() => {
    if (activeTab === 'posts') {
      if (!hasNextPage || isFetchingNextPage) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      const observer = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) fetchNextPage(); },
        { rootMargin: '200px' }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    } else if (activeTab === 'saved') {
      if (!hasNextSavedPage || isFetchingNextSavedPage) return;
      const sentinel = sentinelRef.current;
      if (!sentinel) return;
      const observer = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) fetchNextSavedPage(); },
        { rootMargin: '200px' }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, hasNextSavedPage, isFetchingNextSavedPage, fetchNextSavedPage, activeTab]);


  const handlePostCreated = () => refetchPosts();

  // ── Loading / Error ─────────────────────────────────────────────────────

  if (isProfileLoading) {
    return (
      <div className="w-full max-w-[940px] mx-auto pb-20 relative animate-pulse">
        {/* Cover Skeleton */}
        <div className="w-full h-[250px] sm:h-[350px] bg-slate-200 dark:bg-slate-800 rounded-b-xl"></div>
        
        {/* Profile Info Skeleton */}
        <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-4 relative -mt-16 sm:-mt-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 z-10">
            {/* Avatar Skeleton */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--color-bg-secondary)] bg-slate-300 dark:bg-slate-700"></div>
            
            {/* Name & Stats Skeleton */}
            <div className="text-center sm:text-left pb-2 space-y-2">
              <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded mx-auto sm:mx-0"></div>
            </div>
          </div>
          
          {/* Actions Skeleton */}
          <div className="pb-2 w-full sm:w-auto flex justify-center sm:justify-end">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="mt-8 px-4 flex gap-4 border-b border-[var(--color-border-light)] pb-2">
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (isProfileError || !profile) {
    return (
      <div className="w-full max-w-[900px] mx-auto p-8 text-center text-red-500 bg-red-50 rounded-xl mt-8">
        Không tìm thấy trang cá nhân.
      </div>
    );
  }

  // ── Render helpers ──────────────────────────────────────────────────────

  const renderPosts = () => (
    <div className="flex-1 flex flex-col gap-4">
      {isOwnProfile && <CreatePostBox onPostCreated={handlePostCreated} />}

      {isPostsShowingLoader ? (
        <>
          <PostSkeleton />
          <PostSkeleton />
        </>
      ) : posts.length === 0 ? (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-8 text-center text-[var(--color-text-secondary)]">
          Chưa có bài viết nào.
        </div>
      ) : (
        <>
          {posts.map((post: any) => (
            <PostItem key={post.id} post={post} />
          ))}
          {isFetchingNextPage && (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          )}
          {!hasNextPage && posts.length > 0 && (
            <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                <span>Đã xem hết bài viết 🎉</span>
                <div className="flex-1 h-px bg-[var(--color-border-light)]" />
              </div>
            </div>
          )}
          {hasNextPage && <div ref={sentinelRef} className="h-4" />}
        </>
      )}
    </div>
  );

  const renderAbout = () => (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-6 space-y-5">
      <h3 className="font-bold text-lg">Thông tin chi tiết</h3>

      {profile.bio && (
        <div className="pb-5 border-b border-[var(--color-border-light)]">
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed italic">"{profile.bio}"</p>
        </div>
      )}

      <ul className="space-y-4 text-sm text-[var(--color-text-primary)]">
        {profile.gender && (
          <li className="flex items-center gap-3">
            <User size={18} className="text-[var(--color-text-secondary)]" />
            <span>Giới tính: <strong>{profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}</strong></span>
          </li>
        )}
        {profile.birthDate && (
          <li className="flex items-center gap-3">
            <Calendar size={18} className="text-[var(--color-text-secondary)]" />
            <span>Ngày sinh: <strong>{new Intl.DateTimeFormat('vi-VN').format(new Date(profile.birthDate))}</strong></span>
          </li>
        )}
        {profile.relationshipStatus && (
          <li className="flex items-center gap-3">
            <Heart size={18} className="text-[var(--color-text-secondary)]" />
            <span>Tình trạng: <strong>{
              profile.relationshipStatus === 'SINGLE' ? 'Độc thân'
              : profile.relationshipStatus === 'IN_RELATIONSHIP' ? 'Đang hẹn hò'
              : profile.relationshipStatus === 'ENGAGED' ? 'Đã đính hôn'
              : profile.relationshipStatus === 'MARRIED' ? 'Đã kết hôn'
              : profile.relationshipStatus
            }</strong></span>
          </li>
        )}
      </ul>

      {!profile.bio && !profile.gender && !profile.birthDate && (
        <p className="text-sm text-[var(--color-text-secondary)] text-center py-4">
          Chưa có thông tin nào.
        </p>
      )}
    </div>
  );

  const renderFriends = () => {
    const friendsList = friendsData?.data?.content || [];

    if (isFriendsError) {
      return (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-10 text-center">
          <p className="text-[var(--color-text-secondary)] text-sm">🔒 Danh sách bạn bè của người này là riêng tư.</p>
        </div>
      );
    }

    return (
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Bạn bè</h3>
          <span className="text-sm text-[var(--color-text-secondary)]">{profile.friendCount || 0} người bạn</span>
        </div>
        
        {isFriendsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg bg-[var(--color-bg-elevated)] h-28" />
            ))}
          </div>
        ) : friendsList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {friendsList.map((friend: any) => (
              <Link 
                key={friend.userId} 
                to={`/profile/${friend.username}`}
                className="flex flex-col items-center p-4 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-primary)] hover:shadow-md transition-shadow group"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-[var(--color-border-light)] group-hover:border-[var(--color-accent)] transition-colors">
                  <img src={friend.avatarUrl || 'https://i.pravatar.cc/150'} alt={friend.fullName} className="w-full h-full object-cover" />
                </div>
                <div className="font-bold text-[var(--color-text-primary)] text-sm text-center truncate w-full">{friend.fullName}</div>
                <div className="text-[var(--color-text-secondary)] text-xs truncate w-full text-center">@{friend.username}</div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--color-text-secondary)] py-6">
            Chưa có bạn bè nào.
          </p>
        )}
      </div>
    );
  };

  const renderPhotos = () => {
    const allPhotos = posts
      .flatMap((p: any) => p.mediaList || [])
      .filter((m: any) => m.mediaType === 'IMAGE')
      .slice(0, 30);

    return (
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-6">
        <h3 className="font-bold text-lg mb-4">Ảnh</h3>
        {allPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
            {allPhotos.map((photo: any, idx: number) => (
              <div key={idx} className="aspect-square overflow-hidden rounded cursor-pointer group">
                <img
                  src={photo.mediaUrl}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-[var(--color-text-secondary)] py-6">
            Chưa có ảnh nào.
          </p>
        )}
      </div>
    );
  };

  // ── Main Render ─────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-[940px] mx-auto pb-20 relative">
      <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} onEditClick={() => setIsEditingProfile(true)} />
      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isOwnProfile={isOwnProfile} />

      <div className="mt-4 px-4 sm:px-0">
        {activeTab === 'posts' ? (
          <div className="flex flex-col gap-4">
            {/* Intro Card */}
            <div className="w-full">
              <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-5">
                <h3 className="font-bold text-base mb-3 text-[var(--color-text-primary)]">Giới thiệu</h3>

                {profile.bio ? (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 pb-4 border-b border-[var(--color-border-light)] italic leading-relaxed">
                    "{profile.bio}"
                  </p>
                ) : isOwnProfile ? (
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4 pb-4 border-b border-[var(--color-border-light)]">
                    Hãy thêm tiểu sử để mọi người biết thêm về bạn.
                  </p>
                ) : null}

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[var(--color-text-primary)]">
                  {profile.gender && (
                    <li className="flex items-center gap-2">
                      <User size={16} className="text-[var(--color-text-secondary)]" />
                      <span className="font-medium">Giới tính:</span> {profile.gender === 'MALE' ? 'Nam' : profile.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                    </li>
                  )}
                  {profile.birthDate && (
                    <li className="flex items-center gap-2">
                      <Calendar size={16} className="text-[var(--color-text-secondary)]" />
                      <span className="font-medium">Ngày sinh:</span> {new Intl.DateTimeFormat('vi-VN').format(new Date(profile.birthDate))}
                    </li>
                  )}
                  {profile.relationshipStatus && (
                    <li className="flex items-center gap-2">
                      <Heart size={16} className="text-[var(--color-text-secondary)]" />
                      <span className="font-medium">Tình trạng:</span> {
                        profile.relationshipStatus === 'SINGLE' ? 'Độc thân'
                        : profile.relationshipStatus === 'IN_RELATIONSHIP' ? 'Đang hẹn hò'
                        : profile.relationshipStatus === 'MARRIED' ? 'Đã kết hôn'
                        : profile.relationshipStatus
                      }
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Posts */}
            {renderPosts()}
          </div>
        ) : (
          <div className="w-full">
            {activeTab === 'about' && renderAbout()}
            {activeTab === 'friends' && renderFriends()}
            {activeTab === 'photos' && renderPhotos()}
            {activeTab === 'saved' && (
              <div className="flex-1 flex flex-col gap-4">
                {isSavedPostsShowingLoader ? (
                  <>
                    <PostSkeleton />
                    <PostSkeleton />
                  </>
                ) : savedPosts.length === 0 ? (
                  <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-sm border border-[var(--color-border-light)] p-8 text-center text-[var(--color-text-secondary)]">
                    Bạn chưa lưu bài viết nào.
                  </div>
                ) : (
                  <>
                    {savedPosts.map((sp: any) => (
                      <PostItem key={sp.post.id} post={{ ...sp.post, isSaved: true }} />
                    ))}
                    {isFetchingNextSavedPage && (
                      <>
                        <PostSkeleton />
                        <PostSkeleton />
                      </>
                    )}
                    {!hasNextSavedPage && savedPosts.length > 0 && (
                      <div className="py-4 text-center text-sm text-[var(--color-text-secondary)]">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                          <span>Đã xem hết bài viết đã lưu 🎉</span>
                          <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                        </div>
                      </div>
                    )}
                    {hasNextSavedPage && <div ref={sentinelRef} className="h-4" />}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isEditingProfile && (
        <EditProfileModal profile={profile} onClose={() => setIsEditingProfile(false)} />
      )}
    </div>
  );
};
