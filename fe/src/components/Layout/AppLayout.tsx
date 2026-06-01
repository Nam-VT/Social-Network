import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Rightbar } from './Rightbar';
import { useUIStore } from '@/store/useUIStore';
import { useNotificationSocket, type NotificationPayload } from '@/hooks/useNotificationSocket';
import { useGlobalChatSocket, type ChatNotificationPayload } from '@/features/chat/hooks/useGlobalChatSocket';
import { usePresenceSocket } from '@/hooks/usePresenceSocket';
import { useAuthSync } from '@/hooks/useAuthSync';
import { FloatingChatContainer } from '@/features/chat/components/FloatingChatContainer';
import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { Bell, MessageCircle, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ToastContainer } from '@/components/ui/Toast';
import '@/styles/layout/app-layout.css';

const NOTIFICATION_MESSAGES: Record<string, string> = {
  LIKE_POST: 'đã thả cảm xúc về bài viết của bạn',
  LIKE_COMMENT: 'đã thả cảm xúc về bình luận của bạn',
  COMMENT: 'đã bình luận về bài viết của bạn',
  FRIEND_REQ: 'đã gửi lời mời kết bạn',
  FOLLOWED: 'đã theo dõi bạn',
  STORY_REACT: 'đã thả cảm xúc vào story của bạn',
  STORY_REPLY: 'đã phản hồi story của bạn',
};

export const AppLayout = () => {
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  const navigate = useNavigate();
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  const openChat = useFloatingChatStore((state) => state.openChat);

  // Feature #3: Real-time Notifications
  const [toastNotification, setToastNotification] = useState<NotificationPayload | null>(null);
  
  // Real-time Chat Notifications
  const [chatToast, setChatToast] = useState<ChatNotificationPayload | null>(null);

  const queryClient = useQueryClient();

  const handleNotification = (notification: NotificationPayload) => {
    setToastNotification(notification);
    // Tính năng: invalid query để cập nhật badge số và danh sách trong NavbarNotificationDropdown
    queryClient.invalidateQueries({ queryKey: ['notif-unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    // Feature: Âm thanh ping cho thông báo chung
    import('@/utils/messageNotification').then(({ playMessageSound }) => {
      playMessageSound();
    });
  };

  const handleChatNotification = (payload: ChatNotificationPayload) => {
    setChatToast(payload);
  };

  useNotificationSocket(handleNotification);
  useGlobalChatSocket(handleChatNotification);
  usePresenceSocket(); // Feature 4: Real-time presence
  useAuthSync();       // Feature 3: Auto-sync user profile

  // Auto dismiss toast after 4s
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => setToastNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Auto dismiss chat toast after 4s
  useEffect(() => {
    if (chatToast) {
      const timer = setTimeout(() => setChatToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [chatToast]);

  return (
    <div className="app-layout-wrapper">
      <Navbar />
      <ToastContainer />

      {/* Feature #3: Notification Toast */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-[200] animate-slide-in-right max-w-[360px] w-full">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex items-start gap-3">
            <div className="flex-none w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <Bell size={18} className="text-[var(--color-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <img
                  src={toastNotification.actorAvatarUrl || 'https://i.pravatar.cc/150'}
                  className="w-8 h-8 rounded-full flex-none"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{toastNotification.actorFullName}</span>{' '}
                    {NOTIFICATION_MESSAGES[toastNotification.type] || 'đã tương tác với bạn'}
                  </p>
                  <span className="text-[11px] text-slate-400">Vừa xong</span>
                </div>
              </div>
            </div>
            <button
              className="flex-none p-1 rounded-full hover:bg-slate-100 transition-colors"
              onClick={() => setToastNotification(null)}
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Notification Toast */}
      {chatToast && (
        <div 
          className="fixed bottom-4 left-4 sm:left-auto sm:right-4 z-[200] animate-slide-in-right max-w-[360px] w-full cursor-pointer hover:scale-105 transition-transform"
          onClick={() => {
            if (isChatPage) {
              navigate(`/chat/${chatToast.room.id}`);
            } else {
              openChat(chatToast.room.id);
            }
            setChatToast(null);
          }}
        >
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-3 flex items-start gap-3">
            <div className="flex-none w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
              <MessageCircle size={18} className="text-[var(--color-accent)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <img
                  src={chatToast.message.senderAvatarUrl || 'https://i.pravatar.cc/150'}
                  className="w-10 h-10 rounded-full flex-none object-cover"
                  alt=""
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 font-semibold truncate">
                    {chatToast.message.senderFullName}
                    {chatToast.room.roomType === 'GROUP' && <span className="text-slate-500 font-normal"> trong {chatToast.room.roomName}</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {chatToast.message.content || (chatToast.message.mediaType === 'VIDEO' ? 'Đã gửi một video' : 'Đã gửi một ảnh')}
                  </p>
                </div>
              </div>
            </div>
            <button
              className="flex-none p-1 rounded-full hover:bg-slate-100 transition-colors"
              onClick={(e) => { e.stopPropagation(); setChatToast(null); }}
            >
              <X size={14} className="text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-drawer-overlay ${isMobileMenuOpen ? 'open' : 'closed'}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Drawer Content */}
      <aside className={`mobile-drawer-content ${isMobileMenuOpen ? 'open' : 'closed'}`}>
        <Sidebar />
      </aside>

      {/* Floating Chats */}
      {!isChatPage && <FloatingChatContainer />}

      <div className={`app-layout-main ${isChatPage ? 'chat-mode' : ''}`}>
        {/* Left Sidebar (Desktop) */}
        {!isChatPage && (
          <aside className="app-layout-sidebar">
            <Sidebar />
          </aside>
        )}

        {/* Center Content (Newsfeed/Profile/etc) */}
        <main className={`app-layout-content ${isChatPage ? 'p-0 w-full max-w-none' : ''}`}>
          <Outlet />
        </main>

        {/* Right Sidebar (Desktop) */}
        {!isChatPage && (
          <aside className="app-layout-rightbar">
            <Rightbar />
          </aside>
        )}
      </div>
    </div>
  );
};

