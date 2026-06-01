import { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

export interface MediaItem {
  id: number;
  mediaUrl: string;
  mediaType: string;
}

interface LightboxProps {
  mediaList: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  currentIndex: number;
  onIndexChange: (idx: number) => void;
}

export const Lightbox = ({ mediaList, onClose, currentIndex, onIndexChange }: LightboxProps) => {
  const total = mediaList.length;
  const current = mediaList[currentIndex];
  const isVideo = current?.mediaType === 'VIDEO';

  const goPrev = useCallback(() => {
    onIndexChange((currentIndex - 1 + total) % total);
  }, [currentIndex, total, onIndexChange]);

  const goNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % total);
  }, [currentIndex, total, onIndexChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* Counter */}
      {total > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/40 text-white text-sm font-medium">
          {currentIndex + 1} / {total}
        </div>
      )}

      {/* Prev Button */}
      {total > 1 && (
        <button
          className="absolute left-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all hover:scale-110"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      {/* Media Content */}
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            key={current.mediaUrl}
            src={current.mediaUrl}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain"
          />
        ) : (
          <img
            key={current.mediaUrl}
            src={current.mediaUrl}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl object-contain select-none"
            draggable={false}
          />
        )}

        {/* Open in new tab */}
        {!isVideo && (
          <a
            href={current.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors"
            onClick={(e) => e.stopPropagation()}
            title="Mở ảnh gốc"
          >
            <ZoomIn size={16} />
          </a>
        )}
      </div>

      {/* Next Button */}
      {total > 1 && (
        <button
          className="absolute right-4 z-10 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-all hover:scale-110"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {/* Thumbnail Strip (bottom) */}
      {total > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {mediaList.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => onIndexChange(idx)}
              className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-all flex-none ${
                idx === currentIndex
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              {m.mediaType === 'VIDEO' ? (
                <video src={m.mediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
