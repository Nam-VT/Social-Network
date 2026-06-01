import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Plus, Loader2 } from 'lucide-react';
import { chatApi } from '../api/chatApi';
import { ConversationItem } from './ConversationItem';
import { CreateGroupModal } from './CreateGroupModal';
import axiosClient from '@/api/axiosClient';
import { useDebounce } from '@/hooks/useDebounce';

const ConversationSkeleton = () => (
  <div className="flex items-center gap-3 px-3 py-3 animate-pulse">
    <div className="w-12 h-12 rounded-full bg-slate-200 flex-none" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
      <div className="h-3 bg-slate-200 rounded w-1/2" />
    </div>
  </div>
);

export const ConversationList = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: inboxData, isLoading } = useQuery({
    queryKey: ['chat-inbox'],
    queryFn: () => chatApi.getInbox(0, 30),
    refetchInterval: 15000,
  });

  const rooms = inboxData?.content || [];

  // Filter inbox rooms by search query
  const filteredRooms = rooms.filter((room: any) =>
    room.roomName?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Search users from API when typing and no inbox match
  const { data: userSearchResults, isFetching: isSearching } = useQuery({
    queryKey: ['user-search-chat', debouncedSearch],
    queryFn: async () => {
      const res = await axiosClient.get('/search/users', { params: { q: debouncedSearch, size: 8 } });
      return res.data.data?.content || [];
    },
    enabled: debouncedSearch.length >= 2 && filteredRooms.length === 0,
  });

  // Mutation: open/create DM room with a user
  const openDMMutation = useMutation({
    mutationFn: (userId: number) => chatApi.getOrCreateDirectRoom(userId),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
      setSearch('');
      navigate(`/chat/${room.id}`);
    },
  });

  return (
    <>
      <div className="flex flex-col h-full bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-light)]">
        {/* Header */}
        <div className="px-4 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Đoạn chat</h2>
            <div className="flex gap-1">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors"
                title="Tạo nhóm chat"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Tìm tên hoặc người dùng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] text-sm outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]"
            />
            {isSearching && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[var(--color-accent)]" />
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <ConversationSkeleton key={i} />)
          ) : filteredRooms.length > 0 ? (
            // Show filtered inbox rooms
            filteredRooms.map((room: any) => (
              <ConversationItem
                key={room.id}
                room={room}
                isActive={roomId ? Number(roomId) === room.id : false}
              />
            ))
          ) : debouncedSearch.length >= 2 ? (
            // Show user search results
            <div>
              <p className="px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                Người dùng
              </p>
              {userSearchResults && userSearchResults.length > 0 ? (
                userSearchResults.map((user: any) => (
                  <button
                    key={user.id}
                    onClick={() => openDMMutation.mutate(user.id)}
                    disabled={openDMMutation.isPending}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
                  >
                    <img
                      src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                      className="w-12 h-12 rounded-full object-cover flex-none border border-[var(--color-border-light)]"
                      alt={user.fullName}
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{user.fullName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] truncate">@{user.username}</p>
                    </div>
                    {openDMMutation.isPending && <Loader2 size={16} className="animate-spin text-[var(--color-accent)]" />}
                  </button>
                ))
              ) : !isSearching ? (
                <div className="text-center text-[var(--color-text-secondary)] text-sm pt-8">
                  Không tìm thấy người dùng nào
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center text-[var(--color-text-secondary)] text-sm pt-12">
              <p className="text-4xl mb-3">💬</p>
              Chưa có đoạn chat nào
            </div>
          )}
        </div>
      </div>

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </>
  );
};
