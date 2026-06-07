/**
 * Format thời gian "last seen" chính xác đến phút.
 * - Dưới 1 phút → "Vừa truy cập"
 * - 1-59 phút → "X phút trước"
 * - 1-23 giờ → "X giờ trước"
 * - 1-6 ngày → "X ngày trước"
 * - Trên 7 ngày → "dd/MM/yyyy"
 */
export const formatLastSeen = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHour = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'Vừa truy cập';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay <= 6) return `${diffDay} ngày trước`;

    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return 'Ngoại tuyến';
  }
};
