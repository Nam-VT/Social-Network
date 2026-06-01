import { FileText, Info, Users, Image, Bookmark } from 'lucide-react';
import '@/styles/profile/profile.css';

export type TabKey = 'posts' | 'about' | 'friends' | 'photos' | 'saved';

interface ProfileTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  isOwnProfile?: boolean;
}

const TABS: { key: TabKey; label: string; icon: React.ElementType; ownOnly?: boolean }[] = [
  { key: 'posts', label: 'Bài viết', icon: FileText },
  { key: 'about', label: 'Giới thiệu', icon: Info },
  { key: 'friends', label: 'Bạn bè', icon: Users },
  { key: 'photos', label: 'Ảnh', icon: Image },
  { key: 'saved', label: 'Đã lưu', icon: Bookmark, ownOnly: true },
];

export const ProfileTabs = ({ activeTab, onTabChange, isOwnProfile }: ProfileTabsProps) => {
  const visibleTabs = TABS.filter(t => !t.ownOnly || isOwnProfile);

  return (
    <div
      className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border-light)] shadow-sm"
      style={{ position: 'sticky', top: '64px', zIndex: 50 }}
    >
      <div className="max-w-[940px] mx-auto px-4 sm:px-0 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {visibleTabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`
              relative flex items-center gap-2 px-4 py-4 text-sm font-semibold
              transition-colors duration-150 whitespace-nowrap flex-none
              ${activeTab === key
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]'
              }
            `}
          >
            <Icon size={18} />
            {label}
            {/* Active indicator bar */}
            {activeTab === key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full"
                style={{ backgroundColor: 'var(--color-accent)' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
