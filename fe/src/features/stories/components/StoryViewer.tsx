import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Send, MoreHorizontal, Volume2, VolumeX, Eye, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatLastSeen } from '@/utils/formatLastSeen';
import { storyApi } from '../api/storyApi';
import { useAuthStore } from '../../../store/useAuthStore';
import type { StoryGroupResponse, StoryResponse } from '../types';
import { useStoryViewSocket } from '@/hooks/useStoryViewSocket';

interface StoryViewerProps {
  initialGroupIndex: number;
  storyGroups: StoryGroupResponse[];
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 giây cho mỗi story (ảnh/text)

export const StoryViewer: React.FC<StoryViewerProps> = ({
  initialGroupIndex,
  storyGroups,
  onClose,
}) => {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Default muted
  const [replyText, setReplyText] = useState('');
  const [showViewers, setShowViewers] = useState(false);

  const currentUser = useAuthStore(state => state.user);

  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const shouldCloseRef = useRef(false);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];

  // Local state để hiển thị views real-time mà không cần tải lại toàn bộ
  const [liveStoryData, setLiveStoryData] = useState<{ id: number, viewCount: number, views: any[] } | null>(null);

  useEffect(() => {
    if (currentStory) {
      setLiveStoryData({
        id: currentStory.id,
        viewCount: currentStory.viewCount,
        views: currentStory.views || []
      });
    }
  }, [currentStory]);

  useStoryViewSocket(currentStory?.id, (payload) => {
    if (payload.storyId === currentStory?.id) {
      setLiveStoryData({
        id: payload.storyId,
        viewCount: payload.viewCount,
        views: payload.views
      });
    }
  });

  const displayViewCount = liveStoryData?.id === currentStory?.id ? liveStoryData.viewCount : currentStory?.viewCount;
  const displayViews = liveStoryData?.id === currentStory?.id ? liveStoryData.views : currentStory?.views;

