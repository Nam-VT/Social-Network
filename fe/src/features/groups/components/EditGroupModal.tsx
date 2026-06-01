import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '@/features/newsfeed/api/groupApi';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

interface EditGroupModalProps {
  group: any;
  onClose: () => void;
}

export const EditGroupModal = ({ group, onClose }: EditGroupModalProps) => {
  const queryClient = useQueryClient();

  // Form states initialized with current group data
  const [name, setName] = useState(group?.name || '');
  const [description, setDescription] = useState(group?.description || '');
  const [coverUrl, setCoverUrl] = useState(group?.coverUrl || '');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE'>(group?.privacy || 'PUBLIC');
  const [requirePostApproval, setRequirePostApproval] = useState(group?.requirePostApproval || false);

  const updateGroupMutation = useMutation({
    mutationFn: (payload: any) => groupApi.updateGroup(group.id, payload),
    onSuccess: () => {
      toast.success('Cập nhật thông tin nhóm thành công!');
      queryClient.invalidateQueries({ queryKey: ['group', String(group.id)] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhóm');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    updateGroupMutation.mutate({
      name,
      description,
      coverUrl,
      privacy,
      requirePostApproval,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[var(--color-bg-secondary)] w-full max-w-[500px] rounded-2xl shadow-xl border border-[var(--color-border-light)] overflow-hidden animate-slide-in-up">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--color-border-light)]">
          <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Cài đặt nhóm</h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
            <label className="block text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">Ảnh bìa (URL)</label>
            <input
              type="text"
              placeholder="Nhập URL ảnh bìa"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
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
              <option value="PRIVATE">Riêng tư (Chỉ thành viên mới có thể tìm thấy và xem nội dung)</option>
            </select>
            <p className="text-[10px] text-amber-500 mt-1 font-medium">Lưu ý: Đổi quyền riêng tư từ PUBLIC sang PRIVATE không ảnh hưởng tới thành viên cũ.</p>
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
              className="w-4 h-4 text-[var(--color-accent)] border-[var(--color-border-light)] rounded focus:ring-[var(--color-accent)]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-light)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] font-semibold rounded-xl text-sm transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={updateGroupMutation.isPending || !name.trim()}
              className="px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {updateGroupMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
