export interface SystemStats {
  totalUsers: number;
  totalPosts: number;
  totalGroups: number;
  pendingReports: number;
}

export interface UserAdminResponse {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface ReportResponse {
  id: number;
  reporterId: number;
  reporterUsername: string;
  targetId: number;
  targetType: string; // POST, COMMENT, USER, GROUP
  reason: string;
  description: string;
  status: string; // PENDING, RESOLVED, DISMISSED
  createdAt: string;
  resolvedAt: string | null;
}

export interface AuditLog {
  id: number;
  adminId: number;
  adminUsername: string;
  action: string;
  details: string;
  createdAt: string;
}

// Giả sử backend trả về dạng phân trang (Page) của Spring Boot
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
