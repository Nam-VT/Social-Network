import { useState } from 'react';
import { Image, Video, Smile } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { CreatePostModal } from './CreatePostModal';
import '@/styles/newsfeed/create-post.css';

interface Props {
  onPostCreated?: () => void;
  groupId?: number | null;
}

export const CreatePostBox = ({ onPostCreated, groupId = null }: Props) => {
  const user = useAuthStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="create-post-wrapper">
        <div className="create-post-top">
          <img 
            src={user?.avatarUrl || 'https://i.pravatar.cc/150'} 
            alt="Avatar" 
            className="create-post-avatar"
          />
          <button className="create-post-input" onClick={() => setIsModalOpen(true)}>
            {user ? `${user.fullName || user.username} ơi, bạn đang nghĩ gì thế?` : 'Bạn đang nghĩ gì thế?'}
          </button>
        </div>

        <div className="create-post-divider"></div>

        <div className="create-post-actions">
          <div className="create-post-btn" onClick={() => setIsModalOpen(true)}>
            <Video size={20} className="text-red-500" />
            <span className="hidden sm:inline">Video trực tiếp</span>
          </div>
          <div className="create-post-btn" onClick={() => setIsModalOpen(true)}>
            <Image size={20} className="text-green-500" />
            <span className="hidden sm:inline">Ảnh/Video</span>
          </div>
          <div className="create-post-btn" onClick={() => setIsModalOpen(true)}>
            <Smile size={20} className="text-yellow-500" />
            <span className="hidden sm:inline">Cảm xúc/Hoạt động</span>
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        groupId={groupId}
        onSuccess={() => {
          setIsModalOpen(false);
          if (onPostCreated) onPostCreated();
        }}
      />
    </>
  );
};
