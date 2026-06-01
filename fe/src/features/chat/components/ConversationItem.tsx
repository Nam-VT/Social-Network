import { NavLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ChatRoom } from '../api/chatApi';
import { usePresenceStore } from '@/store/usePresenceStore';

interface ConversationItemProps {
  room: ChatRoom;
  isActive?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const ConversationItem = ({ room, isActive, onClick }: ConversationItemProps) => {
  const displayName = room.roomName || 'Cuộc trò chuyện';
  const avatar = room.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
  const isOnline = usePresenceStore((state) => state.isOnline);

  const timeAgo = room.lastMessageAt
    ? formatDistanceToNow(new Date(room.lastMessageAt), { addSuffix: true, locale: vi })
    : '';

  const itemContent = (
    <>
      {/* Avatar */}
      <div className="relative flex-none">
        <img
          src={avatar}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover border border-[var(--color-border-light)]"
        />
        {/* Online dot (chỉ hiện với DM, real-time từ PresenceStore) */}
        {room.roomType === 'PRIVATE' && (
          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[var(--color-bg-secondary)] transition-colors duration-500 ${
            isOnline(displayName) ? 'bg-green-400' : 'bg-slate-300'
          }`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`font-semibold text-sm truncate text-[var(--color-text-primary)] ${room.unreadCount > 0 ? 'font-bold' : ''}`}>
            {displayName}
          </span>
          <span className="text-[11px] text-[var(--color-text-secondary)] flex-none">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p className={`text-xs truncate ${room.unreadCount > 0 ? 'text-[var(--color-text-primary)] font-semibold' : 'text-[var(--color-text-secondary)]'}`}>
            {room.lastMessagePreview || 'Hãy bắt đầu cuộc trò chuyện'}
          </p>
          {room.unreadCount > 0 && (
            <span className="flex-none w-5 h-5 rounded-full bg-[var(--color-accent)] text-white text-[10px] flex items-center justify-center font-bold">
              {room.unreadCount > 9 ? '9+' : room.unreadCount}
            </span>
          )}
        </div>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-bg-hover)] group ${
          isActive ? 'bg-[var(--color-accent)]/10 border-l-[3px] border-[var(--color-accent)]' : ''
        }`}
      >
        {itemContent}
      </button>
    );
  }

  return (
    <NavLink
      to={`/chat/${room.id}`}
      className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--color-bg-hover)] group ${
        isActive ? 'bg-[var(--color-accent)]/10 border-l-[3px] border-[var(--color-accent)]' : ''
      }`}
    >
      {itemContent}
    </NavLink>
  );
};
