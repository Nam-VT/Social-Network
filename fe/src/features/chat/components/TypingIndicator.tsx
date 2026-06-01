// Typing Indicator — 3 dots animation
export const TypingIndicator = ({ name }: { name?: string }) => (
  <div className="flex items-end gap-2 px-4 py-1">
    <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] rounded-2xl rounded-bl-none px-3 py-2 shadow-sm">
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="w-2 h-2 rounded-full bg-[var(--color-text-secondary)] animate-bounce"
        style={{ animationDelay: '300ms' }}
      />
    </div>
    {name && (
      <span className="text-xs text-[var(--color-text-secondary)] pb-1">{name} đang gõ...</span>
    )}
  </div>
);
