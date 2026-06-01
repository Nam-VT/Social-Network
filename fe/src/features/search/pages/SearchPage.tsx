import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCircle, Users, FileText, Loader2 } from 'lucide-react';
import { searchApi } from '@/api/searchApi';
import { PostItem, PostSkeleton } from '@/features/newsfeed/components/PostItem';

type SearchTab = 'ALL' | 'USERS' | 'POSTS' | 'GROUPS';

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<SearchTab>('ALL');

  // Fetch Users
  const { data: usersData, isFetching: isFetchingUsers } = useQuery({
    queryKey: ['search-users', keyword],
    queryFn: () => searchApi.searchUsers(keyword, 0, 10),
    enabled: !!keyword && (activeTab === 'ALL' || activeTab === 'USERS'),
  });

  // Fetch Posts
  const { data: postsData, isFetching: isFetchingPosts } = useQuery({
    queryKey: ['search-posts', keyword],
    queryFn: () => searchApi.searchPosts(keyword, 0, 10),
    enabled: !!keyword && (activeTab === 'ALL' || activeTab === 'POSTS'),
  });

  // Fetch Groups
  const { data: groupsData, isFetching: isFetchingGroups } = useQuery({
    queryKey: ['search-groups', keyword],
    queryFn: () => searchApi.searchGroups(keyword, 0, 10),
    enabled: !!keyword && (activeTab === 'ALL' || activeTab === 'GROUPS'),
  });

  if (!keyword) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-secondary)]">
        <Search size={48} className="mb-4 opacity-50" />
        <h2 className="text-lg font-bold">Vui lòng nhập từ khoá tìm kiếm</h2>
      </div>
    );
  }

  const isFetchingAll = isFetchingUsers || isFetchingPosts || isFetchingGroups;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-bg-primary)] p-4 sm:p-6 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
        <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-4">
          Kết quả tìm kiếm cho "{keyword}"
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-border-light)] pb-2 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'ALL' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'USERS' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <UserCircle size={18} />
            Mọi người
          </button>
          <button
            onClick={() => setActiveTab('POSTS')}
            className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'POSTS' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <FileText size={18} />
            Bài viết
          </button>
          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`px-4 py-2 font-bold text-sm rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'GROUPS' ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <Users size={18} />
            Nhóm
          </button>
        </div>
      </div>

      {isFetchingAll && (
        <div className="flex justify-center p-8">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
        </div>
      )}

      {!isFetchingAll && (
        <div className="space-y-8">
          {/* USERS RESULT */}
          {(activeTab === 'ALL' || activeTab === 'USERS') && usersData?.content && usersData.content.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Mọi người</h2>
                {activeTab === 'ALL' && usersData.content.length > 3 && (
                  <button onClick={() => setActiveTab('USERS')} className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-sm border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)] overflow-hidden">
                {usersData.content.slice(0, activeTab === 'ALL' ? 3 : undefined).map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-hover)] transition">
                    <Link to={`/profile/${user.username}`} className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://i.pravatar.cc/150'}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover border border-[var(--color-border-light)]"
                      />
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">{user.fullName || user.username}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)]">@{user.username}</p>
                      </div>
                    </Link>
                    <Link to={`/profile/${user.username}`} className="px-4 py-1.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold text-xs rounded-lg transition">
                      Xem trang cá nhân
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GROUPS RESULT */}
          {(activeTab === 'ALL' || activeTab === 'GROUPS') && groupsData?.content && groupsData.content.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Nhóm</h2>
                {activeTab === 'ALL' && groupsData.content.length > 3 && (
                  <button onClick={() => setActiveTab('GROUPS')} className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-sm border border-[var(--color-border-light)] divide-y divide-[var(--color-border-light)] overflow-hidden">
                {groupsData.content.slice(0, activeTab === 'ALL' ? 3 : undefined).map((group: any) => (
                  <div key={group.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg-hover)] transition">
                    <Link to={`/groups/${group.id}`} className="flex items-center gap-3">
                      <img
                        src={group.coverPhotoUrl || 'https://placehold.co/150x150?text=Group'}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-[var(--color-border-light)]"
                      />
                      <div>
                        <h4 className="font-bold text-[var(--color-text-primary)]">{group.name}</h4>
                        <p className="text-xs text-[var(--color-text-secondary)]">{group.memberCount} thành viên • {group.privacy}</p>
                        {group.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1 mt-1">{group.description}</p>
                        )}
                      </div>
                    </Link>
                    <Link to={`/groups/${group.id}`} className="px-4 py-1.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold text-xs rounded-lg transition">
                      Tham gia
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* POSTS RESULT */}
          {(activeTab === 'ALL' || activeTab === 'POSTS') && postsData?.content && postsData.content.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Bài viết</h2>
                {activeTab === 'ALL' && postsData.content.length > 3 && (
                  <button onClick={() => setActiveTab('POSTS')} className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {postsData.content.slice(0, activeTab === 'ALL' ? 3 : undefined).map((post: any) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isFetchingAll && 
           (!usersData?.content?.length) && 
           (!postsData?.content?.length) && 
           (!groupsData?.content?.length) && (
            <div className="bg-[var(--color-bg-primary)] p-8 rounded-2xl border border-[var(--color-border-light)] flex flex-col items-center justify-center text-center">
              <Search size={48} className="text-[var(--color-text-secondary)] opacity-50 mb-4" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Không tìm thấy kết quả</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Chúng tôi không tìm thấy kết quả nào cho "{keyword}". Vui lòng thử lại với từ khoá khác.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
