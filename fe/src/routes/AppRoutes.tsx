import { Routes, Route, Link } from 'react-router-dom';
import { PrivateRoute } from './PrivateRoute';
import { PublicRoute } from './PublicRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { AppLayout } from '@/components/Layout/AppLayout';
import { NewsfeedPage } from '@/features/newsfeed/pages/NewsfeedPage';
import { PostDetailPage } from '@/features/newsfeed/pages/PostDetailPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';
import { ChatPage } from '@/features/chat/pages/ChatPage';
import { GroupsPage } from '@/features/groups/pages/GroupsPage';
import { GroupDetailPage } from '@/features/groups/pages/GroupDetailPage';
import { SearchPage } from '@/features/search/pages/SearchPage';
import { HashtagPage } from '@/features/search/pages/HashtagPage';
import { AdminLayout } from '@/features/admin/components/AdminLayout';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';
import { AdminUsersPage } from '@/features/admin/pages/AdminUsersPage';
import { AdminReportsPage } from '@/features/admin/pages/AdminReportsPage';
import { AdminAuditLogsPage } from '@/features/admin/pages/AdminAuditLogsPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Private Routes */}
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<NewsfeedPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/saved" element={<ProfilePage defaultTab="saved" />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/chat/:roomId" element={<ChatPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/hashtag/:tag" element={<HashtagPage />} />
        </Route>

        {/* Admin Routes (Được bảo vệ bằng role ADMIN trong AdminLayout) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="logs" element={<AdminAuditLogsPage />} />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route
        path="*"
        element={
          <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <p className="text-red-500 text-center font-bold text-2xl">404 - Không tìm thấy trang</p>
            <Link to="/" className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:opacity-90">
              Về trang chủ
            </Link>
          </div>
        }
      />
    </Routes>
  );
};
