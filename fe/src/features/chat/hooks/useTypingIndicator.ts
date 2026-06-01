import { useCallback, useRef } from 'react';

/**
 * Hook debounce gửi typing event.
 * Khi người dùng gõ → gửi isTyping=true.
 * Khi dừng gõ 2s → tự động gửi isTyping=false.
 */
export const useTypingIndicator = (sendTyping: (isTyping: boolean) => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  }, [sendTyping]);

  const stopTyping = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
    }
  }, [sendTyping]);

  return { handleTyping, stopTyping };
};
