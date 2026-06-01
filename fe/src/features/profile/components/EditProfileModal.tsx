import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi, type UserProfile } from '../api/profileApi';

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export const EditProfileModal = ({ profile, onClose }: EditProfileModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fullName: profile.fullName || '',
    bio: profile.bio || '',
    gender: profile.gender || '',
    birthDate: profile.birthDate ? profile.birthDate.toString().split('T')[0] : '', // YYYY-MM-DD
    relationshipStatus: profile.relationshipStatus || '',
    friendListVisibility: profile.friendListVisibility || 'PUBLIC'
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      // Tách friendListVisibility ra — BE dùng endpoint riêng PUT /users/me/privacy
      const { friendListVisibility, ...profileData } = formData;

      // Xử lý các giá trị rỗng của enum (để tránh lỗi 400 Bad Request từ Spring Boot)
      const payloadToUpdate = { ...profileData } as any;
      if (payloadToUpdate.relationshipStatus === '') {
        payloadToUpdate.relationshipStatus = null;
      }
      if (payloadToUpdate.gender === '') {
        payloadToUpdate.gender = null;
      }

      // 1) Cập nhật thông tin profile
      await profileApi.updateProfile(payloadToUpdate);

      // 2) Cập nhật quyền riêng tư (nếu có thay đổi)
      if (friendListVisibility && friendListVisibility !== profile.friendListVisibility) {
        await profileApi.updatePrivacy(friendListVisibility);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', profile.username] });
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]" onClick={onClose}>
      <div 
        className="bg-[var(--color-bg-primary)] rounded-xl w-full max-w-[500px] shadow-2xl overflow-hidden mx-4 border border-[var(--color-border-light)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-light)]">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Chỉnh sửa trang cá nhân</h3>
          <button className="p-1.5 rounded-full hover:bg-[var(--color-bg-hover)] transition-colors text-[var(--color-text-secondary)]" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Họ và tên</label>
            <input 
              type="text" 
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              placeholder="Nhập họ và tên"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Giới thiệu bản thân (Tiểu sử)</label>
            <textarea 
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] resize-none h-24 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              placeholder="Vài nét về bạn..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Giới tính</label>
              <select 
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              >
                <option value="">Không xác định</option>
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Ngày sinh</label>
              <input 
                type="date" 
                name="birthDate"
                value={formData.birthDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Tình trạng mối quan hệ</label>
            <select 
              name="relationshipStatus"
              value={formData.relationshipStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
            >
              <option value="">Chưa cập nhật</option>
              <option value="SINGLE">Độc thân</option>
              <option value="IN_RELATIONSHIP">Hẹn hò</option>
              <option value="ENGAGED">Đã đính hôn</option>
              <option value="MARRIED">Đã kết hôn</option>
            </select>
          </div>

          {/* Friend List Privacy */}
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Quyền riêng tư danh sách bạn bè</label>
            <select 
              name="friendListVisibility"
              value={formData.friendListVisibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-[var(--color-border-light)] rounded-lg outline-none focus:border-[var(--color-accent)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
            >
              <option value="PUBLIC">Công khai (Ai cũng có thể xem)</option>
              <option value="FRIENDS">Chỉ bạn bè</option>
              <option value="PRIVATE">Chỉ mình tôi</option>
            </select>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border-light)] flex justify-end gap-2">
          <button 
            className="px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded-lg transition-colors border border-[var(--color-border-light)]"
            onClick={onClose}
          >
            Hủy
          </button>
          <button 
            className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 ${
              isSuccess ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--color-accent)] hover:opacity-90'
            }`}
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || isSuccess}
          >
            {updateMutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {isSuccess && <Check size={16} />}
            {isSuccess ? 'Đã lưu thành công!' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};
