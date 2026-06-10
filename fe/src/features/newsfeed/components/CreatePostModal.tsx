import { useState, useRef } from 'react';
import { X, Image as ImageIcon, Video, Smile, MapPin, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMutation } from '@tanstack/react-query';
import { postApi, uploadApi } from '../api/postApi';
import '@/styles/newsfeed/create-post-modal.css';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  groupId?: number | null;
}

export const CreatePostModal = ({ isOpen, onClose, onSuccess, groupId = null }: CreatePostModalProps) => {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

      selectedFiles.forEach(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`File "${file.name}" vượt quá giới hạn 50MB và đã bị bỏ qua.`);
        } else {
          validFiles.push(file);
        }
      });

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        // Generate local preview URLs
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setPreviews((prev) => [...prev, ...newPreviews]);
      }
    }
    
    // Reset input để chọn lại cùng 1 file nếu cần
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePreview = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      let mediaList: { mediaUrl: string, mediaType: string }[] = [];
      
      if (files.length > 0) {
        setIsUploading(true);
        const uploadedUrls = await uploadApi.uploadMultiple(files, 'posts');
        mediaList = uploadedUrls.map((url, index) => ({
          mediaUrl: url,
          mediaType: files[index].type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
        }));
      }

      return postApi.createPost({
        content,
        visibility: groupId ? 'PUBLIC' : visibility,
        groupId,
        mediaList
      });
    },
    onSuccess: () => {
      setContent('');
      setFiles([]);
      setPreviews([]);
      setIsUploading(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      setIsUploading(false);
      console.error('Lỗi khi đăng bài:', error);
      alert('Đăng bài thất bại, vui lòng thử lại.');
    }
  });

  const handleClose = () => {
    setContent('');
    setFiles([]);
    setPreviews([]);
    setVisibility('PUBLIC');
    onClose();
  }

  if (!isOpen) return null;

  const isPending = mutation.isPending || isUploading;

  return (
    <div className="create-post-modal-overlay">
      <div className="create-post-modal-content">
        
        {/* Header */}
        <div className="create-post-modal-header">
          <h2 className="create-post-modal-title">Tạo bài viết</h2>
          <button className="create-post-modal-close" onClick={handleClose} disabled={isPending}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="create-post-modal-body max-h-[80vh] overflow-y-auto">
          <div className="create-post-user-info">
            <img 
              src={user?.avatarUrl || 'https://i.pravatar.cc/150'} 
              alt="Avatar" 
              className="create-post-user-avatar" 
            />
            <div>
              <div className="create-post-user-name">{user?.fullName || user?.username || 'Người dùng'}</div>
              {groupId ? (
                <div className="create-post-visibility mt-1 flex items-center gap-1 bg-slate-100 rounded-md px-2 py-0.5 w-max text-xs font-semibold text-slate-600">
                  <Users size={12} />
                  <span>Bài viết trong nhóm</span>
                </div>
              ) : (
                <div className="create-post-visibility mt-1 flex items-center gap-1 bg-slate-100 rounded-md px-2 py-0.5 w-max">
                  <Users size={12} />
                  <select 
                    className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-slate-700"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    disabled={isPending}
                  >
                    <option value="PUBLIC">Công khai</option>
                    <option value="FRIENDS">Bạn bè</option>
                    <option value="PRIVATE">Chỉ mình tôi</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <textarea
            className={`create-post-textarea resize-none overflow-hidden ${content.length > 80 || previews.length > 0 ? 'small-text' : ''}`}
            placeholder={`${user?.fullName || user?.username || 'Bạn'} ơi, bạn đang nghĩ gì thế?`}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            disabled={isPending}
            autoFocus
          />

          {previews.length > 0 && (
            <div className="mb-4 rounded-xl border border-[var(--color-border-light)] p-2 relative grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {previews.map((preview, index) => {
                const isVideo = files[index]?.type.startsWith('video/');
                return (
                  <div key={index} className="relative group rounded-lg overflow-hidden border bg-slate-100 flex items-center justify-center">
                    {isVideo ? (
                      <video src={preview} className="w-full h-32 object-cover" />
                    ) : (
                      <img src={preview} alt="preview" className="w-full h-32 object-cover" />
                    )}
                    {isVideo && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center"><div className="w-0 h-0 border-y-[6px] border-y-transparent border-l-[10px] border-l-white ml-1" /></div></div>}
                    <button 
                      className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-white"
                      onClick={() => removePreview(index)}
                      disabled={isPending}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="create-post-addons">
            <span className="create-post-addons-text">Thêm vào bài viết của bạn</span>
            <div className="flex gap-1">
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />
              <button 
                className="create-post-addon-btn text-green-500" 
                title="Ảnh/Video" 
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={24} />
              </button>
              <button className="create-post-addon-btn text-blue-500" title="Gắn thẻ người khác" disabled={isPending}>
                <Users size={24} />
              </button>
              <button className="create-post-addon-btn text-yellow-500" title="Cảm xúc/Hoạt động" disabled={isPending}>
                <Smile size={24} />
              </button>
              <button className="create-post-addon-btn text-red-500" title="Check in" disabled={isPending}>
                <MapPin size={24} />
              </button>
            </div>
          </div>

          <button 
            className="create-post-submit-btn"
            disabled={(content.trim().length === 0 && files.length === 0) || isPending}
            onClick={() => mutation.mutate()}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={20} /> 
                {isUploading ? 'Đang tải ảnh...' : 'Đang đăng...'}
              </span>
            ) : 'Đăng'}
          </button>
        </div>

      </div>
    </div>
  );
};
