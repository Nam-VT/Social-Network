import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ConversationList } from '../components/ConversationList';
import { ChatWindow } from '../components/ChatWindow';
import { ChatInfoSidebar } from '../components/ChatInfoSidebar';
import { MediaLightbox } from '../components/MediaLightbox';
import { chatApi, type ChatRoom } from '../api/chatApi';
import { usePageTitle } from '@/hooks/usePageTitle';

export const ChatPage = () => {
  usePageTitle('Tin nhắn');
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const [isMobileListVisible, setIsMobileListVisible] = useState(!roomId);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(true);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Sync trạng thái mobile khi roomId thay đổi
  useEffect(() => {
    setIsMobileListVisible(!roomId);
  }, [roomId]);

  // Fetch thông tin room hiện tại nếu có
  const { data: inboxData } = useQuery({
    queryKey: ['chat-inbox'],
    queryFn: () => chatApi.getInbox(0, 30),
  });

  const currentRoom: ChatRoom | undefined = inboxData?.content?.find(
    (r: any) => r.id === Number(roomId)
  );

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[var(--color-bg-primary)] overflow-hidden">
      {/* ===== SIDEBAR: Conversation List ===== */}
      <div
        className={`
          flex-none w-full sm:w-[320px] lg:w-[360px]
          ${roomId && !isMobileListVisible ? 'hidden sm:flex' : 'flex'}
          flex-col
        `}
      >
        <ConversationList />
      </div>

      {/* ===== MAIN: Chat Window ===== */}
      <div
        className={`
          flex-1 flex flex-col min-w-0
          ${!roomId || isMobileListVisible ? 'hidden sm:flex' : 'flex'}
        `}
      >
        {/* Mobile back button */}
        {roomId && (
          <button
            onClick={() => {
              setIsMobileListVisible(true);
              navigate('/chat');
            }}
            className="sm:hidden flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)] text-[var(--color-accent)] font-semibold text-sm"
          >
            <ArrowLeft size={18} /> Quay lại
          </button>
        )}

        {currentRoom ? (
          <ChatWindow 
            room={currentRoom} 
            onToggleInfo={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
            onMediaClick={(url) => setActiveMediaUrl(url)}
          />
        ) : (
          /* Empty state khi chưa chọn room */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[var(--color-bg-primary)]">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-5">
              <MessageSquare size={36} className="text-[var(--color-accent)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
              Tin nhắn của bạn
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm max-w-[260px]">
              Chọn một đoạn chat hoặc bắt đầu cuộc trò chuyện mới để nhắn tin với bạn bè.
            </p>
          </div>
        )}
      </div>

      {/* ===== RIGHT SIDEBAR: Chat Info ===== */}
      {currentRoom && isInfoSidebarOpen && (
        <div className="hidden lg:flex w-[320px] shrink-0">
          <ChatInfoSidebar 
            room={currentRoom} 
            onClose={() => setIsInfoSidebarOpen(false)}
            onMediaClick={(url) => setActiveMediaUrl(url)}
          />
        </div>
      )}

      {/* Global Media Lightbox for ChatPage */}
      {activeMediaUrl && currentRoom && (
        <GlobalChatLightbox roomId={currentRoom.id} activeUrl={activeMediaUrl} onClose={() => setActiveMediaUrl(null)} />
      )}
    </div>
  );
};

// Helper component to fetch all media and display lightbox
const GlobalChatLightbox = ({ roomId, activeUrl, onClose }: { roomId: number, activeUrl: string, onClose: () => void }) => {
  const { data: mediaGallery } = useQuery({
    queryKey: ['chat-media', roomId],
    queryFn: () => chatApi.getMediaGallery(roomId),
  });

  if (!mediaGallery) return null;
  const urls = mediaGallery.map(m => m.mediaUrl).filter(Boolean) as string[];
  const initialIndex = urls.findIndex(url => url === activeUrl);

  return <MediaLightbox mediaUrls={urls} initialIndex={Math.max(0, initialIndex)} onClose={onClose} />;
};
