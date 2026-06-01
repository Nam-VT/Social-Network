import { createPortal } from 'react-dom';
import { create } from 'zustand';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useEffect } from 'react';

// ========== Toast Store ==========
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    // Auto remove after 4 seconds
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },
  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helpers
export const toast = {
  success: (msg: string) => useToastStore.getState().add(msg, 'success'),
  error: (msg: string) => useToastStore.getState().add(msg, 'error'),
  info: (msg: string) => useToastStore.getState().add(msg, 'info'),
  warning: (msg: string) => useToastStore.getState().add(msg, 'warning'),
};

// ========== Toast Item ==========
const ICONS = {
  success: <CheckCircle size={20} className="text-green-500 shrink-0" />,
  error: <XCircle size={20} className="text-red-500 shrink-0" />,
  info: <Info size={20} className="text-blue-500 shrink-0" />,
  warning: <AlertTriangle size={20} className="text-amber-500 shrink-0" />,
};

const BG = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
  warning: 'border-amber-200 bg-amber-50',
};

const ToastItem = ({ toast: t, onRemove }: { toast: Toast; onRemove: () => void }) => {
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium text-slate-800 animate-slide-in max-w-[360px] w-full ${BG[t.type]}`}>
      {ICONS[t.type]}
      <span className="flex-1 leading-snug">{t.message}</span>
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600 transition mt-0.5">
        <X size={16} />
      </button>
    </div>
  );
};

// ========== Toast Container (render via portal) ==========
export const ToastContainer = () => {
  const { toasts, remove } = useToastStore();

  if (!toasts.length) return null;

  return createPortal(
    <div className="fixed top-[76px] right-4 z-[99999] flex flex-col gap-2 items-end">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={() => remove(t.id)} />
      ))}
    </div>,
    document.body
  );
};
