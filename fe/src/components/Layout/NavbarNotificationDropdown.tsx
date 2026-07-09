import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { notificationApi, NOTIFICATION_TEXT, type Notification } from '@/api/notificationApi';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Chuyển deepLink từ format của Backend sang đường dẫn React Router của FE.
 *
 * Mapping:
 *   /users/{username}    → /profile/{username}
 *   /posts/{id}          → /post/{id}          ← Route mới vừa thêm
 *   /chat/rooms/{id}     → /chat/{id}
 *
 * Fallback theo loại notification nếu deepLink null/empty.
 */
const resolveNavUrl = (notif: Notification): string => {
  if (notif.deepLink) {
    // BE /users/{username} → FE /profile/{username}
    if (notif.deepLink.startsWith('/users/')) {
      return notif.deepLink.replace('/users/', '/profile/');
    }
    // BE /posts/{id} → FE /post/{id}
    if (notif.deepLink.startsWith('/posts/')) {
      return notif.deepLink.replace('/posts/', '/post/');
    }
    // BE /chat/rooms/{id} → FE /chat/{id}
    if (notif.deepLink.startsWith('/chat/rooms/')) {
      return notif.deepLink.replace('/chat/rooms/', '/chat/');
    }
    // BE /groups/{id} → FE /groups/{id} (giữ nguyên)
    if (notif.deepLink.startsWith('/groups/')) {
      return notif.deepLink;
    }
    return notif.deepLink;
  }

  // Fallback theo type nếu deepLink null
  switch (notif.type) {
    case 'FRIEND_REQ':
    case 'FRIEND_ACCEPT':
    case 'FOLLOWED':
      return `/profile/${notif.actorUsername}`;
    case 'LIKE_POST':
    case 'COMMENT':
    case 'SHARE_POST':
    case 'LIKE_COMMENT':
    case 'MENTION':
      return notif.targetId ? `/post/${notif.targetId}` : '/';
    case 'GROUP_INVITE':
    case 'GROUP_JOIN_REQUEST':
    case 'GROUP_JOIN_ACCEPT':
    case 'GROUP_POST_APPROVED':
    case 'GROUP_KICK':
      return notif.targetId ? `/groups/${notif.targetId}` : '/groups';
    case 'STORY_REACT':
    case 'STORY_REPLY':
      return '/'; // Story mở qua StoryBar trên trang chủ
    default:
      return '/';
  }
};

const NotifSkeleton = () => (
  <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-slate-200 flex-none" />
    <div className="flex-1 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-4/5" />
      <div className="h-2.5 bg-slate-200 rounded w-2/5" />
    </div>
  </div>
);

const NotificationItem = ({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: number, deepLink: string) => void;
}) => {
  const meta = NOTIFICATION_TEXT[notif.type] || { icon: '🔔', text: 'đã tương tác với bạn' };
  const timeAgo = formatTimeAgo(notif.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRead(notif.id, resolveNavUrl(notif))}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onRead(notif.id, resolveNavUrl(notif));
        }
      }}
      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--color-bg-hover)] transition-colors duration-500 text-left relative cursor-pointer ${!notif.isRead ? 'bg-[var(--color-accent-light)]' : 'bg-transparent'
        }`}
    >
      {/* Actor avatar + type icon badge */}
      <div className="relative flex-none">
        <img
          src={notif.actorAvatarUrl || `https://i.pravatar.cc/150?u=${notif.actorId}`}
          alt={notif.actorFullName}
          className="w-11 h-11 rounded-full object-cover"
          loading="lazy"
        />
        <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">
          {meta.icon}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] leading-snug">
          <span className="font-semibold">{notif.actorFullName}</span>{' '}
          <span className="text-[var(--color-text-secondary)]">{meta.text}</span>
        </p>
        <span className={`text-[11px] font-medium mt-0.5 block ${!notif.isRead ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'
          }`}>
          {timeAgo}
        </span>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRead(notif.id, '');
          }}
          className="flex-none w-2.5 h-2.5 bg-[var(--color-accent)] rounded-full mt-2 shrink-0 hover:scale-125 transition-transform cursor-pointer z-10"
          title="Đánh dấu đã đọc"
        />
      )}
    </div>
  );
};

export const NavbarNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Unread count badge
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 30000,
    enabled: !!user,
  });

  // Infinite scroll notifications
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: ({ pageParam = 0 }) => notificationApi.getNotifications(pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) =>
      lastPage.last ? undefined : (lastPage.number ?? 0) + 1,
    enabled: isOpen && !!user,
  });

  const notifications: Notification[] = data?.pages.flatMap((p: any) => p.content || []) ?? [];

  // Mutation: mark single as read
  const markReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notif-unread-count'] });

      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousUnreadCount = queryClient.getQueryData(['notif-unread-count']);

      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((n: Notification) =>
              n.id === id ? { ...n, isRead: true } : n
            ),
          })),
        };
      });

      queryClient.setQueryData(['notif-unread-count'], (old: number = 0) => Math.max(0, old - 1));

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, id, context: any) => {
      if (context) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        queryClient.setQueryData(['notif-unread-count'], context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-unread-count'] });
    },
  });

  // Mutation: mark all as read
  const markAllMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      await queryClient.cancelQueries({ queryKey: ['notif-unread-count'] });

      const previousNotifications = queryClient.getQueryData(['notifications']);
      const previousUnreadCount = queryClient.getQueryData(['notif-unread-count']);

      queryClient.setQueryData(['notifications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            content: page.content.map((n: Notification) => ({ ...n, isRead: true })),
          })),
        };
      });

      queryClient.setQueryData(['notif-unread-count'], 0);

      return { previousNotifications, previousUnreadCount };
    },
    onError: (err, variables, context: any) => {
      if (context) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
        queryClient.setQueryData(['notif-unread-count'], context.previousUnreadCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notif-unread-count'] });
    },
  });


  // Infinite scroll detection
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRead = (id: number, navUrl: string) => {
    markReadMutation.mutate(id);
    if (navUrl) {
      setIsOpen(false);
      if (navUrl !== '/') navigate(navUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="navbar-icon-btn relative"
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[400px] bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] shadow-2xl rounded-xl overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--color-border-light)] flex items-center justify-between">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)]">Thông báo</h3>
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending || unreadCount === 0}
              className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              title="Đánh dấu tất cả đã đọc"
            >
              <CheckCheck size={14} />
              Đánh dấu tất cả đã đọc
            </button>
          </div>

          {/* Notification list (infinite scroll) */}
          <div
            ref={listRef}
            className="max-h-[480px] overflow-y-auto custom-scrollbar divide-y divide-[var(--color-border-light)]"
            onScroll={handleScroll}
          >
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <NotifSkeleton key={i} />)
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-[var(--color-text-secondary)]">
                <Bell size={40} className="opacity-20 mb-3" />
                <p className="text-sm font-medium">Không có thông báo nào</p>
              </div>
            ) : (
              <>
                {notifications.map((notif) => (
                  <NotificationItem key={notif.id} notif={notif} onRead={handleRead} />
                ))}
                {isFetchingNextPage && (
                  <div className="flex justify-center py-3">
                    <div className="w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {!hasNextPage && notifications.length > 0 && (
                  <p className="text-center text-xs text-[var(--color-text-secondary)] py-3 opacity-60">
                    Đã xem tất cả thông báo
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
