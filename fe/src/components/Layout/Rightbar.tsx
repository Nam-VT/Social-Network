import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { searchApi } from '@/api/searchApi';
import '@/styles/layout/rightbar.css';

const ONLINE_FRIENDS = [
  { id: 1, name: 'Nguyễn Văn A', avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: 2, name: 'Trần Thị B', avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: 3, name: 'Lê Hoàng C', avatar: 'https://i.pravatar.cc/150?u=3' },
  { id: 4, name: 'Phạm Minh D', avatar: 'https://i.pravatar.cc/150?u=4' },
];

export const Rightbar = () => {
  const { data: trendingHashtags, isLoading: isLoadingTrending } = useQuery({
    queryKey: ['trending-hashtags'],
    queryFn: () => searchApi.getTrendingHashtags(5),
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  });
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
          ) : trendingHashtags && trendingHashtags.length > 0 ? (
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

      {/* Khối Người liên hệ (Contacts) */}
      <div className="rightbar-block">
        <div className="flex items-center justify-between px-2">
          <h3 className="rightbar-block-title !px-0">Người liên hệ</h3>
          <button className="p-1 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors">
            <Search size={16} />
          </button>
        </div>
        
        <div className="flex flex-col">
          {ONLINE_FRIENDS.map((friend) => (
            <div key={friend.id} className="contact-item">
              <div className="contact-avatar-wrapper">
                <img src={friend.avatar} alt={friend.name} className="contact-avatar" />
                <span className="contact-online-dot"></span>
              </div>
              <span className="contact-name">{friend.name}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
