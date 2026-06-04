import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Pencil, Trash2, SmilePlus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { chatApi, type ChatMessage, type ChatMember } from '../api/chatApi';
import { useAuthStore } from '@/store/useAuthStore';
import { Link } from 'react-router-dom';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '😡'];

const EMOJI_TO_REACTION_TYPE: Record<string, string> = {
  '👍': 'LIKE',
  '❤️': 'HEART',
  '😂': 'HAHA',
  '😮': 'WOW',
  '😢': 'SAD',
  '😡': 'ANGRY'
};

interface MessageBubbleProps {
  message: ChatMessage;
  onMessageUpdated: (msg: ChatMessage) => void;
  readByUsers?: ChatMember[];
  onReply?: () => void;
  onMediaClick?: (url: string) => void;
}

export const MessageBubble = ({ message, onMessageUpdated, readByUsers, onReply, onMediaClick }: MessageBubbleProps) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const isMine = user?.username === message.senderUsername;
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content || '');

  const isRecalled = message.isRecalled;

  const editMutation = useMutation({
    mutationFn: (content: string) => chatApi.editMessage(message.id, content),
    onSuccess: (updated) => {
      onMessageUpdated(updated);
      setIsEditing(false);
    },
  });

  const recallMutation = useMutation({
    mutationFn: () => chatApi.recallMessage(message.id),
    onSuccess: () => {
      onMessageUpdated({ ...message, isRecalled: true, content: undefined });
    },
  });

  const reactMutation = useMutation({
    mutationFn: (type: string) => chatApi.reactToMessage(message.id, type),
    onSuccess: (updated) => {
      onMessageUpdated(updated);
      setShowReactions(false);
    },
  });

  // Auto-refresh timestamp mỗi 30 giây
  const [timeAgo, setTimeAgo] = useState(() =>
    formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeAgo(formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: vi }));
    }, 30000);
    return () => clearInterval(timer);
  }, [message.createdAt]);

  // Group reactions by type
  const reactionGroups = (message.reactions || []).reduce((acc: Record<string, number>, r) => {
    acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
    return acc;
  }, {});

  const reactionEmoji: Record<string, string> = {
    LIKE: '👍', HEART: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡'
  };

  return (
    <div className={`flex items-end gap-2 group px-4 py-0.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar (chỉ hiện với người khác) */}
      {!isMine && (
        <Link to={`/profile/${message.senderUsername}`} className="flex-none self-end mb-1">
          <img
            src={message.senderAvatarUrl || `https://i.pravatar.cc/150?u=${message.senderId}`}
            alt={message.senderFullName}
            className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
            title={message.senderFullName}
          />
        </Link>
      )}

      <div className={`flex flex-col max-w-[65%] ${isMine ? 'items-end' : 'items-start'}`}>
        {/* Sender name (chỉ hiện trong group và không phải tin của mình) */}
        {!isMine && message.senderFullName && (
          <Link to={`/profile/${message.senderUsername}`} className="text-[11px] text-[var(--color-text-secondary)] hover:underline mb-1 px-1">
            {message.senderFullName}
          </Link>
        )}

        <div className="relative">
          {/* Bubble */}
          {isRecalled ? (
            <div className={`px-4 py-2 rounded-2xl text-sm italic text-[var(--color-text-secondary)] border border-[var(--color-border-light)] ${
              isMine ? 'rounded-br-none' : 'rounded-bl-none'
            }`}>
              Tin nhắn đã bị thu hồi
            </div>
          ) : isEditing ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') editMutation.mutate(editText);
                  if (e.key === 'Escape') setIsEditing(false);
                }}
                className="border border-[var(--color-accent)] rounded-xl px-3 py-2 text-sm outline-none bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
              />
              <button
                onClick={() => editMutation.mutate(editText)}
                className="text-[var(--color-accent)] text-xs font-semibold hover:underline"
              >
                Lưu
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-[var(--color-text-secondary)] text-xs hover:underline"
              >
                Hủy
              </button>
            </div>
          ) : (
            <>
              {/* Replied Message Banner */}
              {message.replyToMessageId && (
                <div className={`mb-1 px-3 py-2 rounded-xl text-xs opacity-80 cursor-pointer hover:opacity-100 transition-opacity bg-black/5 dark:bg-white/10 flex flex-col border-l-2 ${isMine ? 'border-[var(--color-accent)]' : 'border-[var(--color-text-secondary)]'}`}>
                  <span className="font-bold mb-0.5">{message.replyToSenderName}</span>
                  <span className="truncate max-w-[200px]">{message.replyToMessageContent}</span>
                </div>
              )}

              {/* Media */}
              {message.mediaUrl && (
                <div className="mb-1 rounded-xl overflow-hidden max-w-[240px]" onClick={() => onMediaClick && onMediaClick(message.mediaUrl!)}>
                  {message.mediaType === 'VIDEO' ? (
                    <video src={message.mediaUrl} className="w-full rounded-xl cursor-pointer hover:brightness-90 transition" />
                  ) : (
                    <img
                      src={message.mediaUrl}
                      alt="media"
                      className="w-full rounded-xl object-cover cursor-pointer hover:brightness-90 transition"
                    />
                  )}
                </div>
              )}

              {/* Text bubble */}
              {message.content && (
                <div
                  className={`px-4 py-2 rounded-2xl text-sm break-words ${
                    isMine
                      ? 'bg-[var(--color-accent)] text-white rounded-br-none'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-bl-none'
                  }`}
                >
                  {message.content}
                  {message.isEdited && (
                    <span className={`text-[10px] ml-2 ${isMine ? 'text-white/60' : 'text-[var(--color-text-secondary)]'}`}>
                      (đã sửa)
                    </span>
                  )}
                </div>
              )}

              {/* Hover action buttons */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${
                  isMine ? 'right-full mr-2' : 'left-full ml-2'
                }`}
              >
                {/* Quick reaction */}
                <div className="relative">
                  <button
                    onClick={() => { if (onReply) onReply(); }}
                    className="p-1.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] shadow-sm mr-1"
                    title="Trả lời"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                  </button>
                  <button
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-1.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] shadow-sm"
                  >
                    <SmilePlus size={15} />
                  </button>
                  {showReactions && (
                    <div className={`absolute bottom-full mb-1 flex gap-1 bg-white rounded-full shadow-xl border border-slate-100 px-2 py-1.5 z-50 ${isMine ? 'right-0' : 'left-0'}`}>
                      {QUICK_REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            const type = EMOJI_TO_REACTION_TYPE[emoji];
                            if (type) reactMutation.mutate(type);
                          }}
                          className="text-lg hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* More actions (chỉ tin của mình) */}
                {isMine && (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-1.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] shadow-sm"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {showMenu && (
                      <div className="absolute bottom-full right-0 mb-1 w-36 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50">
                        {message.content && (
                          <button
                            onClick={() => { setIsEditing(true); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-slate-700"
                          >
                            <Pencil size={14} /> Sửa
                          </button>
                        )}
                        <button
                          onClick={() => { recallMutation.mutate(); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-red-600"
                        >
                          <Trash2 size={14} /> Thu hồi
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Reaction counts */}
        {Object.keys(reactionGroups).length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {Object.entries(reactionGroups).map(([type, count]) => (
              <span
                key={type}
                className="text-xs bg-white border border-slate-100 shadow-sm rounded-full px-1.5 py-0.5"
              >
                {reactionEmoji[type] || type} {count > 1 && count}
              </span>
            ))}
          </div>
        )}

        {/* Time */}
        <span className="text-[10px] text-[var(--color-text-secondary)] mt-0.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {timeAgo}
        </span>

        {/* Read Receipts — chỉ hiện trên tin nhắn mình gửi */}
        {isMine && readByUsers && readByUsers.length > 0 && (
          <div className={`flex items-center gap-0.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
            {readByUsers.slice(0, 3).map((member) => (
              <img
                key={member.userId}
                src={member.avatarUrl || `https://i.pravatar.cc/150?u=${member.userId}`}
                alt={member.fullName}
                title={`Đã xem bởi ${member.fullName}`}
                className="w-3.5 h-3.5 rounded-full object-cover border border-white shadow-sm"
              />
            ))}
            {readByUsers.length > 3 && (
              <span className="text-[9px] text-[var(--color-text-secondary)] ml-1">
                +{readByUsers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
