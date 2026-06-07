import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/features/newsfeed/api/groupApi';
import { useAuthStore } from '@/store/useAuthStore';
import { CreatePostBox } from '@/features/newsfeed/components/CreatePostBox';
import { PostItem, PostSkeleton } from '@/features/newsfeed/components/PostItem';
import { EditGroupModal } from '../components/EditGroupModal';
import { InviteFriendsModal } from '../components/InviteFriendsModal';
import {
  Globe, Lock, Users, Shield, Loader2, Calendar, FileText, Check, X,
  UserCheck, UserX, ShieldAlert, LogOut, Link2
} from 'lucide-react';
import { toast } from '@/components/ui/Toast';

export const GroupDetailPage = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(state => state.user);

  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'about' | 'manage'>('feed');
  const [manageSubTab, setManageSubTab] = useState<'posts' | 'members'>('posts');
  const [isCopied, setIsCopied] = useState(false);
  const [showMemberMenu, setShowMemberMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleCopyLink = () => {
    const link = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link).then(() => {
        setIsCopied(true);
        toast.success('Đã sao chép link nhóm vào clipboard!');
        setTimeout(() => setIsCopied(false), 2500);
      }).catch(() => {
        toast.error('Không thể sao chép, vui lòng thử lại.');
      });
    } else {
      // Fallback for HTTP
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setIsCopied(true);
        toast.success('Đã sao chép link nhóm vào clipboard!');
        setTimeout(() => setIsCopied(false), 2500);
      } catch (err) {
        toast.error('Lỗi sao chép, vui lòng copy thủ công trên thanh địa chỉ.');
      }
      document.body.removeChild(textArea);
    }
  };

  const parsedGroupId = Number(groupId);

  // Queries
  const { data: group, isLoading: isLoadingGroup, error: groupError } = useQuery({
    queryKey: ['group', parsedGroupId],
    queryFn: () => groupApi.getGroupById(parsedGroupId),
    enabled: !!parsedGroupId,
  });

  const { data: feedData, isLoading: isLoadingFeed, refetch: refetchFeed } = useQuery({
    queryKey: ['group-feed', parsedGroupId],
    queryFn: () => groupApi.getGroupFeed(parsedGroupId, 0, 50),
    // PUBLIC: ai cũng xem được. PRIVATE: chỉ approved member mới xem
    enabled: !!parsedGroupId && (group?.privacy === 'PUBLIC' || group?.isApprovedMember === true),
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['group-members', parsedGroupId],
    queryFn: () => groupApi.getMembers(parsedGroupId, 0, 100),
    enabled: !!parsedGroupId && activeTab === 'members',
  });

  const { data: pendingRequests, isLoading: isLoadingPendingRequests } = useQuery({
    queryKey: ['group-pending-requests', parsedGroupId],
    queryFn: () => groupApi.getPendingRequests(parsedGroupId, 0, 100),
    enabled: !!parsedGroupId && activeTab === 'manage' && manageSubTab === 'members',
  });

  const { data: pendingPosts, isLoading: isLoadingPendingPosts } = useQuery({
    queryKey: ['group-pending-posts', parsedGroupId],
    queryFn: () => groupApi.getGroupPendingPosts(parsedGroupId, 0, 100),
    enabled: !!parsedGroupId && activeTab === 'manage' && manageSubTab === 'posts',
  });

  // Mutations
  const joinMutation = useMutation({
    mutationFn: () => groupApi.joinGroup(parsedGroupId),
    onSuccess: () => {
      // Xóa tất cả cache liên quan để UI nhận data mới từ server
      queryClient.invalidateQueries({ queryKey: ['group', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-feed', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });

      // Toast thông báo tùy theo loại nhóm
      if (group?.privacy === 'PUBLIC') {
        toast.success('Bạn đã tham gia nhóm thành công!');
      } else {
        toast.success('Đã gửi yêu cầu tham gia. Vui lòng chờ Admin duyệt.');
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(parsedGroupId),
    onSuccess: () => {
      toast.success(isApprovedMember ? 'Đã rời nhóm thành công' : 'Đã hủy yêu cầu tham gia');
      queryClient.invalidateQueries({ queryKey: ['group', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-feed', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => groupApi.deleteGroup(parsedGroupId),
    onSuccess: () => {
      toast.success('Đã xóa nhóm thành công');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      navigate('/groups');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const approveMemberMutation = useMutation({
    mutationFn: (userId: number) => groupApi.approveJoinRequest(parsedGroupId, userId),
    onSuccess: () => {
      toast.success('Đã duyệt thành viên');
      queryClient.invalidateQueries({ queryKey: ['group-pending-requests', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-members', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const rejectMemberMutation = useMutation({
    mutationFn: (userId: number) => groupApi.kickMember(parsedGroupId, userId),
    onSuccess: () => {
      toast.success('Đã từ chối yêu cầu tham gia');
      queryClient.invalidateQueries({ queryKey: ['group-pending-requests', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const kickMemberMutation = useMutation({
    mutationFn: (userId: number) => groupApi.kickMember(parsedGroupId, userId),
    onSuccess: () => {
      toast.success('Đã mời thành viên ra khỏi nhóm');
      queryClient.invalidateQueries({ queryKey: ['group-members', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: 'ADMIN' | 'MODERATOR' | 'MEMBER' }) => 
      groupApi.changeRole(parsedGroupId, userId, role),
    onSuccess: () => {
      toast.success('Đã cập nhật quyền thành viên');
      queryClient.invalidateQueries({ queryKey: ['group-members', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const approvePostMutation = useMutation({
    mutationFn: (postId: number) => groupApi.approvePost(parsedGroupId, postId),
    onSuccess: () => {
      toast.success('Đã duyệt bài viết');
      queryClient.invalidateQueries({ queryKey: ['group-pending-posts', parsedGroupId] });
      queryClient.invalidateQueries({ queryKey: ['group-feed', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const rejectPostMutation = useMutation({
    mutationFn: (postId: number) => groupApi.rejectPost(parsedGroupId, postId),
    onSuccess: () => {
      toast.success('Đã từ chối bài viết');
      queryClient.invalidateQueries({ queryKey: ['group-pending-posts', parsedGroupId] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  if (isLoadingGroup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-[var(--color-accent)]" size={32} />
        <p className="text-[var(--color-text-secondary)] text-sm">Đang tải thông tin nhóm...</p>
      </div>
    );
  }

  if (groupError || !group) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-red-500 font-semibold">Không thể tải thông tin nhóm hoặc nhóm không tồn tại.</p>
        <button onClick={() => navigate('/groups')} className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-xl">Quay lại danh sách nhóm</button>
      </div>
    );
  }

  const isCreator = currentUser?.username === group.creatorUsername;
  const isPrivate = group.privacy === 'PRIVATE';
  const isApprovedMember = group.isApprovedMember === true || currentUser?.role === 'ADMIN';
  const isPendingMember = group.isMember === true && !group.isApprovedMember;
  const isAdmin = (isCreator && group.isApprovedMember === true) || currentUser?.role === 'ADMIN';

  return (
    <div className="w-full max-w-[800px] mx-auto p-4 space-y-6">
      {/* Group Cover & Header Card */}
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl overflow-hidden border border-[var(--color-border-light)] shadow-sm">
        <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
          {group.coverUrl && (
            <img src={group.coverUrl} alt="Group Cover" className="w-full h-full object-cover" />
          )}
          <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5">
            {isPrivate ? <Lock size={12} /> : <Globe size={12} />}
            {isPrivate ? 'Nhóm riêng tư' : 'Nhóm công khai'}
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{group.name}</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 flex items-center gap-1.5">
                <Users size={16} />
                <span>{group.memberCount} thành viên</span>
              </p>
            </div>

            <div className="flex gap-2 items-center">
              {isApprovedMember && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-semibold rounded-xl text-sm transition cursor-pointer border border-[var(--color-border-light)] shadow-sm"
                >
                  <Users size={16} className="text-[var(--color-accent)]" />
                  Mời
                </button>
              )}

              {isApprovedMember ? (
                // === DROPDOWN cho thành viên đã được duyệt ===
                <div className="relative">
                  <button
                    onClick={() => setShowMemberMenu(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-accent-light)] hover:bg-[var(--color-accent-light)] text-[var(--color-accent)] font-bold rounded-xl text-sm transition cursor-pointer border border-[var(--color-accent)]/20 select-none"
                  >
                    <Check size={15} className="text-[var(--color-accent)]" />
                    Đã tham gia
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${showMemberMenu ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9" /></svg>
                  </button>

                  {showMemberMenu && (
                    <>
                      {/* Overlay để đóng menu khi click ngoài */}
                      <div className="fixed inset-0 z-30" onClick={() => setShowMemberMenu(false)} />

                      <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--color-bg-secondary)] rounded-2xl shadow-xl border border-[var(--color-border-light)] py-1.5 z-40 overflow-hidden">
                        {/* Copy link */}
                        <button
                          onClick={() => { handleCopyLink(); setShowMemberMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition cursor-pointer"
                        >
                          {isCopied ? <Check size={16} className="text-emerald-500" /> : <Link2 size={16} className="text-[var(--color-accent)]" />}
                          <span>{isCopied ? 'Đã sao chép link!' : 'Sao chép link nhóm'}</span>
                        </button>

                        <div className="h-px bg-[var(--color-border-light)] mx-3 my-1" />

                        {/* Rời nhóm */}
                        <button
                          onClick={() => {
                            setShowMemberMenu(false);
                            if (window.confirm('Bạn có chắc muốn rời nhóm này?')) {
                              leaveMutation.mutate();
                            }
                          }}
                          disabled={leaveMutation.isPending}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition cursor-pointer"
                        >
                          <LogOut size={16} />
                          <span>Rời nhóm</span>
                        </button>

                        {/* Xóa / Cài đặt nhóm — chỉ Admin */}
                        {isAdmin && (
                          <>
                            <div className="h-px bg-[var(--color-border-light)] mx-3 my-1" />
                            <button
                              onClick={() => {
                                setShowMemberMenu(false);
                                setShowEditModal(true);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition cursor-pointer"
                            >
                              <Shield size={16} className="text-amber-500" />
                              <span>Cài đặt nhóm</span>
                            </button>
                            <button
                              onClick={() => {
                                setShowMemberMenu(false);
                                if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA nhóm này vĩnh viễn?')) {
                                  deleteMutation.mutate();
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 font-bold hover:bg-red-50 transition cursor-pointer"
                            >
                              <X size={16} />
                              <span>Xóa nhóm vĩnh viễn</span>
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : isPendingMember ? (
                // === Đang chờ duyệt (có thể click để Hủy yêu cầu) ===
                <button
                  onClick={() => {
                    if (window.confirm('Bạn có chắc muốn hủy yêu cầu tham gia nhóm này?')) {
                      leaveMutation.mutate();
                    }
                  }}
                  disabled={leaveMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-semibold rounded-xl text-sm transition cursor-pointer select-none"
                  title="Click để hủy yêu cầu tham gia"
                >
                  <Loader2 size={15} className="animate-spin text-amber-600" />
                  Đang chờ duyệt (Hủy yêu cầu)
                </button>
              ) : (
                // === Nút Tham gia cho người chưa vào nhóm ===
                <button
                  onClick={() => {
                    joinMutation.mutate();
                  }}
                  disabled={joinMutation.isPending}
                  className="px-5 py-2.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl text-sm transition shadow-sm hover:shadow cursor-pointer"
                >
                  {joinMutation.isPending ? 'Đang gửi...' : 'Tham gia nhóm'}
                </button>
              )}
            </div>
          </div>

          {/* Group description brief */}
          {group.description && (
            <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-primary)]/40 p-3 rounded-xl border border-[var(--color-border-light)]">
              {group.description}
            </p>
          )}

          {/* Tabs Menu */}
          <div className="flex border-t border-[var(--color-border-light)] pt-2 overflow-x-auto gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-all cursor-pointer ${activeTab === 'feed'
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
            >
              Thảo luận
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-all cursor-pointer ${activeTab === 'members'
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
            >
              Thành viên
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-all cursor-pointer ${activeTab === 'about'
                  ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
            >
              Giới thiệu
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-2.5 font-bold text-sm rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'manage'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'text-amber-600 hover:bg-amber-50/50'
                  }`}
              >
                <Shield size={16} />
                Quản trị
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area based on Active Tab */}

      {/* 1. DISCUSSION FEED */}
      {activeTab === 'feed' && (
        <div className="space-y-4">

          {/* Banner chờ duyệt cho nhóm PRIVATE đang pending */}
          {isPendingMember && isPrivate && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
              <Loader2 size={20} className="animate-spin shrink-0" />
              <div>
                <p className="font-semibold text-sm">Yêu cầu tham gia của bạn đang chờ Admin phê duyệt.</p>
                <p className="text-xs mt-0.5">Bạn sẽ có quyền xem và đăng bài sau khi được duyệt.</p>
              </div>
            </div>
          )}

          {/* Đã duyệt: hiện khung đăng bài */}
          {isApprovedMember && (
            <CreatePostBox
              groupId={parsedGroupId}
              onPostCreated={() => {
                queryClient.invalidateQueries({ queryKey: ['group-feed', parsedGroupId] });
                toast.success(group.requirePostApproval ? 'Bài viết đã gửi, đang chờ Admin duyệt.' : 'Đăng bài thành công!');
              }}
            />
          )}

          {/* PUBLIC chưa là thành viên: nhắc tham gia */}
          {!isApprovedMember && !isPendingMember && !isPrivate && (
            <div className="p-4 bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 rounded-2xl text-sm text-[var(--color-accent)] font-medium text-center">
              Tham gia nhóm để có thể đăng bài và tương tác cùng mọi người.
            </div>
          )}

          {/* PRIVATE chưa là thành viên: kóa nội dung */}
          {!group.isMember && isPrivate && (
            <div className="p-6 text-center bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-2xl shadow-sm">
              <div className="flex flex-col items-center gap-2 text-[var(--color-text-secondary)]">
                <Lock size={32} className="text-amber-500" />
                <p className="font-semibold text-base text-[var(--color-text-primary)]">Nội dung được bảo vệ</p>
                <p className="text-xs">Chỉ thành viên đã được duyệt mới có thể xem bài viết trong nhóm này.</p>
              </div>
            </div>
          )}

          {/* Feed List: hiện với PUBLIC (ai cũng xem) hoặc approved member */}
          {(group.privacy === 'PUBLIC' || isApprovedMember) && (
            <div className="space-y-4">
              {isLoadingFeed ? (
                <>
                  <PostSkeleton />
                  <PostSkeleton />
                </>
              ) : !feedData?.content || feedData.content.length === 0 ? (
                <div className="p-8 text-center text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-light)] shadow-sm">
                  Chưa có bài viết nào trong nhóm.
                </div>
              ) : (
                feedData.content.map((post: any) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    onDeleted={() => queryClient.invalidateQueries({ queryKey: ['group-feed', parsedGroupId] })}
                  />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. MEMBERS TAB */}
      {activeTab === 'members' && (
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Danh sách thành viên</h2>
          {isLoadingMembers ? (
            <div className="flex justify-center py-6">
              <Loader2 className="animate-spin text-[var(--color-accent)]" size={24} />
            </div>
          ) : !membersData?.content || membersData.content.length === 0 ? (
            <p className="text-[var(--color-text-secondary)] text-center py-4">Chưa có thành viên nào.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border-light)]">
              {membersData.content.map((member: any) => (
                <div key={member.userId} className="flex justify-between items-center py-3">
                  <div className="flex items-center gap-3">
                    <img src={member.avatarUrl || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{member.fullName || member.username}</h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">@{member.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${member.role === 'ADMIN'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : member.role === 'MODERATOR'
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                      {member.role}
                    </span>

                    {/* Manage actions (only for Admin/Creator, not allowed to action on themselves) */}
                    {isAdmin && currentUser?.username !== member.username && (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => {
                            if (window.confirm(`Bạn muốn đổi quyền của ${member.fullName || member.username} thành ${e.target.value}?`)) {
                              changeRoleMutation.mutate({ userId: member.userId, role: e.target.value as any });
                            }
                          }}
                          disabled={changeRoleMutation.isPending}
                          className="text-[11px] font-bold bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-lg px-2 py-1 outline-none focus:border-[var(--color-accent)] text-[var(--color-text-secondary)] cursor-pointer"
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          onClick={() => {
                            if (window.confirm(`Bạn muốn mời ${member.fullName || member.username} khỏi nhóm?`)) {
                              kickMemberMutation.mutate(member.userId);
                            }
                          }}
                          disabled={kickMemberMutation.isPending}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Trục xuất khỏi nhóm"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ABOUT TAB */}
      {activeTab === 'about' && (
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Giới thiệu về nhóm</h2>

          <div className="space-y-4 text-sm text-[var(--color-text-primary)]">
            <div className="flex items-center gap-3">
              <Shield className="text-[var(--color-accent)]" size={20} />
              <div>
                <p className="font-semibold">Quản trị viên</p>
                <p className="text-xs text-[var(--color-text-secondary)]">@{group.creatorUsername}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="text-emerald-500" size={20} />
              <div>
                <p className="font-semibold">Ngày thành lập</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {group.createdAt ? new Date(group.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="text-amber-500" size={20} />
              <div>
                <p className="font-semibold">Quy tắc nhóm & Kiểm duyệt</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {group.requirePostApproval ? 'Yêu cầu kiểm duyệt bài viết trước khi đăng' : 'Đăng bài viết trực tiếp tự do'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ADMIN DASHBOARD */}
      {activeTab === 'manage' && isAdmin && (
        <div className="bg-[var(--color-bg-secondary)] p-6 rounded-2xl border border-[var(--color-border-light)] shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-[var(--color-border-light)] pb-3">
            <h2 className="text-lg font-bold text-amber-800 flex items-center gap-2">
              <ShieldAlert size={22} />
              Bảng quản trị nhóm
            </h2>

            {/* Sub-tabs switch */}
            <div className="flex gap-1 bg-[var(--color-bg-primary)] p-1 rounded-xl">
              <button
                onClick={() => setManageSubTab('posts')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${manageSubTab === 'posts' ? 'bg-[var(--color-bg-secondary)] shadow-sm text-amber-700' : 'text-[var(--color-text-secondary)]'
                  }`}
              >
                Duyệt bài viết
              </button>
              <button
                onClick={() => setManageSubTab('members')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${manageSubTab === 'members' ? 'bg-[var(--color-bg-secondary)] shadow-sm text-amber-700' : 'text-[var(--color-text-secondary)]'
                  }`}
              >
                Duyệt thành viên
              </button>
            </div>
          </div>

          {/* Sub-tab 1: Pending Posts approval */}
          {manageSubTab === 'posts' && (
            <div className="space-y-4">
              {isLoadingPendingPosts ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-amber-500" size={24} />
                </div>
              ) : !pendingPosts?.content || pendingPosts.content.length === 0 ? (
                <p className="text-[var(--color-text-secondary)] text-center py-6 text-sm">Không có bài viết nào đang chờ duyệt.</p>
              ) : (
                <div className="space-y-4">
                  {pendingPosts.content.map((post: any) => (
                    <div key={post.id} className="border border-[var(--color-border-light)] rounded-xl p-4 bg-[var(--color-bg-primary)]/10 space-y-4">
                      {/* Author Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <img src={post.authorAvatarUrl || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                          <div>
                            <h4 className="font-semibold text-xs text-[var(--color-text-primary)]">{post.authorFullName || post.authorUsername}</h4>
                            <p className="text-[10px] text-[var(--color-text-secondary)]">@{post.authorUsername}</p>
                          </div>
                        </div>

                        {/* Control buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => approvePostMutation.mutate(post.id)}
                            disabled={approvePostMutation.isPending}
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                            title="Phê duyệt"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => rejectPostMutation.mutate(post.id)}
                            disabled={rejectPostMutation.isPending}
                            className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition cursor-pointer"
                            title="Từ chối"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-sm text-[var(--color-text-primary)] line-clamp-3">{post.content}</p>

                      {/* Media preview if any */}
                      {post.mediaList && post.mediaList.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {post.mediaList.map((m: any) => (
                            <img key={m.id} src={m.mediaUrl} alt="media" className="h-16 w-20 object-cover rounded-lg border" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sub-tab 2: Join Request approvals */}
          {manageSubTab === 'members' && (
            <div className="space-y-4">
              {isLoadingPendingRequests ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="animate-spin text-amber-500" size={24} />
                </div>
              ) : !pendingRequests?.content || pendingRequests.content.length === 0 ? (
                <p className="text-[var(--color-text-secondary)] text-center py-6 text-sm">Không có yêu cầu tham gia nào đang chờ duyệt.</p>
              ) : (
                <div className="divide-y divide-[var(--color-border-light)]">
                  {pendingRequests.content.map((member: any) => (
                    <div key={member.userId} className="flex justify-between items-center py-3">
                      <div className="flex items-center gap-3">
                        <img src={member.avatarUrl || 'https://i.pravatar.cc/150'} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <h4 className="font-semibold text-sm text-[var(--color-text-primary)]">{member.fullName || member.username}</h4>
                          <p className="text-xs text-[var(--color-text-secondary)]">@{member.username}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMemberMutation.mutate(member.userId)}
                          disabled={approveMemberMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <UserCheck size={14} />
                          Duyệt
                        </button>
                        <button
                          onClick={() => rejectMemberMutation.mutate(member.userId)}
                          disabled={rejectMemberMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          <UserX size={14} />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {/* Edit Group Modal */}
      {showEditModal && (
        <EditGroupModal
          group={group}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Invite Friends Modal */}
      {showInviteModal && (
        <InviteFriendsModal
          groupId={parsedGroupId}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};
