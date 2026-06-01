import { useState } from 'react';
import { X, Search, Plus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import axiosClient from '@/api/axiosClient';

interface CreateGroupModalProps {
  onClose: () => void;
  onCreated?: (roomId: number) => void;
}

export const CreateGroupModal = ({ onClose, onCreated }: CreateGroupModalProps) => {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<{ id: number; username: string; fullName: string; avatarUrl?: string }[]>([]);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['user-search-chat', search],
    queryFn: async () => {
      if (!search.trim()) return [];
      const res = await axiosClient.get('/users/search', { params: { keyword: search, page: 0, size: 10 } });
      return res.data.data?.content || [];
    },
    enabled: search.trim().length >= 1,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      chatApi.createGroup({
        roomName: groupName.trim(),
        memberUserIds: selectedUsers.map((u) => u.id),
      }),
    onSuccess: (room) => {
      queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
      onCreated?.(room.id);
      onClose();
    },
  });

  const toggleUser = (u: any) => {
    setSelectedUsers((prev) =>
      prev.find((x) => x.id === u.id)
        ? prev.filter((x) => x.id !== u.id)
        : [...prev, u]
    );
  };

  const canCreate = groupName.trim().length > 0 && selectedUsers.length >= 1;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[var(--color-bg-secondary)] rounded-2xl shadow-2xl w-full max-w-[440px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-light)]">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Tạo nhóm chat</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Group name */}
          <input
            type="text"
            placeholder="Tên nhóm chat..."
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] text-sm"
          />

          {/* Selected users chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded-full text-sm font-medium"
                >
                  <img src={u.avatarUrl || 'https://i.pravatar.cc/150'} alt="" className="w-5 h-5 rounded-full" />
                  {u.fullName || u.username}
                  <button onClick={() => toggleUser(u)} className="hover:text-red-500 ml-1">
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search users */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Tìm bạn bè để thêm vào nhóm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          {/* Search results */}
          {search.trim() && (
            <div className="max-h-[200px] overflow-y-auto space-y-1 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-primary)]">
              {isSearching ? (
                <div className="p-4 flex items-center justify-center">
                  <Loader2 className="animate-spin text-[var(--color-accent)]" size={20} />
                </div>
              ) : (searchResults || []).length === 0 ? (
                <p className="p-4 text-center text-sm text-[var(--color-text-secondary)]">Không tìm thấy</p>
              ) : (
                (searchResults || []).map((u: any) => {
                  const isSelected = selectedUsers.some((x) => x.id === u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--color-bg-hover)] transition-colors ${isSelected ? 'bg-[var(--color-accent)]/5' : ''}`}
                    >
                      <img src={u.avatarUrl || 'https://i.pravatar.cc/150'} alt="" className="w-9 h-9 rounded-full object-cover" />
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{u.fullName}</div>
                        <div className="text-xs text-[var(--color-text-secondary)]">@{u.username}</div>
                      </div>
                      {isSelected && <Plus size={16} className="text-[var(--color-accent)] rotate-45 flex-none" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={() => createMutation.mutate()}
            disabled={!canCreate || createMutation.isPending}
            className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            Tạo nhóm ({selectedUsers.length} thành viên)
          </button>
        </div>
      </div>
    </div>
  );
};
