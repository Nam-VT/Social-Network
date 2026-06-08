import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: { btn: 'bg-red-600 hover:bg-red-700 text-white', icon: 'text-red-500', bg: 'bg-red-100' },
    warning: { btn: 'bg-amber-500 hover:bg-amber-600 text-white', icon: 'text-amber-500', bg: 'bg-amber-100' },
    info: { btn: 'bg-blue-600 hover:bg-blue-700 text-white', icon: 'text-blue-500', bg: 'bg-blue-100' },
  };
  const style = variantStyles[variant];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
              <AlertTriangle size={24} className={style.icon} />
            </div>
            <div>
              <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end mt-6">
            <button
              ref={cancelRef}
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2 ${style.btn}`}
            >
              {isLoading && (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
