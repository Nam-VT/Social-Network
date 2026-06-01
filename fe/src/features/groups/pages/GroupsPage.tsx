import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi, type CreateGroupPayload } from '@/features/newsfeed/api/groupApi';
import { Link } from 'react-router-dom';
import { Search, Plus, Users, Lock, Globe, Loader2, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export const GroupsPage = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [requirePostApproval, setRequirePostApproval] = useState(false);

  // Queries
  const { data: myGroups, isLoading: isLoadingMyGroups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => groupApi.getMyGroups(0, 50),
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['groups-search', debouncedSearch],
    queryFn: () => groupApi.searchGroups(debouncedSearch, 0, 20),
    enabled: debouncedSearch.trim().length > 0,
  });

  // Create Group mutation
  const createGroupMutation = useMutation({
    mutationFn: (payload: CreateGroupPayload) => groupApi.createGroup(payload),
    onSuccess: () => {
      toast.success('Tạo nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setPrivacy('PUBLIC');
      setRequirePostApproval(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhóm');
    },
  });

  // Join Group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: number) => groupApi.joinGroup(groupId),
    onSuccess: (_, groupId) => {
      toast.success('Đã gửi yêu cầu tham gia nhóm!');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups-search'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createGroupMutation.mutate({
      name,
      description,
      privacy,
      requirePostApproval,
    });
  };

  return (
    <div className="w-full max-w-[800px] mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--color-bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--color-border-light)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Hội nhóm</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Tìm kiếm và kết nối với các cộng đồng cùng sở thích.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-sm hover:shadow cursor-pointer"
        >
          <Plus size={18} />
          Tạo nhóm mới
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-[var(--color-text-tertiary)]" size={18} />
        <input
          type="text"
          placeholder="Tìm kiếm nhóm..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-accent)] focus:outline-none transition-all placeholder:text-[var(--color-text-tertiary)] shadow-sm"
        />
      </div>

      {/* Search Results / Recommendation */}
      {debouncedSearch.trim().length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Kết quả tìm kiếm</h2>
          
          {isSearching ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
            </div>
          ) : !searchResults?.content || searchResults.content.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-4">Không tìm thấy nhóm phù hợp.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.content.map((group: any) => (
                <div key={group.id} className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {group.privacy === 'PUBLIC' ? <Globe size={14} className="text-emerald-500" /> : <Lock size={14} className="text-amber-500" />}
                      <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{group.privacy === 'PUBLIC' ? 'Nhóm Công khai' : 'Nhóm Riêng tư'}</span>
                    </div>
                    <Link to={`/groups/${group.id}`} className="font-bold text-[var(--color-text-primary)] hover:underline mt-1 block line-clamp-1">{group.name}</Link>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">{group.memberCount} thành viên</p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">{group.description || 'Chưa có mô tả'}</p>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <Link to={`/groups/${group.id}`} className="text-xs font-semibold text-[var(--color-accent)] hover:underline flex items-center gap-1">
                      Chi tiết <ArrowRight size={12} />
                    </Link>
                    {!group.isMember && (
                      <button
                        onClick={() => joinGroupMutation.mutate(group.id)}
                        disabled={joinGroupMutation.isPending}
                        className="px-3 py-1.5 bg-[var(--color-accent-light)] hover:bg-[var(--color-accent)] hover:text-white text-[var(--color-accent)] font-semibold rounded-lg text-xs transition-all cursor-pointer"
                      >
                        Tham gia
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Groups List */}
      <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
          <Users size={20} className="text-[var(--color-accent)]" />
          Nhóm của bạn
        </h2>

        {isLoadingMyGroups ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
          </div>
        ) : !myGroups?.content || myGroups.content.length === 0 ? (
          <div className="text-center py-6 text-[var(--color-text-secondary)]">
            <p>Bạn chưa tham gia nhóm nào.</p>
            <p className="text-xs mt-1">Hãy tạo nhóm mới hoặc tìm kiếm nhóm xung quanh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myGroups.content.map((group: any) => (
              <div key={group.id} className="p-4 rounded-xl border border-[var(--color-border-light)] hover:border-[var(--color-accent)] transition-all flex flex-col justify-between gap-3 bg-[var(--color-bg-primary)]/30">
                <div>
                  <div className="flex items-center gap-2">
                    {group.privacy === 'PUBLIC' ? <Globe size={14} className="text-emerald-500" /> : <Lock size={14} className="text-amber-500" />}
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{group.privacy === 'PUBLIC' ? 'Nhóm Công khai' : 'Nhóm Riêng tư'}</span>
                  </div>
                  <Link to={`/groups/${group.id}`} className="font-bold text-[var(--color-text-primary)] hover:underline mt-1 block line-clamp-1">{group.name}</Link>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{group.memberCount} thành viên</p>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-2 line-clamp-2">{group.description || 'Chưa có mô tả'}</p>
                </div>
                <div className="flex justify-end mt-2">
                  <Link
                    to={`/groups/${group.id}`}
                    className="px-3.5 py-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-lg text-xs transition-all shadow-sm hover:shadow"
                  >
                    Vào nhóm
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[var(--color-bg-secondary)] w-full max-w-[500px] rounded-2xl shadow-xl border border-[var(--color-border-light)] overflow-hidden animate-slide-in-up">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border-light)]">
              <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Tạo nhóm mới</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Tên nhóm *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên nhóm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-accent)] focus:outline-none text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Mô tả nhóm</label>
                <textarea
                  placeholder="Giới thiệu mục tiêu, quy định của nhóm..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-accent)] focus:outline-none text-sm transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Quyền riêng tư</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as 'PUBLIC' | 'PRIVATE')}
                  className="w-full px-4 py-2.5 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-accent)] focus:outline-none text-sm transition-all"
                >
                  <option value="PUBLIC">Công khai (Ai cũng có thể tìm thấy và tham gia)</option>
                  <option value="PRIVATE">Riêng tư (Chỉ thành viên mới có thể tìm thấy và duyệt tham gia)</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3 bg-[var(--color-bg-primary)]/50 rounded-xl border border-[var(--color-border-light)]">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">Kiểm duyệt bài viết</h4>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Bài đăng của thành viên cần được phê duyệt</p>
                </div>
                <input
                  type="checkbox"
                  checked={requirePostApproval}
                  onChange={(e) => setRequirePostApproval(e.target.checked)}
                  className="w-4 h-4 text-[var(--color-accent)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent)]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-semibold rounded-xl text-sm transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending || !name.trim()}
                  className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createGroupMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                  Tạo nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
