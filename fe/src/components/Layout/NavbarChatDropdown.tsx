import { useState, useRef, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/features/chat/api/chatApi';
import { ConversationItem } from '@/features/chat/components/ConversationItem';
import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Link } from 'react-router-dom';

export const NavbarChatDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const openChat = useFloatingChatStore((state) => state.openChat);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: chatApi.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!user,
  });

  const { data: inbox } = useQuery({
    queryKey: ['chat-inbox'],
    queryFn: () => chatApi.getInbox(0, 5),
    enabled: isOpen && !!user,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoomClick = (roomId: number, e: React.MouseEvent) => {
    e.preventDefault();
    openChat(roomId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-icon-btn hidden sm:flex relative"
      >
        <MessageCircle size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[360px] bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] shadow-2xl rounded-xl overflow-hidden z-50">
          <div className="p-3 border-b border-[var(--color-border-light)] flex justify-between items-center">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Đoạn chat</h3>
            <Link to="/chat" onClick={() => setIsOpen(false)} className="text-sm text-[var(--color-accent)] hover:underline">
              Xem tất cả trong Messenger
            </Link>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
            {!inbox ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : inbox.content.length === 0 ? (
              <div className="text-center p-4 text-[var(--color-text-secondary)]">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              inbox.content.map((room) => (
                <ConversationItem 
                  key={room.id} 
                  room={room} 
                  onClick={(e) => handleRoomClick(room.id, e)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
