import { useState, useEffect } from 'react';

/**
 * Hook tạo "tick" mỗi intervalMs (mặc định 30s) để force re-render component.
 * Dùng cho các nơi hiển thị "X phút trước", "X giờ trước" để tự cập nhật real-time.
 */
export const useTimeTick = (intervalMs = 30_000) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
};
