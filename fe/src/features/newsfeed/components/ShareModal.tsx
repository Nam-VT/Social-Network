import { useState } from 'react';
import { X, Loader2, Globe } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '../api/postApi';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from '@/components/ui/Toast';

interface ShareModalProps {
  post: any;
  onClose: () => void;
}

export const ShareModal = ({ post, onClose }: ShareModalProps) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const shareMutation = useMutation({
    mutationFn: () => postApi.sharePost(post.id, content || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      toast.success('Đã chia sẻ bài viết thành công!');
      onClose();
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err.response?.data?.message || 'Chia sẻ bài viết thất bại');
    }
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-[500px] shadow-2xl overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Chia sẻ bài viết</h3>
          <button className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 pt-3 flex items-center gap-3">
          <img src={user?.avatarUrl || 'https://i.pravatar.cc/150'} className="w-10 h-10 rounded-full border border-slate-100" alt="avatar" />
          <div>
            <div className="font-semibold text-sm">{user?.fullName || user?.username}</div>
            <div className="text-xs text-slate-400 flex items-center gap-1">
              <Globe size={10} /> Công khai
            </div>
          </div>
        </div>

        {/* Share content input */}
        <div className="px-4 py-3">
          <textarea
            className="w-full text-sm outline-none resize-none overflow-hidden min-h-[60px] placeholder:text-slate-400"
            placeholder="Hãy nói gì đó về bài viết này..."
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            autoFocus
          />
        </div>

        {/* Preview of original post */}
        <div className="mx-4 mb-3 border border-slate-200 rounded-lg p-3 bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <img src={post.authorAvatarUrl || 'https://i.pravatar.cc/150'} className="w-6 h-6 rounded-full" alt="" />
            <div>
              <div className="text-xs font-semibold">{post.authorFullName || post.authorUsername}</div>
            </div>
          </div>
          {post.content && (
            <div className="text-xs text-slate-600 line-clamp-3">{post.content}</div>
          )}
          {post.mediaList?.[0] && (
            <div className="mt-2 rounded overflow-hidden max-h-[120px]">
              {post.mediaList[0].mediaType === 'VIDEO' ? (
                <video src={post.mediaList[0].mediaUrl} className="w-full object-cover max-h-[120px]" />
              ) : (
                <img src={post.mediaList[0].mediaUrl} className="w-full object-cover max-h-[120px]" alt="" />
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="px-4 py-3 border-t border-slate-100">
          <button
            className="w-full py-2.5 bg-[var(--color-accent)] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            onClick={() => shareMutation.mutate()}
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending && <Loader2 className="animate-spin" size={16} />}
            Chia sẻ ngay
          </button>
        </div>
      </div>
    </div>
  );
};
