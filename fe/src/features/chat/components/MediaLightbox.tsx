import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { createPortal } from 'react-dom';

interface MediaLightboxProps {
  mediaUrls: string[];
  initialIndex: number;
  onClose: () => void;
}

export const MediaLightbox = ({ mediaUrls, initialIndex, onClose }: MediaLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);

  // Reset scale when changing image
  useEffect(() => {
    setScale(1);
  }, [currentIndex]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  };

  const currentUrl = mediaUrls[currentIndex];

  if (!currentUrl) return null;

  const isVideo = currentUrl.match(/\.(mp4|webm|ogg)$/i) || currentUrl.includes('video');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 animate-fade-in pointer-events-auto">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-white/70 text-sm font-medium">
          {currentIndex + 1} / {mediaUrls.length}
        </span>
        <div className="flex items-center gap-4">
          {!isVideo && (
            <>
              <button onClick={() => setScale(s => s + 0.25)} className="text-white hover:text-gray-300 transition"><ZoomIn size={24} /></button>
              <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="text-white hover:text-gray-300 transition"><ZoomOut size={24} /></button>
            </>
          )}
          <button onClick={onClose} className="text-white hover:text-red-400 transition ml-2">
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Navigation Left */}
      {mediaUrls.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all z-10"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Main Content */}
      <div 
        className="w-full h-full flex items-center justify-center p-8 sm:p-12 overflow-hidden"
        onClick={onClose}
      >
        <div 
          className="relative max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
          onClick={(e) => e.stopPropagation()}
        >
          {isVideo ? (
            <video src={currentUrl} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          ) : (
            <img src={currentUrl} alt="Gallery view" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl select-none" draggable={false} />
          )}
        </div>
      </div>

      {/* Navigation Right */}
      {mediaUrls.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all z-10"
        >
          <ChevronRight size={32} />
        </button>
      )}
    </div>,
    document.body
  );
};
