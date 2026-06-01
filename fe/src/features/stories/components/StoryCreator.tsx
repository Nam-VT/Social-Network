import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Type, Send } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { storyApi } from '../api/storyApi';
import { uploadApi } from '../../newsfeed/api/postApi';
import type { StoryCreateRequest, MediaType } from '../types';

interface StoryCreatorProps {
  onClose: () => void;
}

const BG_COLORS = [
  '#000000', // Đen
  '#ef4444', // Đỏ
  '#f59e0b', // Cam
  '#10b981', // Xanh lá
  '#3b82f6', // Xanh dương
  '#8b5cf6', // Tím
  '#ec4899', // Hồng
];

export const StoryCreator: React.FC<StoryCreatorProps> = ({ onClose }) => {
  const [type, setType] = useState<'SELECT' | 'TEXT' | 'MEDIA'>('SELECT');
  const [text, setText] = useState('');
  const [bgColor, setBgColor] = useState(BG_COLORS[4]); // Mặc định xanh dương
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: StoryCreateRequest) => storyApi.createStory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories', 'active'] });
      onClose();
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
      setType('MEDIA');
    }
  };

  const handleUploadAndSubmit = async () => {
    try {
      let finalMediaUrl = '';
      
      // Upload ảnh/video lên Cloudinary
      if (mediaFile) {
        const urls = await uploadApi.uploadMultiple([mediaFile], 'stories');
        if (urls && urls.length > 0) {
          finalMediaUrl = urls[0];
        }
      }

      let mediaType: MediaType = 'TEXT';
      if (mediaFile) {
        mediaType = mediaFile.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      }

      await createMutation.mutateAsync({
        mediaUrl: finalMediaUrl || 'text_story',
        mediaType,
        caption: text,
        bgColor: type === 'TEXT' ? bgColor : undefined,
      });
    } catch (error) {
      console.error("Upload error", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md h-[80vh] md:h-[600px] bg-gray-900 rounded-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <button onClick={onClose} className="p-2 text-white hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
          <h2 className="text-white font-semibold">Tạo tin</h2>
          <div className="w-10"></div> {/* Spacer */}
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {type === 'SELECT' && (
            <div className="flex gap-4">
              <button
                onClick={() => setType('TEXT')}
                className="flex flex-col items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white hover:opacity-90 transition"
              >
                <Type size={32} className="mb-2" />
                <span className="font-medium">Tạo tin ảnh chữ</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl text-white hover:opacity-90 transition"
              >
                <ImageIcon size={32} className="mb-2" />
                <span className="font-medium">Tạo tin ảnh/video</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="image/*,video/*" 
                className="hidden" 
              />
            </div>
          )}

          {type === 'TEXT' && (
            <div 
              className="w-full h-full flex items-center justify-center p-8 transition-colors duration-300"
              style={{ backgroundColor: bgColor }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập nội dung..."
                className="w-full bg-transparent text-white text-center text-3xl font-bold outline-none resize-none placeholder:text-white/50"
                rows={5}
                autoFocus
              />
              
              {/* Color picker */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                {BG_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setBgColor(color)}
                    className={`w-8 h-8 rounded-full border-2 ${bgColor === color ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}

          {type === 'MEDIA' && mediaPreview && (
            <div className="w-full h-full relative">
              {mediaFile?.type.startsWith('video/') ? (
                <video src={mediaPreview} className="w-full h-full object-cover" controls />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              )}
              
              {/* Overlay Caption Input */}
              <div className="absolute bottom-16 left-0 right-0 p-4">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Thêm chú thích..."
                  className="w-full bg-black/50 text-white p-3 rounded-full outline-none placeholder:text-gray-300 backdrop-blur-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {type !== 'SELECT' && (
          <div className="p-4 bg-gray-900 border-t border-gray-800 flex justify-end">
            <button
              onClick={handleUploadAndSubmit}
              disabled={createMutation.isPending || (type === 'TEXT' && !text.trim())}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium disabled:opacity-50 transition"
            >
              {createMutation.isPending ? 'Đang đăng...' : 'Chia sẻ tin'}
              <Send size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
