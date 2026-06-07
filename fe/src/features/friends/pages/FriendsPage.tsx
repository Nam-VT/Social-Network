import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/features/profile/api/profileApi';
import {
  Users,
  UserPlus,
  SendHorizontal,
  Check,
  X,
  Loader2,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { useAuthStore } from '@/store/useAuthStore';

type Tab = 'received' | 'sent' | 'suggestions' | 'all';

const TAB_ITEMS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'received', label: 'Lời mời nhận', icon: Users },
  { key: 'sent', label: 'Đã gửi', icon: SendHorizontal },
  { key: 'suggestions', label: 'Gợi ý', icon: Sparkles },
  { key: 'all', label: 'Tất cả bạn bè', icon: UserCheck },
];

export const FriendsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // ===== Queries =====
  const { data: received = [], isLoading: loadingReceived } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => profileApi.getPendingRequests(),
  });

  const { data: sent = [], isLoading: loadingSent } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => profileApi.getSentRequests(),
    enabled: activeTab === 'sent',
  });

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: () => profileApi.getFriendSuggestions(),
    enabled: activeTab === 'suggestions',
  });

  const { data: allFriendsData, isLoading: loadingAll } = useQuery({
    queryKey: ['profile-friends', user?.username],
    queryFn: () => profileApi.getUserFriends(user!.username),
    enabled: activeTab === 'all' && !!user?.username,
  });

  const allFriends = allFriendsData?.data?.content || [];

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['profile-friends', user?.username] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  // ===== Mutations =====
  const acceptMutation = useMutation({
    mutationFn: (userId: number) => profileApi.acceptFriendRequest(userId),
    onSuccess: () => { invalidateAll(); toast.success('Đã chấp nhận lời mời kết bạn!'); },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => profileApi.rejectFriendRequest(userId),
    onSuccess: () => { invalidateAll(); toast.info('Đã từ chối lời mời kết bạn'); },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const cancelMutation = useMutation({
    mutationFn: (userId: number) => profileApi.cancelFriendRequest(userId),
    onSuccess: () => { invalidateAll(); toast.info('Đã hủy lời mời kết bạn'); },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId: number) => profileApi.sendFriendRequest(userId),
    onSuccess: () => { invalidateAll(); toast.success('Đã gửi lời mời kết bạn!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Có lỗi xảy ra'),
  });

  const unfriendMutation = useMutation({
    mutationFn: (userId: number) => profileApi.unfriend(userId),
    onSuccess: () => { invalidateAll(); toast.info('Đã hủy kết bạn'); },
    onError: () => toast.error('Có lỗi xảy ra'),
  });

  const pendingCount = (received as any[]).length;

  const renderEmpty = (msg: string, Icon: React.ElementType) => (
    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3 text-[var(--color-text-secondary)]">
      <Icon size={48} className="opacity-20" />
      <p className="text-sm">{msg}</p>
    </div>
  );

  const renderLoader = () => (
    <div className="col-span-full flex justify-center py-16">
      <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
    </div>
  );

  // ===== Card renderers =====
  const ReceivedCard = ({ req }: { req: any }) => (
    <div className="flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/profile/${req.username}`}>
        <img
          src={req.avatarUrl || `https://i.pravatar.cc/150?u=${req.id}`}
          alt={req.fullName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <Link
            to={`/profile/${req.username}`}
            className="font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] truncate block"
          >
            {req.fullName}
          </Link>
          {req.mutualFriendsCount > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {req.mutualFriendsCount} bạn chung
            </p>
          )}
        </div>
        <button
          onClick={() => acceptMutation.mutate(req.id)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          className="w-full bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <Check size={15} /> Chấp nhận
        </button>
        <button
          onClick={() => rejectMutation.mutate(req.id)}
          disabled={acceptMutation.isPending || rejectMutation.isPending}
          className="w-full bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 border border-[var(--color-border-light)]"
        >
          <X size={15} /> Xóa
        </button>
      </div>
    </div>
  );

  const SentCard = ({ req }: { req: any }) => (
    <div className="flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/profile/${req.username}`}>
        <img
          src={req.avatarUrl || `https://i.pravatar.cc/150?u=${req.id}`}
          alt={req.fullName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <Link
            to={`/profile/${req.username}`}
            className="font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] truncate block"
          >
            {req.fullName}
          </Link>
          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
            <SendHorizontal size={11} /> Đang chờ phản hồi
          </p>
        </div>
        <button
          onClick={() => cancelMutation.mutate(req.id)}
          disabled={cancelMutation.isPending}
          className="w-full bg-[var(--color-bg-elevated)] hover:bg-red-50 text-red-500 hover:text-red-600 border border-[var(--color-border-light)] hover:border-red-200 font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <X size={15} /> Hủy lời mời
        </button>
      </div>
    </div>
  );

  const SuggestionCard = ({ u }: { u: any }) => (
    <div className="flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/profile/${u.username}`}>
        <img
          src={u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`}
          alt={u.fullName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <Link
            to={`/profile/${u.username}`}
            className="font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] truncate block"
          >
            {u.fullName}
          </Link>
          {u.mutualFriendsCount > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {u.mutualFriendsCount} bạn chung
            </p>
          )}
        </div>
        <button
          onClick={() => addFriendMutation.mutate(u.id)}
          disabled={addFriendMutation.isPending}
          className="w-full bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <UserPlus size={15} /> Thêm bạn bè
        </button>
      </div>
    </div>
  );

  const FriendCard = ({ friend }: { friend: any }) => (
    <div className="flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-2xl overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/profile/${friend.username}`}>
        <img
          src={friend.avatarUrl || `https://i.pravatar.cc/150?u=${friend.userId}`}
          alt={friend.fullName}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </Link>
      <div className="p-3 flex flex-col gap-2">
        <div>
          <Link
            to={`/profile/${friend.username}`}
            className="font-bold text-sm text-[var(--color-text-primary)] hover:text-[var(--color-accent)] truncate block"
          >
            {friend.fullName}
          </Link>
          <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">@{friend.username}</p>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn hủy kết bạn?')) {
              unfriendMutation.mutate(friend.userId);
            }
          }}
          disabled={unfriendMutation.isPending}
          className="w-full bg-[var(--color-bg-elevated)] hover:bg-red-50 text-[var(--color-text-primary)] hover:text-red-600 border border-[var(--color-border-light)] hover:border-red-200 font-semibold py-2 rounded-xl text-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <UserCheck size={15} /> Bạn bè
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Bạn bè</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Quản lý lời mời kết bạn và danh sách bạn bè của bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-2xl p-2">
        {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-1 justify-center ${
              activeTab === key
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
            {key === 'received' && pendingCount > 0 && (
              <span className={`min-w-[20px] h-5 px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${
                activeTab === 'received' ? 'bg-white text-[var(--color-accent)]' : 'bg-red-500 text-white'
              }`}>
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* ===== TAB: Lời mời nhận ===== */}
        {activeTab === 'received' && (
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              {pendingCount > 0 ? `${pendingCount} lời mời kết bạn` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingReceived
                ? renderLoader()
                : (received as any[]).length > 0
                ? (received as any[]).map((req: any) => <ReceivedCard key={req.id} req={req} />)
                : renderEmpty('Không có lời mời kết bạn nào.', Users)}
            </div>
          </div>
        )}

        {/* ===== TAB: Đã gửi ===== */}
        {activeTab === 'sent' && (
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              {(sent as any[]).length > 0 ? `${(sent as any[]).length} lời mời đang chờ` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingSent
                ? renderLoader()
                : (sent as any[]).length > 0
                ? (sent as any[]).map((req: any) => <SentCard key={req.id} req={req} />)
                : renderEmpty('Bạn chưa gửi lời mời kết bạn nào.', SendHorizontal)}
            </div>
          </div>
        )}

        {/* ===== TAB: Gợi ý ===== */}
        {activeTab === 'suggestions' && (
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              Những người bạn có thể biết
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingSuggestions
                ? renderLoader()
                : (suggestions as any[]).length > 0
                ? (suggestions as any[]).map((u: any) => <SuggestionCard key={u.id} u={u} />)
                : renderEmpty('Không có gợi ý nào lúc này.', Sparkles)}
            </div>
          </div>
        )}

        {/* ===== TAB: Tất cả bạn bè ===== */}
        {activeTab === 'all' && (
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-secondary)] mb-4">
              {allFriends.length > 0 ? `${allFriends.length} người bạn` : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {loadingAll
                ? renderLoader()
                : allFriends.length > 0
                ? allFriends.map((f: any) => <FriendCard key={f.userId} friend={f} />)
                : renderEmpty('Bạn chưa có bạn bè nào.', UserCheck)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
