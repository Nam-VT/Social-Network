import { useState } from 'react';
import { Smile } from 'lucide-react';
import { FullEmojiPicker } from '@/components/ui/FullEmojiPicker';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  disabled?: boolean;
}

export const EmojiPicker = ({ onSelect, disabled }: EmojiPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex-none p-2 rounded-full hover:bg-[var(--color-bg-hover)] text-[var(--color-accent)] transition-colors disabled:opacity-50"
        title="Chọn Emoji"
        type="button"
      >
        <Smile size={22} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 z-50">
          <FullEmojiPicker
            onSelect={onSelect}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
