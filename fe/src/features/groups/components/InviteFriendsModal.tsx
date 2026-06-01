import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/features/newsfeed/api/groupApi';
import { profileApi } from '@/features/profile/api/profileApi';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Search, UserPlus, Check } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface InviteFriendsModalProps {
  groupId: number;
  onClose: () => void;
}

export const InviteFriendsModal = ({ groupId, onClose }: InviteFriendsModalProps) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitedMap, setInvitedMap] = useState<Record<number, boolean>>({});

  // Get current user's friends
  const { data: friendsData, isLoading: isLoadingFriends } = useQuery({
    queryKey: ['friends', currentUser?.username],
    queryFn: () => profileApi.getUserFriends(currentUser!.username, 0, 100),
    enabled: !!currentUser,
  });

  // Get current group members to filter out
  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members-invite', groupId],
    queryFn: () => groupApi.getMembers(groupId, 0, 500),
  });

  // Extract friends array. Sometimes backend returns directly, sometimes inside .data or .content
  let friendsList = friendsData?.data?.content || friendsData?.content || friendsData?.data || [];
  if (!Array.isArray(friendsList)) friendsList = [];

  // Filter friends based on search query
  const filteredFriends = friendsList.filter((friend: any) =>
    friend.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Extract members array
  const membersList = membersData?.content || [];
  const memberIdSet = new Set(membersList.map((m: any) => m.userId)); // Note: MemberResponse uses userId

  const inviteMutation = useMutation({
    mutationFn: (friendId: number) => groupApi.inviteToGroup(groupId, friendId),
    onSuccess: (_, friendId) => {
      setInvitedMap(prev => ({ ...prev, [friendId]: true }));
      toast.success('Đã gửi lời mời!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Không thể mời người này');
    }
  });

  const isLoading = isLoadingFriends || isLoadingMembers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg-secondary)] w-full max-w-[450px] rounded-2xl shadow-xl border border-[var(--color-border-light)] overflow-hidden animate-slide-in-up flex flex-col max-h-[80vh]">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border-light)] shrink-0">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Mời</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[var(--color-border-light)] shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[var(--color-text-tertiary)]" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm bạn bè..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] rounded-xl border border-[var(--color-border-light)] focus:border-[var(--color-accent)] focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)] text-sm">
              {searchQuery ? 'Không tìm thấy bạn bè nào.' : 'Bạn chưa có bạn bè nào để mời.'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredFriends.map((friend: any) => {
                const isAlreadyMember = memberIdSet.has(friend.id);
                const isInvited = invitedMap[friend.id];

                return (
                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--color-bg-hover)] transition">
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatarUrl || `https://ui-avatars.com/api/?name=${friend.username}&background=random`}
                        alt={friend.fullName}
                        className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-light)]"
                      />
                      <div>
                        <p className="font-semibold text-sm text-[var(--color-text-primary)]">{friend.fullName}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">@{friend.username}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => inviteMutation.mutate(friend.id)}
                      disabled={isInvited || isAlreadyMember || inviteMutation.isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isInvited
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : isAlreadyMember
                            ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] cursor-not-allowed'
                            : 'bg-[var(--color-accent-light)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white'
                        }`}
                    >
                      {isInvited ? (
                        <>
                          <Check size={14} />
                          Đã mời
                        </>
                      ) : isAlreadyMember ? (
                        'Đã trong nhóm'
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Mời
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
