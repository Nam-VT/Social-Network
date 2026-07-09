export const formatTimeAgo = (dateStr: string | Date): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs <= 0) return 'Vừa xong';

    const diffMin = Math.floor(diffMs / 60_000);
    const diffHour = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);

    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    if (diffHour < 24) return `${diffHour} giờ trước`;
    if (diffDay <= 7) return `${diffDay} ngày trước`;

    const dd = date.getDate();
    const mm = date.getMonth() + 1;
    const yyyy = date.getFullYear();
    
    if (now.getFullYear() === yyyy) {
      return `${dd} tháng ${mm}`;
    }
    
    return `${dd} tháng ${mm}, ${yyyy}`;
  } catch {
    return '';
  }
};
