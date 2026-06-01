import { useState, useRef, useEffect } from 'react';
import { Users, Check, X, UserPlus, Loader2, SendHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/features/profile/api/profileApi';

type Tab = 'received' | 'sent';

export const NavbarFriendsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('received');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== Queries =====
  const { data: receivedRequests = [], isLoading: isLoadingReceived } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => profileApi.getPendingRequests(),
  });

  const { data: sentRequests = [], isLoading: isLoadingSent } = useQuery({
    queryKey: ['friend-requests-sent'],
    queryFn: () => profileApi.getSentRequests(),
    enabled: isOpen,
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ['friend-suggestions'],
    queryFn: () => profileApi.getFriendSuggestions(),
    enabled: isOpen,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: ['friend-requests-sent'] });
    queryClient.invalidateQueries({ queryKey: ['friend-suggestions'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  // ===== Mutations =====
  const acceptMutation = useMutation({
    mutationFn: (userId: number) => profileApi.acceptFriendRequest(userId),
    onSuccess: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: number) => profileApi.rejectFriendRequest(userId),
    onSuccess: invalidateAll,
  });

  const cancelMutation = useMutation({
    mutationFn: (userId: number) => profileApi.cancelFriendRequest(userId),
    onSuccess: invalidateAll,
  });

  const addFriendMutation = useMutation({
    mutationFn: (userId: number) => profileApi.sendFriendRequest(userId),
    onSuccess: invalidateAll,
  });

  const pendingCount = receivedRequests?.length || 0;
  const sentCount = sentRequests?.length || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`navbar-icon-btn ${isOpen ? 'active' : ''} relative`}
        onClick={() => setIsOpen(!isOpen)}
        title="Lời mời kết bạn"
      >
        <Users size={20} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-[-60px] sm:right-0 w-[380px] max-h-[85vh] bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-2 border-b border-[var(--color-border-light)]">
            <h3 className="font-bold text-[var(--color-text-primary)] text-lg mb-3">Bạn bè</h3>

            {/* Tabs */}
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('received')}
                className={`relative flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'received'
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                Lời mời nhận
                {pendingCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`relative flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === 'sent'
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                Đã gửi
                {sentCount > 0 && (
                  <span className="ml-1.5 text-[10px] bg-slate-400 text-white rounded-full px-1.5 py-0.5">
                    {sentCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {/* ===== TAB: Lời mời nhận ===== */}
            {activeTab === 'received' && (
              <>
                {isLoadingReceived ? (
                  <div className="p-4 text-center flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                    <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
                    <span>Đang tải...</span>
                  </div>
                ) : receivedRequests.length > 0 ? (
                  <>
                    <p className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      {receivedRequests.length} lời mời kết bạn
                    </p>
                    {receivedRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-2 hover:bg-[var(--color-bg-hover)] rounded-xl transition"
                      >
                        <Link to={`/profile/${req.username}`} onClick={() => setIsOpen(false)} className="flex-none">
                          <img
                            src={req.avatarUrl || `https://i.pravatar.cc/150?u=${req.id}`}
                            className="w-14 h-14 rounded-full object-cover border border-[var(--color-border-light)]"
                            alt={req.fullName}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${req.username}`}
                            onClick={() => setIsOpen(false)}
                            className="font-semibold text-sm text-[var(--color-text-primary)] hover:underline truncate block"
                          >
                            {req.fullName}
                          </Link>
                          {req.mutualFriendsCount > 0 && (
                            <p className="text-xs text-[var(--color-text-secondary)]">
                              {req.mutualFriendsCount} bạn chung
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => acceptMutation.mutate(req.id)}
                              disabled={acceptMutation.isPending || rejectMutation.isPending}
                              className="flex-1 bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold py-1.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              <Check size={15} /> Chấp nhận
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(req.id)}
                              disabled={acceptMutation.isPending || rejectMutation.isPending}
                              className="flex-1 bg-[var(--color-bg-primary)] hover:bg-slate-200 text-[var(--color-text-primary)] font-semibold py-1.5 rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-1 border border-[var(--color-border-light)]"
                            >
                              <X size={15} /> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                    <Users size={36} className="opacity-20" />
                    <p className="text-sm">Không có lời mời kết bạn nào.</p>
                  </div>
                )}

                {/* Gợi ý kết bạn */}
                {suggestions.length > 0 && (
                  <div className="border-t border-[var(--color-border-light)] pt-3 mt-2">
                    <p className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Những người bạn có thể biết
                    </p>
                    {suggestions.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 hover:bg-[var(--color-bg-hover)] rounded-xl transition"
                      >
                        <Link to={`/profile/${user.username}`} onClick={() => setIsOpen(false)} className="flex-none">
                          <img
                            src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                            className="w-12 h-12 rounded-full object-cover border border-[var(--color-border-light)]"
                            alt={user.fullName}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${user.username}`}
                            onClick={() => setIsOpen(false)}
                            className="font-semibold text-sm text-[var(--color-text-primary)] hover:underline truncate block"
                          >
                            {user.fullName}
                          </Link>
                          {user.mutualFriendsCount > 0 && (
                            <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                              {user.mutualFriendsCount} bạn chung
                            </p>
                          )}
                          <button
                            onClick={() => addFriendMutation.mutate(user.id)}
                            disabled={addFriendMutation.isPending}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[var(--color-accent)]/10 hover:bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-semibold rounded-lg text-sm transition disabled:opacity-50"
                          >
                            <UserPlus size={14} /> Thêm bạn bè
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ===== TAB: Đã gửi ===== */}
            {activeTab === 'sent' && (
              <>
                {isLoadingSent ? (
                  <div className="p-4 text-center flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                    <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
                    <span>Đang tải...</span>
                  </div>
                ) : sentRequests.length > 0 ? (
                  <>
                    <p className="px-2 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      {sentRequests.length} lời mời đang chờ phản hồi
                    </p>
                    {sentRequests.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-2 hover:bg-[var(--color-bg-hover)] rounded-xl transition"
                      >
                        <Link to={`/profile/${req.username}`} onClick={() => setIsOpen(false)} className="flex-none">
                          <img
                            src={req.avatarUrl || `https://i.pravatar.cc/150?u=${req.id}`}
                            className="w-12 h-12 rounded-full object-cover border border-[var(--color-border-light)]"
                            alt={req.fullName}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${req.username}`}
                            onClick={() => setIsOpen(false)}
                            className="font-semibold text-sm text-[var(--color-text-primary)] hover:underline truncate block"
                          >
                            {req.fullName}
                          </Link>
                          <p className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1 mt-0.5">
                            <SendHorizontal size={11} />
                            Đang chờ phản hồi
                          </p>
                          <button
                            onClick={() => cancelMutation.mutate(req.id)}
                            disabled={cancelMutation.isPending}
                            className="mt-2 flex items-center gap-1 px-3 py-1.5 bg-[var(--color-bg-primary)] hover:bg-red-50 text-red-500 hover:text-red-600 border border-[var(--color-border-light)] hover:border-red-200 font-semibold rounded-lg text-sm transition disabled:opacity-50"
                          >
                            <X size={14} /> Hủy lời mời
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="py-10 flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                    <SendHorizontal size={36} className="opacity-20" />
                    <p className="text-sm">Bạn chưa gửi lời mời kết bạn nào.</p>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-2 border-t border-[var(--color-border-light)]">
            <Link
              to="/profile"
              className="block text-center text-sm font-semibold text-[var(--color-accent)] hover:underline p-2"
              onClick={() => setIsOpen(false)}
            >
              Xem tất cả bạn bè
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
