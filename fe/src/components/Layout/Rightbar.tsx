import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchApi } from '@/api/searchApi';
import { profileApi } from '@/features/profile/api/profileApi';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { chatApi } from '@/features/chat/api/chatApi';
import '@/styles/layout/rightbar.css';

export const Rightbar = () => {
  const currentUser = useAuthStore((state) => state.user);
  const isOnline = usePresenceStore((state) => state.isOnline);
  const openChat = useFloatingChatStore((state) => state.openChat);

  const { data: trendingHashtags, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: () => searchApi.getTrendingHashtags(5),
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });

  // Fetch danh sách bạn bè thật từ API
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['profile-friends', currentUser?.username],
    queryFn: () => profileApi.getUserFriends(currentUser?.username || '', 0, 20),
    enabled: !!currentUser?.username,
    staleTime: 2 * 60 * 1000,
  });

  // Parse friends từ response (có thể là Page hoặc array)
  const friends = (friendsData?.data?.content || friendsData?.content || friendsData?.data || []) as Array<{
    id: number;
    username: string;
    fullName: string;
    avatarUrl?: string;
  }>;

  // Sắp xếp: online trước, offline sau
  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = isOnline(a.username) ? 1 : 0;
    const bOnline = isOnline(b.username) ? 1 : 0;
    return bOnline - aOnline;
  });

  // Mở floating chat khi click vào contact
  const handleContactClick = async (friendId: number) => {
    try {
      const room = await chatApi.getOrCreateDirectRoom(friendId);
      openChat(room.id);
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  return (
    <div className="rightbar-wrapper">
      
      {/* Khối Trending Hashtags */}
      <div className="rightbar-block">
        <h3 className="rightbar-block-title">Đang thịnh hành</h3>
        <div className="flex flex-col">
          {isLoadingTrending ? (
            <div className="flex justify-center py-4">
              <Loader2 size={24} className="animate-spin text-[var(--color-text-secondary)]" />
            </div>
          ) : Array.isArray(trendingHashtags) && trendingHashtags.length > 0 ? (
            trendingHashtags.map((item: any) => (
              <Link to={`/hashtag/${item.name}`} key={item.id} className="trending-item group">
                <span className="trending-hashtag group-hover:text-[var(--color-accent)] transition-colors">#{item.name}</span>
                <span className="trending-count">{item.postCount} bài viết</span>
              </Link>
            ))
          ) : (
            <div className="text-center text-sm text-[var(--color-text-secondary)] py-2">
              Chưa có xu hướng nào
            </div>
          )}
        </div>
      </div>

      <div className="border-t" style={{ borderColor: 'var(--color-border-light)' }}></div>

      {/* Khối Người liên hệ (Contacts) — Dữ liệu bạn bè thật */}
      <div className="rightbar-block">
        <div className="flex items-center justify-between px-2">
          <h3 className="rightbar-block-title !px-0">Người liên hệ</h3>
          <button className="p-1 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors">
            <Search size={16} />
          </button>
        </div>
        
        <div className="flex flex-col">
          {isLoadingFriends ? (
            <div className="flex justify-center py-4">
              <Loader2 size={20} className="animate-spin text-[var(--color-text-secondary)]" />
            </div>
          ) : sortedFriends.length > 0 ? (
            sortedFriends.map((friend) => (
              <div
                key={friend.id}
                className="contact-item cursor-pointer"
                onClick={() => handleContactClick(friend.id)}
              >
                <div className="contact-avatar-wrapper">
                  <img
                    src={friend.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${friend.fullName}`}
                    alt={friend.fullName}
                    className="contact-avatar"
                  />
                  <span
                    className={`contact-online-dot transition-colors duration-500 ${
                      isOnline(friend.username) ? '!bg-green-400' : '!bg-slate-300'
                    }`}
                  />
                </div>
                <span className="contact-name">{friend.fullName}</span>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-[var(--color-text-secondary)] py-4">
              Chưa có bạn bè nào
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
