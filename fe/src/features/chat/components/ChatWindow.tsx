import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Phone, Video, Info } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { chatApi, type ChatMessage, type ChatRoom, type ChatMember } from '../api/chatApi';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useChatSocket } from '../hooks/useChatSocket';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { usePresenceStore } from '@/store/usePresenceStore';
import { useTimeTick } from '@/hooks/useTimeTick';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { MediaLightbox } from './MediaLightbox';

const MessageSkeleton = () => (
  <div className="px-4 py-1 flex flex-col gap-2 animate-pulse">
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex-none" />
      <div className="h-10 w-48 bg-slate-200 rounded-2xl rounded-bl-none" />
    </div>
    <div className="flex justify-end">
      <div className="h-10 w-56 bg-slate-300 rounded-2xl rounded-br-none" />
    </div>
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex-none" />
      <div className="h-8 w-32 bg-slate-200 rounded-2xl rounded-bl-none" />
    </div>
  </div>
);

interface ChatWindowProps {
  room: ChatRoom;
  onToggleInfo?: () => void;
  onMediaClick?: (url: string) => void;
}

export const ChatWindow = ({ room, onToggleInfo, onMediaClick }: ChatWindowProps) => {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const currentUser = useAuthStore((state) => state.user);
  const isOnline = usePresenceStore((state) => state.isOnline);
  const getLastSeen = usePresenceStore((state) => state.getLastSeen);

  // Auto-refresh mỗi 30s để cập nhật trạng thái "Hoạt động X phút trước"
  useTimeTick(30_000);

  const [readReceipts, setReadReceipts] = useState<Record<number, ChatMember[]>>({});

  // Feature #1: Reply
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Fetch members to get their avatars and initial lastReadMessageId
  const { data: members } = useQuery({
    queryKey: ['chat-members', room.id],
    queryFn: () => chatApi.getGroupMembers(room.id),
  });

  // Fetch lịch sử tin nhắn (infinite scroll ngược)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['messages', room.id],
    queryFn: ({ pageParam = 0 }) => chatApi.getMessages(room.id, pageParam, 30),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) =>
      lastPage.last ? undefined : (lastPage.number ?? 0) + 1,
  });

  // Flatten và sort messages (cũ → mới)
  useEffect(() => {
    if (!data) return;
    const allMessages = data.pages
      .flatMap((p: any) => p.content || [])
      .reverse(); // API trả về mới nhất trước, cần đảo lại
    setMessages(allMessages);

    // Đánh dấu đã đọc tin nhắn cuối cùng nếu mình không phải người gửi
    if (allMessages.length > 0 && currentUser) {
      const lastMsg = allMessages[allMessages.length - 1];
      if (lastMsg.senderId !== currentUser.id) {
        chatApi.markAsRead(room.id, lastMsg.id).catch(console.error);
        queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
        queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
      }
    }
  }, [data, currentUser, room.id, queryClient]);

  // Compute read receipts from members data
  useEffect(() => {
    if (!members || !currentUser) return;
    
    const receipts: Record<number, ChatMember[]> = {};
    members.forEach((m) => {
      // Bỏ qua bản thân mình
      if (m.userId === currentUser.id) return;
      if (m.lastReadMessageId) {
        if (!receipts[m.lastReadMessageId]) receipts[m.lastReadMessageId] = [];
        receipts[m.lastReadMessageId].push(m);
      }
    });
    setReadReceipts(receipts);
  }, [members, currentUser]);

  // Auto-scroll xuống cuối khi load lần đầu hoặc có tin mới
  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' });
      isFirstLoad.current = false;
    } else if (!isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Detect scroll lên đầu để load thêm tin cũ
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop } = e.currentTarget;
      if (scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  // Callback khi nhận tin mới qua WebSocket
  const handleNewMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.find((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
    // Đánh dấu đã đọc nếu đang mở cửa sổ này
    if (currentUser && msg.senderId !== currentUser.id) {
      chatApi.markAsRead(room.id, msg.id).catch(console.error);
    }
    // Cập nhật inbox preview
    queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
    queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
  }, [queryClient, currentUser, room.id]);

  // Callback khi tin bị sửa/thu hồi
  const handleMessageUpdated = useCallback((updated: ChatMessage) => {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }, []);

  // Callback khi nhận typing event
  const handleTypingEvent = useCallback(
    ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTyping) {
        setTypingUser(username);
        typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
      } else {
        setTypingUser(null);
      }
    },
    []
  );

  // Callback khi nhận được read receipt từ người khác
  const handleReadReceipt = useCallback((payload: { userId: number; messageId: number }) => {
    if (!members || !currentUser || payload.userId === currentUser.id) return;
    
    setReadReceipts((prev) => {
      const next = { ...prev };
      // Xóa người này khỏi các message cũ
      Object.keys(next).forEach((msgId) => {
        next[Number(msgId)] = next[Number(msgId)].filter((m) => m.userId !== payload.userId);
        if (next[Number(msgId)].length === 0) delete next[Number(msgId)];
      });
      // Thêm vào message mới
      if (!next[payload.messageId]) next[payload.messageId] = [];
      const member = members.find((m) => m.userId === payload.userId);
      if (member) next[payload.messageId].push(member);
      return next;
    });
  }, [members, currentUser]);

  // WebSocket
  const { sendTyping } = useChatSocket({
    roomId: room.id,
    onMessage: handleNewMessage,
    onTyping: handleTypingEvent,
    onMessageUpdated: handleMessageUpdated,
    onReadReceipt: handleReadReceipt,
  });

  const { handleTyping, stopTyping } = useTypingIndicator(sendTyping);

  const displayName = room.roomName || 'Cuộc trò chuyện';
  const avatar = room.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)] shadow-sm">
        <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-[var(--color-border-light)]" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[var(--color-text-primary)] truncate">{displayName}</div>
          <div className="text-xs font-medium">
            {(() => {
              const online = room.roomType === 'PRIVATE' && room.otherUsername ? isOnline(room.otherUsername) : false;
              if (room.roomType === 'GROUP') return <span className="text-slate-500">{room.memberCount || 0} thành viên</span>;
              if (online) return <span className="text-green-500">Đang hoạt động</span>;
              // Offline - hiển thị last seen
              const otherUsername = room.otherUsername;
              const lastSeen = otherUsername ? getLastSeen(otherUsername) : undefined;
              if (lastSeen) {
                try {
                  return <span className="text-slate-400">Hoạt động {formatDistanceToNow(new Date(lastSeen), { addSuffix: false, locale: vi })} trước</span>;
                } catch { return <span className="text-slate-400">Ngoại tuyến</span>; }
              }
              return <span className="text-slate-400">Ngoại tuyến</span>;
            })()}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-accent)] transition-colors" title="Gọi thoại">
            <Phone size={20} />
          </button>
          <button className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-accent)] transition-colors" title="Gọi video">
            <Video size={20} />
          </button>
          <button onClick={onToggleInfo} className="p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] transition-colors" title="Thông tin">
            <Info size={20} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto py-4 space-y-0.5"
        onScroll={handleScroll}
      >
        {/* Load more indicator */}
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <div className="w-6 h-6 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover mb-4 border-2 border-[var(--color-border-light)]" />
            <p className="font-bold text-lg text-[var(--color-text-primary)]">{displayName}</p>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Hãy bắt đầu cuộc trò chuyện! 👋
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onMessageUpdated={handleMessageUpdated}
              readByUsers={readReceipts[msg.id]}
              onReply={() => setReplyingTo(msg)}
              onMediaClick={onMediaClick}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingUser && <TypingIndicator name={typingUser} />}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[var(--color-border-light)] shrink-0">
        <MessageInput
          roomId={room.id}
          onMessageSent={(msg) => {
            handleNewMessage(msg);
            setReplyingTo(null);
          }}
          onTyping={handleTyping}
          onStopTyping={stopTyping}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>
    </div>
  );
};
