import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Phone, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { chatApi, type ChatMessage, type ChatMember } from '@/features/chat/api/chatApi';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { MessageInput } from '@/features/chat/components/MessageInput';
import { TypingIndicator } from '@/features/chat/components/TypingIndicator';
import { useChatSocket } from '@/features/chat/hooks/useChatSocket';
import { useTypingIndicator } from '@/features/chat/hooks/useTypingIndicator';
import { useAuthStore } from '@/store/useAuthStore';
import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { usePresenceStore } from '@/store/usePresenceStore';
import { MediaLightbox } from './MediaLightbox';

export const FloatingChatWindow = ({ roomId }: { roomId: number }) => {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const closeChat = useFloatingChatStore((state) => state.closeChat);
  const isOnline = usePresenceStore((state) => state.isOnline);
  const getLastSeen = usePresenceStore((state) => state.getLastSeen);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [activeMediaUrl, setActiveMediaUrl] = useState<string | null>(null);

  // Feature 1: Read receipts state
  const [readReceipts, setReadReceipts] = useState<Record<number, ChatMember[]>>({});

  // Fetch room detail
  const { data: roomInfo } = useQuery({
    queryKey: ['chat-room', roomId],
    queryFn: () => chatApi.getRoom(roomId),
  });

  // Feature 1: Fetch members for read receipts
  const { data: members } = useQuery({
    queryKey: ['chat-members', roomId],
    queryFn: () => chatApi.getGroupMembers(roomId),
  });

  // Fetch messages
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['messages', roomId],
    queryFn: ({ pageParam = 0 }) => chatApi.getMessages(roomId, pageParam, 30),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) =>
      lastPage.last ? undefined : (lastPage.number ?? 0) + 1,
  });

  // Flatten messages
  useEffect(() => {
    if (!data) return;
    const allMessages = data.pages.flatMap((p: any) => p.content || []).reverse();
    setMessages(allMessages);

    if (allMessages.length > 0 && currentUser) {
      const lastMsg = allMessages[allMessages.length - 1];
      if (lastMsg.senderUsername !== currentUser.username) {
        chatApi.markAsRead(roomId, lastMsg.id).catch(console.error);
        queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
        queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
      }
    }
  }, [data, currentUser, roomId, queryClient]);

  // Feature 1: Compute read receipts from members
  useEffect(() => {
    if (!members || !currentUser) return;
    const receipts: Record<number, ChatMember[]> = {};
    members.forEach((m) => {
      if (m.username === currentUser.username) return;
      if (m.lastReadMessageId) {
        if (!receipts[m.lastReadMessageId]) receipts[m.lastReadMessageId] = [];
        receipts[m.lastReadMessageId].push(m);
      }
    });
    setReadReceipts(receipts);
  }, [members, currentUser]);

  // Feature: Bấm ESC để đóng chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeChat(roomId);
      }
    };
    // Dùng window event listener để bắt sự kiện ngay cả khi focus đang ở chỗ khác
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomId, closeChat]);

  // Auto-scroll
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    } else if (!isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop < 50 && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    if (currentUser && msg.senderUsername !== currentUser.username) {
      chatApi.markAsRead(roomId, msg.id).catch(console.error);
    }
    queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
    queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
  }, [queryClient, currentUser, roomId]);

  const handleMessageUpdated = useCallback((updated: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  const handleTypingEvent = useCallback(({ username, isTyping }: { username: string; isTyping: boolean }) => {
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (isTyping) {
      setTypingUser(username);
      typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
    } else {
      setTypingUser(null);
    }
  }, []);

  // Feature 1: Handle read receipts
  const handleReadReceipt = useCallback((payload: { userId: number; messageId: number }) => {
    if (!members || !currentUser || payload.userId === currentUser.id) return;
    setReadReceipts((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((msgId) => {
        next[Number(msgId)] = next[Number(msgId)].filter((m) => m.userId !== payload.userId);
        if (next[Number(msgId)].length === 0) delete next[Number(msgId)];
      });
      if (!next[payload.messageId]) next[payload.messageId] = [];
      const member = members.find((m) => m.userId === payload.userId);
      if (member) next[payload.messageId].push(member);
      return next;
    });
  }, [members, currentUser]);

  const { sendTyping } = useChatSocket({
    roomId,
    onMessage: handleNewMessage,
    onTyping: handleTypingEvent,
    onMessageUpdated: handleMessageUpdated,
    onReadReceipt: handleReadReceipt,
  });

  const { handleTyping, stopTyping } = useTypingIndicator(sendTyping);

  if (!roomInfo) return null;

  const displayName = roomInfo.roomName || 'Cuộc trò chuyện';
  const avatar = roomInfo.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

  // Feature 4: Real-time online dot
  // Lấy username của người chat cùng (không phải displayName)
  const otherMember = members?.find(m => m.username !== currentUser?.username);
  const online = roomInfo.roomType === 'PRIVATE' && otherMember ? isOnline(otherMember.username) : false;

  return (
    <div className="w-[330px] h-[450px] bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-t-xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-b border-[var(--color-border-light)] shadow-sm cursor-pointer group">
        <Link to={`/chat/${roomId}`} onClick={() => closeChat(roomId)} className="flex items-center gap-2 flex-1 min-w-0 hover:bg-slate-50 p-1 rounded-lg transition-colors">
          <div className="relative">
            <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
            {/* Feature 4: Real-time online dot */}
            {roomInfo.roomType === 'PRIVATE' && (
              <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white transition-colors duration-500 ${online ? 'bg-green-500' : 'bg-slate-300'
                }`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-[13px] text-slate-800 truncate">{displayName}</h4>
            <span className={`text-[10px] font-medium transition-colors duration-300 ${online ? 'text-green-500' : 'text-slate-400'}`}>
              {roomInfo.roomType === 'GROUP' ? `${roomInfo.memberCount || members?.length || 0} thành viên` : online ? 'Đang hoạt động' : (() => {
                const otherUsername = otherMember?.username;
                const lastSeen = otherUsername ? getLastSeen(otherUsername) : undefined;
                if (lastSeen) {
                  try {
                    return `Hoạt động ${formatDistanceToNow(new Date(lastSeen), { addSuffix: false, locale: vi })} trước`;
                  } catch { return 'Ngoại tuyến'; }
                }
                return 'Ngoại tuyến';
              })()}
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[var(--color-accent)] transition-colors"><Phone size={16} /></button>
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-[var(--color-accent)] transition-colors"><Video size={16} /></button>
          <button onClick={() => closeChat(roomId)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-50 custom-scrollbar" onScroll={handleScroll}>
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onMessageUpdated={handleMessageUpdated}
            readByUsers={readReceipts[msg.id]} // Feature 1: pass read receipts
            onReply={() => setReplyingTo(msg)}
            onMediaClick={(url) => setActiveMediaUrl(url)}
          />
        ))}
        {typingUser && <TypingIndicator name={typingUser} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[var(--color-border-light)] p-1">
        <MessageInput
          roomId={roomId}
          onMessageSent={(msg) => { handleNewMessage(msg); setReplyingTo(null); }}
          onTyping={handleTyping}
          onStopTyping={stopTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {activeMediaUrl && (
        <MediaLightbox
          mediaUrls={messages.map(m => m.mediaUrl).filter(Boolean) as string[]}
          initialIndex={messages.filter(m => m.mediaUrl).findIndex(m => m.mediaUrl === activeMediaUrl)}
          onClose={() => setActiveMediaUrl(null)}
        />
      )}
    </div>
  );
};
