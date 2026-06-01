import { Camera, Edit2, MessageCircle, UserCheck, UserMinus, UserPlus, Clock, Loader2, X } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { profileApi, type UserProfile } from '../api/profileApi';
import { chatApi } from '@/features/chat/api/chatApi';
import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { useState } from 'react';
import { toast } from '@/components/ui/Toast';

interface ProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  onEditClick: () => void;
}

export const ProfileHeader = ({ profile, isOwnProfile, onEditClick }: ProfileHeaderProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const openChat = useFloatingChatStore((state) => state.openChat);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  
  // Preview states
  const [avatarPreview, setAvatarPreview] = useState<{ file: File; url: string } | null>(null);
  const [coverPreview, setCoverPreview] = useState<{ file: File; url: string } | null>(null);

  // Mutual Friends
  const { data: mutualFriends } = useQuery({
    queryKey: ['mutual-friends', profile.username],
    queryFn: () => profileApi.getMutualFriends(profile.username, 5),
    enabled: !isOwnProfile,
  });

  // Avatar Upload Mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileApi.updateAvatar(file),
    onMutate: () => setIsUploadingAvatar(true),
    onSuccess: () => {
      setAvatarPreview(null);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] }); // update global user state if necessary
    },
    onSettled: () => setIsUploadingAvatar(false),
  });

  // Cover Upload Mutation
  const coverMutation = useMutation({
    mutationFn: (file: File) => profileApi.updateCover(file),
    onMutate: () => setIsUploadingCover(true),
    onSuccess: () => {
      setCoverPreview(null);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
    onSettled: () => setIsUploadingCover(false),
  });

  const friendReqMutation = useMutation({
    mutationFn: () => profileApi.sendFriendRequest(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      toast.success('Đã gửi lời mời kết bạn!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi lời mời kết bạn';
      toast.error(msg);
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: () => profileApi.acceptFriendRequest(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      toast.success('Đã chấp nhận lời mời kết bạn!');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    },
  });

  const rejectFriendMutation = useMutation({
    mutationFn: () => profileApi.rejectFriendRequest(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      toast.info('Đã hủy yêu cầu kết bạn');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    },
  });

  const unfriendMutation = useMutation({
    mutationFn: () => profileApi.unfriend(profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      toast.info('Đã hủy kết bạn');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra';
      toast.error(msg);
    },
  });

  const [showFriendDropdown, setShowFriendDropdown] = useState(false);

  const followMutation = useMutation({
    mutationFn: () => profile.isFollowing ? profileApi.unfollowUser(profile.id) : profileApi.followUser(profile.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', profile.username] })
  });

  const messageMutation = useMutation({
    mutationFn: () => chatApi.getOrCreateDirectRoom(profile.id),
    onSuccess: (room) => {
      openChat(room.id);
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview({ file, url: URL.createObjectURL(file) });
    }
    // reset input value so selecting the same file again works
    e.target.value = '';
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverPreview({ file, url: URL.createObjectURL(file) });
    }
    e.target.value = '';
  };

  const cancelAvatarPreview = () => setAvatarPreview(null);
  const confirmAvatarUpload = () => avatarPreview && avatarMutation.mutate(avatarPreview.file);

  const cancelCoverPreview = () => setCoverPreview(null);
  const confirmCoverUpload = () => coverPreview && coverMutation.mutate(coverPreview.file);

  const renderFriendAction = () => {
    if (profile.friendshipStatus === 'FRIEND') {
      return (
        <div className="relative">
          <button 
            onClick={() => setShowFriendDropdown(!showFriendDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-light)] rounded-md font-semibold text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <UserCheck size={18} />
            Bạn bè
          </button>
          
          {showFriendDropdown && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-[var(--color-border-light)] rounded-lg shadow-lg z-50 py-1">
              <button 
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-50 transition"
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn hủy kết bạn với người này?')) {
                    unfriendMutation.mutate();
                    setShowFriendDropdown(false);
                  }
                }}
                disabled={unfriendMutation.isPending}
              >
                <UserMinus size={16} /> Hủy kết bạn
              </button>
            </div>
          )}
        </div>
      );
    }
    if (profile.friendshipStatus === 'PENDING_SENT') {
      return (
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-light)] rounded-md font-semibold text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
          onClick={() => rejectFriendMutation.mutate()}
          disabled={rejectFriendMutation.isPending}
        >
          <UserMinus size={18} />
          Hủy yêu cầu
        </button>
      );
    }
    if (profile.friendshipStatus === 'PENDING_RECEIVED') {
      return (
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md font-semibold text-sm hover:opacity-90 transition-colors"
            onClick={() => acceptFriendMutation.mutate()}
            disabled={acceptFriendMutation.isPending}
          >
            <UserCheck size={18} /> Chấp nhận
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-light)] rounded-md font-semibold text-sm hover:bg-[var(--color-bg-hover)] transition-colors"
            onClick={() => rejectFriendMutation.mutate()}
            disabled={rejectFriendMutation.isPending}
          >
            <X size={18} /> Xóa
          </button>
        </div>
      );
    }
    return (
      <button 
        className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md font-semibold text-sm hover:opacity-90 transition-colors"
        onClick={() => friendReqMutation.mutate()}
        disabled={friendReqMutation.isPending}
      >
        <UserPlus size={18} />
        Thêm bạn bè
      </button>
    );
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] shadow-sm border border-[var(--color-border-light)] sm:rounded-b-xl overflow-hidden mb-4">
      {/* Cover Photo */}
      <div className="relative w-full h-[250px] sm:h-[350px] bg-slate-200 group">
        {(coverPreview?.url || profile.coverUrl) ? (
          <img src={coverPreview?.url || profile.coverUrl!} className={`w-full h-full object-cover ${(isUploadingCover || coverPreview) ? 'opacity-70' : ''}`} alt="Cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[var(--color-accent)] to-indigo-400 opacity-20"></div>
        )}
        
        {isOwnProfile && !coverPreview && (
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <input type="file" id="coverUpload" className="hidden" accept="image/*" onChange={handleCoverChange} disabled={isUploadingCover} />
            <label htmlFor="coverUpload" className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm text-white rounded-md font-semibold text-sm cursor-pointer hover:bg-black/80 shadow-lg">
              <Camera size={18} />
              {isUploadingCover ? 'Đang tải...' : 'Thêm ảnh bìa'}
            </label>
          </div>
        )}

        {isOwnProfile && coverPreview && (
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={cancelCoverPreview} disabled={isUploadingCover} className="px-4 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-md font-semibold text-sm transition-colors shadow-lg disabled:opacity-50">
              Hủy
            </button>
            <button onClick={confirmCoverUpload} disabled={isUploadingCover} className="px-4 py-2 bg-[var(--color-accent)] hover:opacity-90 text-white rounded-md font-semibold text-sm transition-colors shadow-lg disabled:opacity-50">
              {isUploadingCover ? 'Đang lưu...' : 'Lưu ảnh bìa'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Info Bar */}
      <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row items-center sm:items-end sm:justify-between gap-4 relative -mt-16 sm:-mt-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 z-10 w-full sm:w-auto">
          {/* Avatar */}
          <div className="relative group">
            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[var(--color-bg-secondary)] bg-slate-200 overflow-hidden shadow-md ${(isUploadingAvatar || avatarPreview) ? 'opacity-70' : ''}`}>
              <img src={avatarPreview?.url || profile.avatarUrl || 'https://i.pravatar.cc/150'} className="w-full h-full object-cover" alt="Avatar" />
            </div>
            
            {isOwnProfile && !avatarPreview && (
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={isUploadingAvatar} />
                <label htmlFor="avatarUpload" className="p-2 bg-white/20 rounded-full cursor-pointer hover:bg-white/40 text-white">
                  <Camera size={28} />
                </label>
              </div>
            )}

            {isOwnProfile && avatarPreview && (
              <div className="absolute -bottom-2 inset-x-0 flex flex-col items-center gap-1 z-20">
                <button onClick={confirmAvatarUpload} disabled={isUploadingAvatar} className="w-[80%] py-1.5 bg-[var(--color-accent)] hover:opacity-90 text-white text-xs font-bold rounded-full shadow-lg disabled:opacity-50">
                  {isUploadingAvatar ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button onClick={cancelAvatarPreview} disabled={isUploadingAvatar} className="w-[80%] py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-full shadow-lg disabled:opacity-50">
                  Hủy
                </button>
              </div>
            )}
            
            {/* Online indicator */}
            {profile.isOnline && (
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 w-6 h-6 bg-green-500 border-4 border-[var(--color-bg-secondary)] rounded-full"></div>
            )}
          </div>

          {/* Name & Stats */}
          <div className="text-center sm:text-left pb-2">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">{profile.fullName || profile.username}</h1>
            <div className="text-[var(--color-text-secondary)] font-medium mt-1">
              {profile.friendCount || 0} bạn bè • {profile.followerCount || 0} người theo dõi
            </div>
            
            {/* Mutual Friends Preview */}
            {!isOwnProfile && mutualFriends && mutualFriends.length > 0 && (
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                <div className="flex -space-x-2 overflow-hidden">
                  {mutualFriends.map((mf: any) => (
                    <img key={mf.id} className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--color-bg-secondary)]" src={mf.avatarUrl || 'https://i.pravatar.cc/150'} alt={mf.fullName} title={mf.fullName} />
                  ))}
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {mutualFriends.length} bạn chung
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 pb-2 w-full sm:w-auto">
          {isOwnProfile ? (
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-md font-semibold text-sm hover:opacity-90 transition-colors"
              onClick={onEditClick}
            >
              <Edit2 size={18} />
              Chỉnh sửa trang cá nhân
            </button>
          ) : (
            <>
              {renderFriendAction()}
              <button 
                onClick={() => messageMutation.mutate()}
                disabled={messageMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border-light)] rounded-md font-semibold text-sm hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-50"
              >
                {messageMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                Nhắn tin
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
