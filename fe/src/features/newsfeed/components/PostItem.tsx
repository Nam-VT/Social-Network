import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MoreHorizontal, MessageCircle, Share2, Bookmark, Globe, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '../api/postApi';
import { CommentItem } from './CommentItem';
import { ShareModal } from './ShareModal';
import { Lightbox } from './Lightbox';
import { MentionDropdown } from './MentionDropdown';
import { LazyImage } from '@/components/ui/LazyImage';
import { usePostCountSocket } from '@/hooks/usePostCountSocket';
import '@/styles/newsfeed/post-item.css';
import '@/styles/newsfeed/comment.css';

const renderContentWithMentions = (content: string, mentionedUsers?: Record<string, string>) => {
  if (!content) return null;
  // Regex an toàn hơn: Tách @mention, #hashtag, URL và <mark>highlight</mark>
  const parts = content.split(/(<mark>.*?<\/mark>|@\w+|#[a-zA-Z0-9_A-ZÀ-ỹ]+|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('<mark>') && part.endsWith('</mark>')) {
      const innerText = part.substring(6, part.length - 7);
      return <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded font-medium">{innerText}</mark>;
    } else if (part.startsWith('@')) {
      const username = part.substring(1);
      const displayName = (mentionedUsers && mentionedUsers[username]) ? mentionedUsers[username] : username;
      return (
        <Link key={i} to={`/profile/${username}`} className="font-semibold text-[var(--color-accent)] hover:underline" onClick={e => e.stopPropagation()}>
          {displayName}
        </Link>
      );
    } else if (part.startsWith('#')) {
      const tag = part.substring(1).toLowerCase();
      return (
        <Link key={i} to={`/hashtag/${tag}`} className="font-semibold text-[var(--color-accent)] hover:underline" onClick={e => e.stopPropagation()}>
          {part}
        </Link>
      );
    } else if (part.match(/^https?:\/\//)) {
      try {
        const url = new URL(part);
        if (url.origin === window.location.origin) {
          return (
            <Link key={i} to={url.pathname + url.search + url.hash} className="text-[var(--color-accent)] font-medium hover:underline break-all" onClick={e => e.stopPropagation()}>
              {part}
            </Link>
          );
        }
      } catch (e) {
        // Fallback if URL is invalid
      }
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] font-medium hover:underline break-all" onClick={e => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

// Post-level Skeleton (used by NewsfeedPage infinite scroll)
export const PostSkeleton = () => (
  <div className="post-wrapper animate-pulse">
    <div className="post-header">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 bg-slate-200 rounded w-32" />
          <div className="h-2.5 bg-slate-200 rounded w-24" />
        </div>
      </div>
    </div>
    <div className="px-4 py-3 space-y-2">
      <div className="h-3 bg-slate-200 rounded w-full" />
      <div className="h-3 bg-slate-200 rounded w-5/6" />
      <div className="h-3 bg-slate-200 rounded w-4/6" />
    </div>
    <div className="mx-4 mb-3 h-48 bg-slate-200 rounded-lg" />
    <div className="px-4 py-2 flex gap-4">
      <div className="h-8 bg-slate-200 rounded flex-1" />
      <div className="h-8 bg-slate-200 rounded flex-1" />
      <div className="h-8 bg-slate-200 rounded flex-1" />
    </div>
  </div>
);

export interface PostProps {
  post: {
    id: number | string;
    content: string;
    highlightedContent?: string;
    createdAt: string;
    authorId: number;
    authorUsername: string;
    authorFullName: string;
    authorAvatarUrl?: string;
    mediaList?: { id: number; mediaUrl: string; mediaType: string; position: number }[];
    likeCount: number;
    commentCount: number;
    shareCount: number;
    isLiked: boolean;
    myReaction?: string;
    isSaved: boolean;
    reactionCounts?: Record<string, number>;
    mentionedUsers?: Record<string, string>;
    groupId?: number | string;
    groupName?: string;
  };
  defaultShowComments?: boolean;
  onDeleted?: () => void; // Callback sau khi xóa bài thành công
}

const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Thích', color: 'var(--color-accent)' },
  { type: 'HEART', emoji: '❤️', label: 'Yêu thích', color: '#f02849' },
  { type: 'HAHA', emoji: '😂', label: 'Haha', color: '#f7b125' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: '#f7b125' },
  { type: 'SAD', emoji: '😢', label: 'Buồn', color: '#f7b125' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ', color: '#e9710f' },
];

// Feature #5: Skeleton Loading
const CommentSkeleton = () => (
  <div className="flex gap-2 items-start mb-3 animate-pulse">
    <div className="w-8 h-8 rounded-full bg-slate-200 flex-none" />
    <div className="flex-1">
      <div className="bg-slate-200 rounded-2xl px-3 py-3 w-3/4">
        <div className="h-3 bg-slate-300 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-300 rounded w-full" />
      </div>
      <div className="flex gap-3 mt-1.5 ml-2">
        <div className="h-2.5 bg-slate-200 rounded w-8" />
        <div className="h-2.5 bg-slate-200 rounded w-12" />
        <div className="h-2.5 bg-slate-200 rounded w-16" />
      </div>
    </div>
  </div>
);



export const PostItem = ({ post, defaultShowComments = false, onDeleted }: PostProps) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Reaction State
  const [reaction, setReaction] = useState<string | null>(post.myReaction || (post.isLiked ? 'LIKE' : null));
  const [likesCount, setLikesCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [shareCount, setShareCount] = useState(post.shareCount);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>(post.reactionCounts || {});
  const [isSaved, setIsSaved] = useState(post.isSaved);

  // Sync khi prop thay đổi (parent re-render)
  useEffect(() => {
    setReaction(post.myReaction || (post.isLiked ? 'LIKE' : null));
    setLikesCount(post.likeCount);
    setCommentCount(post.commentCount);
    setShareCount(post.shareCount);
    setReactionCounts(post.reactionCounts || {});
    setIsSaved(post.isSaved);
  }, [post.myReaction, post.isLiked, post.likeCount, post.commentCount, post.shareCount, post.reactionCounts, post.isSaved]);

  // Real-time WebSocket: cập nhật count khi có like/comment/share từ bất kỳ user nào
  usePostCountSocket(post.id, (payload) => {
    setLikesCount(payload.likeCount);
    setCommentCount(payload.commentCount);
    setShareCount(payload.shareCount);
    setReactionCounts(payload.reactionCounts as Record<string, number>);
  });

  // Comment Section State
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [commentText, setCommentText] = useState('');
  const [commentPage, setCommentPage] = useState(0);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Post Options State
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  // Feature: Read More
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isMyPost = user?.id === post.authorId || user?.role === 'ADMIN';

  const handleCopyLink = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Đã sao chép liên kết bài viết!');
        setShowOptions(false);
      });
    } else {
      // Fallback for HTTP (non-secure context)
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Đã sao chép liên kết bài viết!');
      } catch (err) {
        alert('Lỗi sao chép, vui lòng copy thủ công: ' + url);
      }
      document.body.removeChild(textArea);
      setShowOptions(false);
    }
  };

  // Feature #6: Share Modal
  const [showShareModal, setShowShareModal] = useState(false);

  // Feature #4: Mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [activeMentions, setActiveMentions] = useState<{display: string, username: string}[]>([]);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Parse reaction breakdown — dùng local state thay vì prop
  const reactionBreakdown = Object.entries(reactionCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => {
      const rDef = REACTIONS.find(r => r.type === type);
      return { type, count, emoji: rDef?.emoji || '👍', label: rDef?.label || 'Thích' };
    });

  // --- API MUTATIONS ---
  const deletePostMutation = useMutation({
    mutationFn: () => postApi.deletePost(post.id),
    onMutate: () => {
      setIsDeleted(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      onDeleted?.(); // Notify parent (e.g. GroupDetailPage) để refresh feed nhóm
    },
    onError: () => {
      setIsDeleted(false);
      alert('Có lỗi xảy ra khi xóa bài viết. Vui lòng thử lại.');
    }
  });

  const updatePostMutation = useMutation({
    mutationFn: (content: string) => postApi.updatePost(post.id, { content }),
    onSuccess: () => {
      setIsEditing(false);
      setShowOptions(false);
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    }
  });

  const reactMutation = useMutation({
    mutationFn: (type: string | null) => postApi.toggleReaction({
      targetId: post.id, targetType: 'POST', reactionType: type || 'LIKE'
    }),
    onError: () => queryClient.invalidateQueries({ queryKey: ['newsfeed'] })
  });

  const saveMutation = useMutation({
    mutationFn: (currentlySaved: boolean) =>
      currentlySaved ? postApi.unsavePost(post.id) : postApi.savePost(post.id),
    onSuccess: (_data, currentlySaved) => {
      // Cập nhật ngay lập tức query saved-posts
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
      // Nếu vừa lưu (không phải bỏ lưu), điều hướng sang tab Đã lưu
      if (!currentlySaved) {
        navigate('/saved');
      }
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['newsfeed'] })
  });

  const handleSelectReaction = (type: string) => {
    if (reaction === type) return;
    if (reaction === null) setLikesCount(prev => prev + 1);

    // Optimistic UI cho biểu đồ cảm xúc
    setReactionCounts(prev => {
      const newCounts = { ...prev };
      if (reaction) {
        newCounts[reaction] = Math.max(0, (newCounts[reaction] || 0) - 1);
      }
      newCounts[type] = (newCounts[type] || 0) + 1;
      return newCounts;
    });

    setReaction(type);
    reactMutation.mutate(type);
  };

  const handleToggleDefaultLike = () => {
    const newReaction = reaction ? null : 'LIKE';

    // Optimistic UI cho biểu đồ cảm xúc
    setReactionCounts(prev => {
      const newCounts = { ...prev };
      if (reaction) {
        newCounts[reaction] = Math.max(0, (newCounts[reaction] || 0) - 1);
      }
      if (newReaction) {
        newCounts[newReaction] = (newCounts[newReaction] || 0) + 1;
      }
      return newCounts;
    });

    setReaction(newReaction);
    setLikesCount(prev => reaction ? prev - 1 : prev + 1);
    reactMutation.mutate(newReaction);
  };

  // --- Feature #1: COMMENTS with PAGINATION ---
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ['comments', post.id, commentPage],
    queryFn: () => postApi.getComments(post.id, commentPage, 5),
    enabled: showComments,
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) => postApi.createComment({ postId: post.id, content: text }),
    onSuccess: () => {
      setCommentText('');
      setMentionQuery('');
      setActiveMentions([]);
      queryClient.invalidateQueries({ queryKey: ['comments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
    }
  });

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    let finalContent = commentText;
    activeMentions.forEach(m => {
      finalContent = finalContent.split(`@${m.display}`).join(`@${m.username}`);
    });
    commentMutation.mutate(finalContent);
  };

  // Feature #4: Handle @ mention in comment input
  const handleCommentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCommentText(val);

    // Detect @mention
    const cursorPos = e.target.selectionStart || val.length;
    const textBeforeCursor = val.substring(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
    } else {
      setMentionQuery('');
    }
  }, []);

  const handleMentionSelect = useCallback((selectedUser: any) => {
    const displayTag = (selectedUser.fullName || selectedUser.username).replace(/\s+/g, '');
    const val = commentText;
    const cursorPos = commentInputRef.current?.selectionStart || val.length;
    const textBeforeCursor = val.substring(0, cursorPos);
    const textAfterCursor = val.substring(cursorPos);
    const newBefore = textBeforeCursor.replace(/@\w*$/, `@${displayTag} `);
    
    setCommentText(newBefore + textAfterCursor);
    setActiveMentions(prev => [...prev, { display: displayTag, username: selectedUser.username }]);
    setMentionQuery('');
    commentInputRef.current?.focus();
  }, [commentText]);

  const handleToggleSave = () => {
    saveMutation.mutate(isSaved);
    setIsSaved(!isSaved); // Optimistic UI update
  };
  const handleToggleComments = () => setShowComments(!showComments);

  const currentReactionObj = REACTIONS.find(r => r.type === reaction);
  const commentsList = commentsData?.data?.content || [];
  const totalCommentPages = commentsData?.data?.totalPages || 1;
  const totalElements = commentsData?.data?.totalElements || 0;

  const formatPostTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(date);
  };

  if (isDeleted) return null;

  return (
    <article className="post-wrapper relative">
      <div className="post-header">
        <div className="post-author-info">
          <Link to={`/profile/${post.authorUsername}`}>
            <img src={post.authorAvatarUrl || 'https://i.pravatar.cc/150'} alt={post.authorFullName} className="post-avatar hover:opacity-80 transition-opacity" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to={`/profile/${post.authorUsername}`}>
                <h4 className="post-author-name hover:underline">{post.authorFullName || post.authorUsername}</h4>
              </Link>
              {post.groupId && (
                <>
                  <span className="text-[var(--color-text-secondary)] text-[10px]">▶</span>
                  <Link to={`/groups/${post.groupId}`}>
                    <h4 className="post-author-name text-[var(--color-accent)] hover:underline font-bold">{post.groupName}</h4>
                  </Link>
                </>
              )}
            </div>
            <div className="post-time">
              <span>{formatPostTime(post.createdAt)}</span>
              <span className="mx-1">•</span>
              <Globe size={12} />
            </div>
          </div>
        </div>

        <div className="relative">
          <button className="post-options-btn" onClick={() => setShowOptions(!showOptions)}>
            <MoreHorizontal size={20} />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-slate-100 py-1 z-50">
              {isMyPost ? (
                <>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
                    onClick={() => { setIsEditing(true); setShowOptions(false); }}>
                    Chỉnh sửa bài viết
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100"
                    onClick={() => { if (window.confirm('Bạn có chắc muốn xóa bài viết này?')) deletePostMutation.mutate(); }}>
                    Xóa bài viết
                  </button>
                </>
              ) : (
                <button className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100">Báo cáo bài viết</button>
              )}
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center justify-between"
                onClick={() => {
                  handleToggleSave();
                  setShowOptions(false);
                }}
              >
                <span>{isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}</span>
                <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} className={isSaved ? 'text-[var(--color-warning)]' : 'text-slate-400'} />
              </button>
              <button 
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 border-t border-slate-100 mt-1"
                onClick={handleCopyLink}
              >
                Sao chép liên kết
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="px-4 py-2">
          <textarea
            className="w-full p-2 border border-slate-300 rounded-md outline-none focus:border-[var(--color-accent)] min-h-[80px] resize-none overflow-hidden"
            value={editContent} 
            onChange={(e) => {
              setEditContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }} 
          />
          <div className="flex justify-end gap-2 mt-2">
            <button className="px-3 py-1 text-sm bg-slate-200 rounded-md hover:bg-slate-300" onClick={() => setIsEditing(false)}>Hủy</button>
            <button className="px-3 py-1 text-sm bg-[var(--color-accent)] text-white rounded-md hover:opacity-90"
              onClick={() => updatePostMutation.mutate(editContent)} disabled={updatePostMutation.isPending}>Lưu</button>
          </div>
        </div>
      ) : (
        (post.content || post.highlightedContent) && (
          <div className="px-4 py-2 text-sm text-[var(--color-text-primary)] whitespace-pre-wrap">
            <div className={`relative ${!isExpanded && post.content.length > 250 ? 'max-h-[120px] overflow-hidden' : ''}`}>
              {renderContentWithMentions(post.highlightedContent || post.content, post.mentionedUsers)}
              {!isExpanded && post.content.length > 250 && (
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--color-bg-secondary)] to-transparent pointer-events-none" />
              )}
            </div>
            {!isExpanded && post.content.length > 250 && (
              <button 
                onClick={() => setIsExpanded(true)}
                className="font-semibold text-slate-500 hover:underline mt-1 focus:outline-none"
              >
                Xem thêm
              </button>
            )}
          </div>
        )
      )}

      {/* Media Grid - click to open Lightbox */}
      {post.mediaList && post.mediaList.length > 0 && (
        <div className={`post-media-grid grid gap-1 mt-3 ${
          post.mediaList.length === 1 ? 'grid-cols-1'
          : post.mediaList.length === 2 ? 'grid-cols-2'
          : 'grid-cols-2'
        }`}>
          {post.mediaList.slice(0, 4).map((media, index) => {
            const isVideo = media.mediaType === 'VIDEO';
            const isLast = index === 3 && post.mediaList!.length > 4;
            const isSingleLandscape = post.mediaList!.length === 1;
            return (
              <div
                key={media.id}
                className={`relative bg-slate-100 overflow-hidden rounded-md cursor-pointer group ${
                  isSingleLandscape ? 'max-h-[500px]' : 'h-[240px]'
                }`}
                onClick={() => setLightboxIndex(index)}
              >
                {isVideo ? (
                  <video src={media.mediaUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <LazyImage
                    src={media.mediaUrl}
                    alt="Post Attachment"
                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                {/* Video play icon */}
                {isVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white ml-1" />
                    </div>
                  </div>
                )}
                {/* +N overlay on last item */}
                {isLast && (
                  <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white text-3xl font-bold">
                    +{post.mediaList!.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && post.mediaList && (
        <Lightbox
          mediaList={post.mediaList}
          initialIndex={lightboxIndex}
          currentIndex={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      <div className="post-stats mt-3">
        <div className="post-stats-likes group relative flex items-center cursor-pointer">
          {likesCount > 0 && (
            <div className="flex items-center">
              {reactionBreakdown.length > 0 ? (
                reactionBreakdown.slice(0, 3).map((r, idx) => (
                  <div key={r.type} className="flex items-center justify-center w-[18px] h-[18px] rounded-full z-10 bg-white" style={{ marginLeft: idx > 0 ? '-4px' : '0' }}>
                    <span className="text-[12px] leading-none">{r.emoji}</span>
                  </div>
                ))
              ) : (
                <div className="bg-[var(--color-accent)] rounded-full p-1 text-white flex items-center justify-center w-5 h-5 z-10">
                  <ThumbsUp size={10} fill="white" />
                </div>
              )}
              <span className="ml-1.5 hover:underline text-slate-500 text-[15px]">{likesCount}</span>
            </div>
          )}
          {reactionBreakdown.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex flex-col bg-slate-800 text-white text-[13px] rounded-lg p-2 min-w-[130px] shadow-xl z-50 pointer-events-none transition-all">
              {reactionBreakdown.map(r => (
                <div key={r.type} className="flex items-center justify-between py-1 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{r.emoji}</span>
                    <span className="font-medium text-slate-200">{r.label}</span>
                  </div>
                  <span className="font-bold ml-3">{r.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {commentCount > 0 && (
            <span className="cursor-pointer hover:underline" onClick={handleToggleComments}>
              {commentCount} bình luận
            </span>
          )}
          {shareCount > 0 && (
            <span className="cursor-pointer hover:underline text-slate-500 text-sm">
              {shareCount} lượt chia sẻ
            </span>
          )}
        </div>
      </div>

      <div className={`post-actions ${showComments ? '!mb-0 border-b-0' : ''}`}>
        <div className="post-reaction-container flex-1">
          <div className="reaction-popover">
            {REACTIONS.map((r) => (
              <button key={r.type} className="reaction-icon-btn" onClick={() => handleSelectReaction(r.type)} title={r.label}>
                {r.emoji}
              </button>
            ))}
          </div>
          <button className="post-action-btn w-full" onClick={handleToggleDefaultLike} disabled={reactMutation.isPending}>
            {currentReactionObj ? <span className="text-xl mr-1">{currentReactionObj.emoji}</span> : <ThumbsUp size={20} />}
            <span className={`reaction-text ${reaction || ''} font-semibold`}>
              {currentReactionObj ? currentReactionObj.label : 'Thích'}
            </span>
          </button>
        </div>

        <button className="post-action-btn" onClick={handleToggleComments}>
          <MessageCircle size={20} /><span>Bình luận</span>
        </button>

        <button className="post-action-btn" onClick={() => setShowShareModal(true)}>
          <Share2 size={20} /><span>Chia sẻ</span>
        </button>

      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="comment-section-wrapper">
          <div className="comment-divider"></div>

          {/* Feature #1: Pagination - Load Previous */}
          {commentPage > 0 && (
            <button
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline mb-2 ml-2"
              onClick={() => setCommentPage(p => Math.max(0, p - 1))}
            >
              ← Xem bình luận trước đó
            </button>
          )}

          {/* Feature #5: Skeleton Loading */}
          {isLoadingComments ? (
            <div>
              <CommentSkeleton />
              <CommentSkeleton />
              <CommentSkeleton />
            </div>
          ) : (
            <>
              {commentsList.length === 0 && commentPage === 0 && (
                <div className="text-sm text-center text-[var(--color-text-secondary)] mb-4">
                  Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                </div>
              )}
              {commentsList.map((comment: any) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={post.id}
                  formatPostTime={formatPostTime}
                />
              ))}
            </>
          )}

          {/* Feature #1: Load More Comments */}
          {commentPage < totalCommentPages - 1 && totalElements > 5 && (
            <button
              className="text-xs font-semibold text-[var(--color-accent)] hover:underline mt-1 mb-2 ml-2"
              onClick={() => setCommentPage(p => p + 1)}
            >
              Xem thêm bình luận... ({totalElements - (commentPage + 1) * 5 > 0 ? totalElements - (commentPage + 1) * 5 : ''})
            </button>
          )}

          {/* Root Comment Input with Feature #4: Smart Mentions */}
          <div className="comment-input-wrapper mt-3 flex flex-col">
            <div className="flex gap-2 w-full">
              <img src={user?.avatarUrl || 'https://i.pravatar.cc/150'} alt="My Avatar" className="comment-input-avatar flex-none" />
              <div className="comment-input-box flex-1 relative">
                {/* Mention Dropdown */}
                {mentionQuery && (
                  <MentionDropdown query={mentionQuery} onSelect={handleMentionSelect} />
                )}
                <textarea
                  ref={commentInputRef}
                  id={`comment-input-${post.id}`}
                  className="comment-input resize-none overflow-hidden min-h-[36px]"
                  placeholder="Viết bình luận công khai..."
                  rows={1}
                  value={commentText}
                  onChange={(e) => {
                    handleCommentChange(e);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  disabled={commentMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleCommentSubmit();
                    }
                  }}
                />
                <div className="comment-input-actions">
                  {commentMutation.isPending ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    commentText.trim().length > 0 && (
                      <button className="text-[var(--color-accent)] hover:opacity-80 p-1" onClick={handleCommentSubmit}>
                        <Send size={18} />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature #6: Share Modal */}
      {showShareModal && <ShareModal post={post} onClose={() => setShowShareModal(false)} />}
    </article>
  );
};
