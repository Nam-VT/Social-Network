/**
 * Hook xử lý âm thanh thông báo tin nhắn mới + Tab flash.
 * - Tạo ping sound bằng Web Audio API (không cần file âm thanh ngoài).
 * - Nhấp nháy tiêu đề tab khi có tin nhắn mới và tab không được focus.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playMessageSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Âm thanh ping nhẹ nhàng (như Messenger)
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(830, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Bỏ qua nếu browser không hỗ trợ Audio API
  }
}

// ===== Tab Flash =====
let flashInterval: ReturnType<typeof setInterval> | null = null;
let originalTitle = document.title;
let flashCount = 0;

export function startTabFlash(message: string) {
  // Chỉ flash khi tab không được focus
  if (document.hasFocus()) return;

  stopTabFlash();
  originalTitle = document.title;
  flashCount = 0;

  flashInterval = setInterval(() => {
    document.title = flashCount % 2 === 0 ? `💬 ${message}` : originalTitle;
    flashCount++;

    // Dừng sau 10 lần nhấp nháy (5 giây)
    if (flashCount > 10) stopTabFlash();
  }, 500);
}

export function stopTabFlash() {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  document.title = originalTitle;
}

// Tự động dừng flash khi người dùng quay lại tab
if (typeof window !== 'undefined') {
  window.addEventListener('focus', stopTabFlash);
}