  // Logic gọi API đánh dấu đã xem
  const viewMutation = useMutation({
    mutationFn: (storyId: number) => storyApi.viewStory(storyId),
  });

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (text: string) => storyApi.replyToStory(currentStory.id, { content: text }),
    onSuccess: () => {
      setReplyText('');
      alert('Đã gửi phản hồi!');
    },
    onError: (error: any) => {
      console.error('Reply error:', error);
      alert('Gửi phản hồi thất bại: ' + (error?.response?.data?.message || 'Lỗi không xác định'));
    }
  });

  // Reaction mutation
  const reactMutation = useMutation({
    mutationFn: (type: string) => storyApi.reactToStory(currentStory.id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
    }
  });

  const REACTIONS = [
    { type: 'LIKE', emoji: '👍' },
    { type: 'HEART', emoji: '❤️' },
    { type: 'HAHA', emoji: '😂' },
    { type: 'WOW', emoji: '😮' },
    { type: 'SAD', emoji: '😢' },
    { type: 'ANGRY', emoji: '😡' },
  ];

  const REACTION_EMOJI: Record<string, string> = {
    LIKE: '👍', HEART: '❤️', HAHA: '😂', WOW: '😮', SAD: '😢', ANGRY: '😡',
  };

  const isOwner = currentUser?.id === currentGroup?.userId;

  // Tách goToNextStory ra khỏi render cycle bằng useRef callback
  const goToNextStory = useCallback(() => {
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      // Dùng ref để đánh dấu cần đóng, tránh setState trong render
      shouldCloseRef.current = true;
    }
  }, [currentGroup, groupIndex, storyGroups.length, storyIndex]);

  // Effect xử lý close ngoài render cycle
  useEffect(() => {
    if (shouldCloseRef.current) {
      shouldCloseRef.current = false;
      onClose();
    }
  });

  // Effect xử lý phím ESC để đóng
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const goToPrevStory = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex(storyGroups[groupIndex - 1].stories.length - 1);
      setProgress(0);
    }
  }, [groupIndex, storyIndex, storyGroups]);

  // Effect chạy progress bar
  useEffect(() => {
    if (isPaused) return;

    const intervalTime = 50; // Update mỗi 50ms
    const step = (intervalTime / STORY_DURATION) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev + step >= 100) {
          clearInterval(progressIntervalRef.current!);
          // Dùng setTimeout(0) để goToNextStory chạy ngoài setProgress callback
          setTimeout(() => goToNextStory(), 0);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPaused, goToNextStory, storyIndex, groupIndex]);

  // Effect đánh dấu view
  useEffect(() => {
    if (currentStory && !currentStory.isViewed) {
      viewMutation.mutate(currentStory.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStory?.id]);

  const handlePointerDown = () => setIsPaused(true);
  const handlePointerUp = () => setIsPaused(false);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      goToPrevStory();
    } else {
      goToNextStory();
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyText);
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Background blur cho desktop */}
      {currentStory.mediaType !== 'TEXT' && (
        <div
          className="absolute inset-0 opacity-30 blur-2xl bg-cover bg-center hidden md:block"
          style={{ backgroundImage: `url(${currentStory.mediaUrl})` }}
        />
      )}

      {/* Container chính */}
      <div className="relative w-full h-full md:w-[400px] md:h-[90vh] bg-gray-900 md:rounded-xl overflow-hidden flex flex-col">

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-20">
          {currentGroup.stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-gray-500/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all ease-linear"
                style={{
                  width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%',
                  transitionDuration: idx === storyIndex && !isPaused ? '50ms' : '0ms'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header User Info */}
        <div className="absolute top-4 left-0 right-0 p-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <img
              src={currentGroup.userAvatar || 'https://i.pravatar.cc/150'}
              alt={currentGroup.userFullName}
              className="w-10 h-10 rounded-full object-cover border border-gray-600"
            />
            <div className="text-white drop-shadow-md">
              <p className="font-semibold text-sm">{currentGroup.userFullName}</p>
              <p className="text-xs text-gray-300">
                {formatLastSeen(currentStory.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentStory.mediaType === 'VIDEO' && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                className="text-white p-2 hover:bg-white/10 rounded-full"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
            )}
            <button className="text-white p-2 hover:bg-white/10 rounded-full">
              <MoreHorizontal size={20} />
            </button>
            <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area (Tap to nav) */}
        <div
          className="flex-1 relative flex items-center justify-center cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onClick={handleTap}
          style={{ backgroundColor: currentStory.mediaType === 'TEXT' ? currentStory.bgColor : '#000' }}
        >
          {currentStory.mediaType === 'TEXT' ? (
            <div className="p-8 text-center text-white text-3xl font-bold break-words whitespace-pre-wrap drop-shadow-lg">
              {currentStory.caption}
            </div>
          ) : currentStory.mediaType === 'VIDEO' ? (
            <video
              src={currentStory.mediaUrl}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={goToNextStory}
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt="Story content"
              className="w-full h-full object-contain"
            />
          )}

          {/* Caption Overlay cho ảnh/video */}
          {currentStory.mediaType !== 'TEXT' && currentStory.caption && (
            <div className="absolute bottom-20 left-0 right-0 p-4">
              <div className="bg-black/50 backdrop-blur-md rounded-lg p-3 text-white text-center text-sm md:text-base inline-block max-w-full">
                {currentStory.caption}
              </div>
            </div>
          )}
        </div>

        {/* Reply & Reaction Footer */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent">
          {/* Viewers Panel (only for story owner) */}
          {isOwner && showViewers && (
            <div className="mx-4 mb-2 bg-black/70 backdrop-blur-md rounded-xl max-h-[200px] overflow-y-auto custom-scrollbar">
              <div className="p-3 border-b border-white/10 flex items-center justify-between">
                <span className="text-white text-sm font-semibold">👁️ {displayViewCount} lượt xem</span>
                <button onClick={(e) => { e.stopPropagation(); setShowViewers(false); }} className="text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>
              {displayViews && displayViews.length > 0 ? (
                displayViews.map((v) => (
                  <div key={v.username} className="flex items-center gap-3 px-3 py-2 hover:bg-white/5">
                    <img
                      src={v.userAvatar || 'https://i.pravatar.cc/150'}
                      alt={v.userFullName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{v.userFullName}</p>
                    </div>
                    {v.reactionType ? (
                      <span className="text-xl animate-bounce">{REACTION_EMOJI[v.reactionType] || '👍'}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Đã xem</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center py-4">Chưa có ai xem</p>
              )}
            </div>
          )}

          {/* Owner: View count button */}
          {isOwner && !showViewers && (
            <div
              className="flex items-center justify-center gap-2 py-2 cursor-pointer hover:bg-white/5 transition-colors mx-4 rounded-lg"
              onClick={(e) => { e.stopPropagation(); setIsPaused(true); setShowViewers(true); }}
            >
              <Eye size={16} className="text-white/80" />
              <span className="text-white/80 text-sm">{displayViewCount} lượt xem</span>
              <ChevronUp size={14} className="text-white/60" />
            </div>
          )}

          <div className="p-4 pt-2">
          {/* Emoji Reaction Bar */}
          <div
            className="flex items-center justify-center gap-3 mb-3"
            onClick={e => e.stopPropagation()}
          >
            {REACTIONS.map(r => (
              <button
                key={r.type}
                onClick={() => reactMutation.mutate(r.type)}
                className="text-2xl hover:scale-125 active:scale-90 transition-transform"
                title={r.type}
              >
                {r.emoji}
              </button>
            ))}
          </div>

          {/* Reply Input */}
          <form
            onSubmit={handleReplySubmit}
            className="flex items-center gap-2"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onFocus={() => setIsPaused(true)}
              onBlur={() => setIsPaused(false)}
              placeholder={`Trả lời ${currentGroup.userFullName}...`}
              className="flex-1 bg-transparent border border-gray-400 text-white rounded-full px-4 py-3 outline-none focus:border-white transition-colors"
            />
            {replyText && (
              <button
                type="submit"
                disabled={replyMutation.isPending}
                className="text-white p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            )}
          </form>
          </div>
        </div>

        {/* Nút điều hướng - Hiển thị cả trên mobile */}
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevStory(); }}
          className="absolute top-1/2 -translate-y-1/2 left-2 md:-left-16 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/40 md:bg-white/20 md:hover:bg-white/40 flex items-center justify-center rounded-full text-white backdrop-blur-sm md:backdrop-blur-md transition-colors z-30"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToNextStory(); }}
          className="absolute top-1/2 -translate-y-1/2 right-2 md:-right-16 w-10 h-10 md:w-12 md:h-12 bg-black/20 hover:bg-black/40 md:bg-white/20 md:hover:bg-white/40 flex items-center justify-center rounded-full text-white backdrop-blur-sm md:backdrop-blur-md transition-colors z-30"
        >
          <ChevronRight size={24} />
        </button>

      </div>
    </div>
  );
};
