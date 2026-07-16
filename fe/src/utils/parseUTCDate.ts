/**
 * Parse chuỗi thời gian từ backend (LocalDateTime, không có timezone info) thành Date object.
 * Backend lưu thời gian theo UTC nhưng trả về không có suffix 'Z',
 * nên cần thêm 'Z' để browser parse đúng là UTC rồi tự convert sang local timezone.
 *
 * Ví dụ: Backend trả "2026-07-16T15:00:00"
 * - Không fix: new Date("2026-07-16T15:00:00") → parse là 15:00 giờ VN (sai)
 * - Có fix: new Date("2026-07-16T15:00:00Z") → parse là 15:00 UTC = 22:00 VN (đúng)
 */
export const parseUTCDate = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return new Date(NaN);

  // Nếu đã có timezone info (Z, +, -) thì parse trực tiếp
  if (/[Zz]$/.test(dateStr) || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Thêm 'Z' suffix để parse as UTC
  return new Date(dateStr + 'Z');
};
