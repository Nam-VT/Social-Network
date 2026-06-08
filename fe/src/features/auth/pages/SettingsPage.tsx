import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Lock, Eye, Bell, Shield, ChevronRight, Check } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';
import { toast } from '@/components/ui/Toast';

type SettingsTab = 'password' | 'privacy' | 'notifications' | 'security';

export const SettingsPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [activeTab, setActiveTab] = useState<SettingsTab>('password');

  // Password change state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const changePwMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await axiosClient.put('/users/me/password', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwErrors({});
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Mật khẩu hiện tại không đúng');
    },
  });

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!pwForm.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    if (pwForm.newPassword.length < 8) errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự';
    if (pwForm.newPassword !== pwForm.confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }
    changePwMutation.mutate({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
  };

  const tabs = [
    { id: 'password' as SettingsTab, label: 'Đổi mật khẩu', icon: Lock },
    { id: 'privacy' as SettingsTab, label: 'Quyền riêng tư', icon: Eye },
    { id: 'notifications' as SettingsTab, label: 'Thông báo', icon: Bell },
    { id: 'security' as SettingsTab, label: 'Bảo mật', icon: Shield },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 py-6 px-4">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Cài đặt & Quyền riêng tư</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Sidebar Tabs */}
        <aside className="sm:w-52 flex-shrink-0">
          <nav className="bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-light)] overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors border-b border-[var(--color-border-light)] last:border-0 ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon size={16} />
                  {tab.label}
                </div>
                <ChevronRight size={14} className="opacity-40" />
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-light)] p-6">
          {/* Đổi mật khẩu */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Đổi mật khẩu</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">Để bảo mật tài khoản, không dùng mật khẩu quá đơn giản.</p>

              <form onSubmit={handlePwSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                    placeholder="••••••••"
                  />
                  {pwErrors.currentPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.currentPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                    placeholder="Ít nhất 8 ký tự"
                  />
                  {pwErrors.newPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors text-sm"
                    placeholder="••••••••"
                  />
                  {pwErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{pwErrors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={changePwMutation.isPending}
                  className="w-full py-2.5 bg-[var(--color-accent)] hover:opacity-90 text-white font-semibold rounded-xl transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {changePwMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : <Check size={16} />}
                  Lưu thay đổi
                </button>
              </form>
            </div>
          )}

          {/* Quyền riêng tư */}
          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Quyền riêng tư</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">Kiểm soát ai có thể xem thông tin của bạn.</p>
              <div className="space-y-4">
                {[
                  { label: 'Danh sách bạn bè', desc: 'Ai có thể xem danh sách bạn bè của bạn' },
                  { label: 'Bài viết mặc định', desc: 'Chế độ hiển thị mặc định cho bài viết mới' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border-light)] last:border-0">
                    <div>
                      <p className="font-medium text-sm text-[var(--color-text-primary)]">{item.label}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.desc}</p>
                    </div>
                    <select className="text-sm px-3 py-1.5 rounded-lg border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors">
                      <option value="PUBLIC">Công khai</option>
                      <option value="FRIENDS">Bạn bè</option>
                      <option value="PRIVATE">Chỉ mình tôi</option>
                    </select>
                  </div>
                ))}
                <p className="text-xs text-[var(--color-text-secondary)] pt-2">
                  💡 Cài đặt quyền riêng tư chi tiết có thể chỉnh sửa từ trang cá nhân của bạn.
                </p>
              </div>
            </div>
          )}

          {/* Thông báo */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Thông báo</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">Chọn loại thông báo bạn muốn nhận.</p>
              <div className="space-y-3">
                {[
                  { label: 'Lời mời kết bạn', defaultChecked: true },
                  { label: 'Like và bình luận bài viết', defaultChecked: true },
                  { label: 'Tin nhắn mới', defaultChecked: true },
                  { label: 'Yêu cầu tham gia nhóm', defaultChecked: false },
                  { label: 'Bài viết mới trong nhóm', defaultChecked: false },
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between py-2 cursor-pointer">
                    <span className="text-sm text-[var(--color-text-primary)]">{item.label}</span>
                    <input type="checkbox" defaultChecked={item.defaultChecked}
                      className="w-4 h-4 accent-[var(--color-accent)]" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Bảo mật */}
          {activeTab === 'security' && (
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] mb-1">Bảo mật</h2>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6">Thông tin tài khoản và bảo mật đăng nhập.</p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)]">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Tài khoản</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">@{user?.username} · {user?.email}</p>
                </div>
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Shield size={16} />
                    <p className="text-sm font-medium">Tài khoản đang được bảo vệ</p>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                    Mọi phiên đăng nhập đều được xác thực qua JWT Token.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
