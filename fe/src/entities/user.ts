export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status?: 'ONLINE' | 'OFFLINE';
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}
