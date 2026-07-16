import { useState, useEffect } from 'react';
import { Loader2, Send, CornerDownRight } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { postApi } from '../api/postApi';
import { useAuthStore } from '@/store/useAuthStore';
import { Link } from 'react-router-dom';
import { MentionDropdown } from './MentionDropdown';
import { parseUTCDate } from '@/utils/parseUTCDate';

const renderContentWithMentions = (content: string, mentionedUsers?: Record<string, string>) => {
  if (!content) return null;
  // Regex an toàn hơn: Tách @mention và URL (không bắt dấu câu ở cuối)
  const parts = content.split(/(@\w+|https?:\/\/[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      const displayName = (mentionedUsers && mentionedUsers[username]) ? mentionedUsers[username] : username;
      return (
        <Link key={i} to={`/profile/${username}`} className="font-semibold text-[var(--color-accent)] hover:underline">
          {displayName}
        </Link>
      );
    } else if (part.match(/^https?:\/\//)) {
      try {
        const url = new URL(part);
        if (url.origin === window.location.origin) {
          return (
            <Link key={i} to={url.pathname + url.search + url.hash} className="text-[var(--color-accent)] font-medium hover:underline break-all">
              {part}
            </Link>
          );
        }
      } catch (e) {
        // Fallback if URL is invalid
      }
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] font-medium hover:underline break-all">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Thích' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích' },
  { type: 'HAHA', emoji: '😂', label: 'Haha' },
  { type: 'WOW', emoji: '😮', label: 'Wow' },
  { type: 'SAD', emoji: '😢', label: 'Buồn' },
  { type: 'ANGRY', emoji: '😡', label: 'Phẫn nộ' },
];

interface CommentItemProps {
  comment: any;
  postId: number | string;
  isReply?: boolean;
  rootCommentId?: number | string;
  formatPostTime: (iso: string) => string;
}

export const CommentItem = ({ comment, postId, isReply = false, rootCommentId, formatPostTime }: CommentItemProps) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Edit state
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [editText, setEditText] = useState('');

  // Reply state
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [activeMentions, setActiveMentions] = useState<{display: string, username: string}[]>([]);

  // Reply Pagination state
  const [showReplies, setShowReplies] = useState(false);
  const [replyPage, setReplyPage] = useState(0);
  const [replies, setReplies] = useState<any[]>(comment.replies || []);

  const { data: repliesData, isLoading: isLoadingReplies } = useQuery({
    queryKey: ['replies', comment.id, replyPage],
    queryFn: () => postApi.getCommentReplies(comment.id, replyPage, 5),
    enabled: showReplies && !isReply,
  });

  useEffect(() => {
    if (comment.replies && comment.replies.length > replies.length) {
      setReplies(comment.replies);
    }
  }, [comment.replies]);

  useEffect(() => {
    if (repliesData?.data?.content) {
      if (replyPage === 0) {
        setReplies(repliesData.data.content);
      } else {
        setReplies(prev => {
          const existingIds = new Set(prev.map(r => r.id));
          const newReplies = repliesData.data.content.filter((r: any) => !existingIds.has(r.id));
          return [...prev, ...newReplies];
        });
      }
    }
  }, [repliesData, replyPage]);

  // Comment reaction state
  const [myReaction, setMyReaction] = useState<string | null>(comment.myReaction || null);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  // Reaction breakdown
  const reactionCounts = comment.reactionCounts || {};
  const reactionBreakdown = Object.entries(reactionCounts)
    .filter(([_, count]) => (count as number) > 0)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .map(([type, count]) => {
      const rDef = REACTIONS.find(r => r.type === type);
      return { type, count: count as number, emoji: rDef?.emoji || '👍', label: rDef?.label || 'Thích' };
    });
  const totalReactions = reactionBreakdown.reduce((sum, r) => sum + r.count, 0);

  // Mutations
  const reactMutation = useMutation({
    mutationFn: (reactionType: string | null) => postApi.toggleReaction({
      targetId: comment.id,
      targetType: 'COMMENT',
      reactionType: reactionType || 'LIKE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number | string, content: string }) =>
      postApi.updateComment({ postId, commentId, content }),
    onSuccess: () => {
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: number | string) => postApi.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: number | string, content: string }) =>
      postApi.createComment({ postId, content, parentId }),
    onSuccess: () => {
      setReplyText('');
      setActiveMentions([]);
      setShowReplyInput(false);
      // Khi reply thành công, tự động hiện danh sách reply
      setShowReplies(true);
      // Fetch lại replies mới nhất nếu đang ở page 0, hoặc invalid queries
      queryClient.invalidateQueries({ queryKey: ['comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['replies', comment.id] });
      queryClient.invalidateQueries({ queryKey: ['newsfeed'] });
    }
  });

  const handleReaction = (type: string) => {
    if (myReaction === type) {
      setMyReaction(null);
    } else {
      setMyReaction(type);
    }
    reactMutation.mutate(type);
    setShowReactionPicker(false);
  };

  const handleReplyClick = () => {
    setShowReplyInput(true);
    const fullName = comment.author?.fullName || comment.authorFullName || comment.authorUsername || 'User';
    const username = comment.author?.username || comment.authorUsername || 'User';
    const displayTag = fullName.replace(/\s+/g, '');
    
    if (user?.id !== (comment.author?.id || comment.authorId)) {
      setReplyText(`@${displayTag} `);
      setActiveMentions(prev => [...prev, { display: displayTag, username }]);
    } else {
      setReplyText('');
    }
    setTimeout(() => {
      document.getElementById(`reply-input-${comment.id}`)?.focus();
    }, 50);
  };

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setReplyText(val);

    const match = val.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = (selectedUser: any) => {
    const displayTag = (selectedUser.fullName || selectedUser.username).replace(/\s+/g, '');
    const newVal = replyText.replace(/@\w*$/, `@${displayTag} `);
    setReplyText(newVal);
    setActiveMentions(prev => [...prev, { display: displayTag, username: selectedUser.username }]);
    setMentionQuery(null);
    setTimeout(() => {
      document.getElementById(`reply-input-${comment.id}`)?.focus();
    }, 50);
  };

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    let finalContent = replyText;
    activeMentions.forEach(m => {
      finalContent = finalContent.split(`@${m.display}`).join(`@${m.username}`);
    });
    replyMutation.mutate({ parentId: rootCommentId || comment.id, content: finalContent });
  };

  const currentReactionObj = REACTIONS.find(r => r.type === myReaction);
  const authorName = comment.author?.fullName || comment.authorFullName || 'Người dùng';
  const authorUsername = comment.author?.username || comment.authorUsername || 'User';
  const authorAvatar = comment.author?.avatarUrl || comment.authorAvatarUrl || 'https://i.pravatar.cc/150';
  const authorId = comment.author?.id || comment.authorId;

  return (
    <div className={isReply ? '' : 'mb-3'}>
      <div className="comment-item">
        <Link to={`/profile/${authorUsername}`} className="flex-none">
          <img
            src={authorAvatar}
            alt={authorUsername}
            className={`comment-avatar hover:opacity-80 transition-opacity ${isReply ? '!w-6 !h-6' : ''}`}
          />
        </Link>
        <div className="comment-content-wrapper w-full">
          <div className="comment-bubble">
            <Link to={`/profile/${authorUsername}`} className={`comment-author hover:underline inline-block ${isReply ? 'text-[12px]' : ''}`}>
              {authorName}
            </Link>

            {editingId === comment.id ? (
              <div className="mt-1 w-full">
                <input
                  className="w-full px-2 py-1 text-sm border rounded"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateMutation.mutate({ commentId: comment.id, content: editText });
                    else if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                />
                <div className="text-[10px] text-slate-400 mt-1">Nhấn Enter để lưu, Esc để hủy</div>
              </div>
            ) : (
              <div className={`comment-text ${isReply ? 'text-[13px]' : ''}`}>
                {renderContentWithMentions(comment.content, comment.mentionedUsers)}
              </div>
            )}
          </div>

          {/* Reaction badges under bubble */}
          {totalReactions > 0 && editingId !== comment.id && (
            <div className="flex items-center gap-1 mt-0.5 ml-2 group relative cursor-pointer">
              {reactionBreakdown.slice(0, 3).map((r, idx) => (
                <span key={r.type} className="text-[11px] leading-none" style={{ marginLeft: idx > 0 ? '-2px' : '0' }}>
                  {r.emoji}
                </span>
              ))}
              <span className="text-[11px] text-slate-500 ml-0.5">{totalReactions}</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex flex-col bg-slate-800 text-white text-[11px] rounded-lg p-1.5 min-w-[100px] shadow-xl z-50 pointer-events-none">
                {reactionBreakdown.map(r => (
                  <div key={r.type} className="flex items-center justify-between py-0.5 px-1">
                    <span>{r.emoji} {r.label}</span>
                    <span className="font-bold ml-2">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editingId !== comment.id && (
            <>
              <div className={`comment-actions ${isReply ? '!text-[11px]' : ''}`}>
                {/* Like with reaction picker */}
                <div className="relative inline-block"
                  onMouseEnter={() => setShowReactionPicker(true)}
                  onMouseLeave={() => setShowReactionPicker(false)}
                >
                  <span
                    className={`comment-action-link ${currentReactionObj ? '' : ''}`}
                    style={currentReactionObj ? { color: currentReactionObj.type === 'LIKE' ? 'var(--color-accent)' : currentReactionObj.type === 'LOVE' ? '#f02849' : '#f7b125' } : {}}
                    onClick={() => handleReaction(myReaction ? myReaction : 'LIKE')}
                  >
                    {currentReactionObj ? `${currentReactionObj.emoji} ${currentReactionObj.label}` : 'Thích'}
                  </span>

                  {/* Mini reaction popover */}
                  {showReactionPicker && (
                    <div className="absolute bottom-full left-0 mb-1 bg-white border border-slate-100 shadow-lg rounded-full flex items-center gap-0.5 px-1.5 py-0.5 z-50">
                      {REACTIONS.map((r) => (
                        <button
                          key={r.type}
                          className="text-base hover:scale-125 transition-transform cursor-pointer p-0.5"
                          onClick={(e) => { e.stopPropagation(); handleReaction(r.type); }}
                          title={r.label}
                        >
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="comment-action-link" onClick={handleReplyClick}>Phản hồi</span>

                {user?.id === authorId && (
                  <>
                    <span
                      className="comment-action-link hover:text-[var(--color-accent)]"
                      onClick={() => {
                        if (comment.createdAt) {
                          const diff = (Date.now() - parseUTCDate(comment.createdAt).getTime()) / 60000;
                          if (diff > 15) { alert('Bạn chỉ có thể sửa bình luận trong vòng 15 phút sau khi đăng.'); return; }
                        }
                        setEditingId(comment.id);
                        setEditText(comment.content);
                      }}
                    >
                      Sửa
                    </span>
                    <span
                      className="comment-action-link text-red-500 hover:text-red-700"
                      onClick={() => { if (window.confirm('Bạn có chắc muốn xóa bình luận này?')) deleteMutation.mutate(comment.id); }}
                    >
                      Xóa
                    </span>
                  </>
                )}
                <span className="comment-time">{comment.createdAt ? formatPostTime(comment.createdAt) : 'Vừa xong'}</span>
                {comment.isEdited && <span className="text-[10px] text-slate-400 italic">đã chỉnh sửa</span>}
              </div>

              {/* Inline Reply Input */}
              {showReplyInput && (
                <div className="comment-input-wrapper mt-2 flex flex-col w-full pr-4">
                  <div className="flex gap-2 w-full">
                    <img src={user?.avatarUrl || 'https://i.pravatar.cc/150'} className={`comment-input-avatar flex-none mt-1 ${isReply ? '!w-5 !h-5' : '!w-6 !h-6'}`} alt="avatar" />
                    <div className="comment-input-box flex-1 relative">
                      {mentionQuery !== null && (
                        <MentionDropdown query={mentionQuery} onSelect={handleMentionSelect} />
                      )}
                      <textarea
                        id={`reply-input-${comment.id}`}
                        className={`comment-input resize-none overflow-hidden ${isReply ? '!text-[12px] !py-1' : '!text-[13px] !py-1.5'}`}
                        placeholder={`Phản hồi ${authorUsername}...`}
                        rows={1}
                        value={replyText}
                        onChange={(e) => {
                          handleReplyChange(e);
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        disabled={replyMutation.isPending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleReplySubmit();
                          } else if (e.key === 'Escape') {
                            setShowReplyInput(false);
                          }
                        }}
                      />
                      <div className="comment-input-actions">
                        {replyMutation.isPending ? (
                          <Loader2 className="animate-spin" size={isReply ? 14 : 16} />
                        ) : (
                          replyText.trim().length > 0 && (
                            <button
                              className="text-[var(--color-accent)] hover:opacity-80 p-1"
                              onClick={handleReplySubmit}
                            >
                              <Send size={isReply ? 14 : 16} />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {!isReply && (comment.replyCount > 0 || replies.length > 0) && (
        <div className="ml-10 mt-1 space-y-2 border-l-2 border-slate-100 pl-3">
          {replies.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              isReply={true}
              rootCommentId={comment.id}
              formatPostTime={formatPostTime}
            />
          ))}
          
          {comment.replyCount > replies.length && (
            <button
              className="text-[12px] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] mt-1 flex items-center gap-1 cursor-pointer"
              onClick={() => {
                if (!showReplies) setShowReplies(true);
                else setReplyPage(p => p + 1);
              }}
              disabled={isLoadingReplies}
            >
              {isLoadingReplies 
                ? <Loader2 size={12} className="animate-spin" /> 
                : <CornerDownRight size={14} />
              }
              <span>
                {isLoadingReplies 
                  ? 'Đang tải...' 
                  : `Xem thêm ${comment.replyCount - replies.length} phản hồi`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
