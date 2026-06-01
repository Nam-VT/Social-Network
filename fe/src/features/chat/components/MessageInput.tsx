import { useState, useRef } from 'react';
import { Send, X, Image as ImageIcon } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '../api/chatApi';
import { uploadApi } from '@/features/newsfeed/api/postApi';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  roomId: number;
  onMessageSent: (msg: any) => void;
  onTyping: () => void;
  onStopTyping: () => void;
  replyingTo?: import('../api/chatApi').ChatMessage | null;
  onCancelReply?: () => void;
  disabled?: boolean;
}

export const MessageInput = ({
  roomId,
  onMessageSent,
  onTyping,
  onStopTyping,
  replyingTo,
  onCancelReply,
  disabled,
}: MessageInputProps) => {
  const [text, setText] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ file: File; url: string; type: 'IMAGE' | 'VIDEO' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMutation = useMutation({
    mutationFn: async () => {
      let mediaUrl: string | undefined;
      let mediaType: 'IMAGE' | 'VIDEO' | undefined;

      if (mediaPreview) {
        setIsUploading(true);
        const urls = await uploadApi.uploadMultiple([mediaPreview.file], 'chat');
        mediaUrl = urls[0];
        mediaType = mediaPreview.type;
        setIsUploading(false);
      }

      return chatApi.sendMessage(roomId, {
        content: text.trim() || undefined,
        mediaUrl,
        mediaType,
        replyToMessageId: replyingTo?.id,
      });
    },
    onSuccess: (msg) => {
      onMessageSent(msg);
      setText('');
      setMediaPreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      onStopTyping();
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) sendMutation.mutate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      setMediaPreview({ file, url: URL.createObjectURL(file), type });
    }
    e.target.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setMediaPreview({ file, url: URL.createObjectURL(file), type: 'IMAGE' });
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    // Typing indicator
    if (e.target.value) onTyping();
    else onStopTyping();
  };

  const canSend = (text.trim().length > 0 || mediaPreview !== null) && !sendMutation.isPending && !isUploading;
  const isPending = sendMutation.isPending || isUploading;

  return (
    <div className="px-4 py-3 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border-light)] flex flex-col gap-2">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg border-l-4 border-[var(--color-accent)] relative">
          <div className="flex flex-col min-w-0 pr-6">
            <span className="text-[11px] font-bold text-[var(--color-accent)]">
              Đang trả lời {replyingTo.senderFullName}
            </span>
            <span className="text-xs text-slate-600 truncate">
              {replyingTo.content || 'Hình ảnh/Video'}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Media Preview */}
      {mediaPreview && (
        <div className="mb-2 relative inline-block">
          {mediaPreview.type === 'VIDEO' ? (
            <video src={mediaPreview.url} className="h-24 rounded-lg object-cover" />
          ) : (
            <img src={mediaPreview.url} alt="preview" className="h-24 rounded-lg object-cover" />
          )}
          <button
            onClick={() => setMediaPreview(null)}
            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending || disabled}
          className="flex-none p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-accent)] transition-colors disabled:opacity-50"
          title="Gửi ảnh/video"
        >
          <ImageIcon size={22} />
        </button>

        {/* Textarea */}
        <div className="flex-1 bg-[var(--color-bg-primary)] border border-[var(--color-border-light)] rounded-2xl px-4 py-2 flex items-end gap-2 focus-within:border-[var(--color-accent)] transition-colors">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Aa"
            rows={1}
            disabled={isPending || disabled}
            className="flex-1 bg-transparent outline-none resize-none text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] max-h-[120px] overflow-hidden"
          />
        </div>

        {/* Emoji Picker */}
        <EmojiPicker 
          disabled={isPending || disabled}
          onSelect={(emoji) => {
            setText(prev => prev + emoji);
            onTyping();
            if (textareaRef.current) {
              textareaRef.current.focus();
              // Try to adjust height slightly
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
                }
              }, 10);
            }
          }}
        />

        {/* Send button */}
        <button
          onClick={() => sendMutation.mutate()}
          disabled={!canSend}
          className="flex-none p-2.5 rounded-full bg-[var(--color-accent)] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};
