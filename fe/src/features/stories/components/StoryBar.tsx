import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { storyApi } from '../api/storyApi';
import { StoryRing } from './StoryRing';
import { useAuthStore } from '../../../store/useAuthStore';
import { StoryViewer } from './StoryViewer';
import { StoryCreator } from './StoryCreator';
import type { StoryGroupResponse } from '../types';

export const StoryBar: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const [activeGroupIndex, setActiveGroupIndex] = useState<number | null>(null);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);

  const { data: storyGroups = [], isLoading } = useQuery<StoryGroupResponse[]>({
    queryKey: ['stories', 'active'],
    queryFn: async () => {
      const res = await storyApi.getActiveStories();
      // Xử lý cả 2 trường hợp: AxiosResponse wrapper hoặc trực tiếp
      const payload = (res as any).data ?? res;
      const arr = payload?.data ?? payload;
      return Array.isArray(arr) ? arr : [];
    },
    refetchInterval: 30000, // Tự refresh mỗi 30s để thấy story mới
  });

  const handleOpenViewer = (index: number) => {
    setActiveGroupIndex(index);
  };

  const handleCloseViewer = () => {
    setActiveGroupIndex(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex gap-4 overflow-x-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Hiển thị story của mình riêng (nếu có)
  const myGroup = storyGroups.find(g => g.userId === user?.id);
  // Danh sách story bạn bè (trừ mình)
  const friendGroups = storyGroups.filter(g => g.userId !== user?.id);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        
        {/* Nút Tạo tin / Tin của mình */}
        <StoryRing
          name={myGroup ? 'Tin của bạn' : 'Tạo tin'}
          avatarUrl={user?.avatarUrl}
          hasUnviewed={myGroup ? myGroup.stories.some(s => !s.isViewed) : false}
          isAddButton={!myGroup}
          onClick={() => {
            if (myGroup) {
              // Click vào story bản thân → Mở viewer ở đúng vị trí của mình
              const myIndex = storyGroups.findIndex(g => g.userId === user?.id);
              if (myIndex !== -1) handleOpenViewer(myIndex);
            } else {
              setIsCreatorOpen(true);
            }
          }}
        />

        {/* Nếu có story rồi vẫn cho tạo thêm */}
        {myGroup && (
          <StoryRing
            name="Tạo tin"
            avatarUrl={user?.avatarUrl}
            hasUnviewed={false}
            isAddButton={true}
            onClick={() => setIsCreatorOpen(true)}
          />
        )}

        {/* Danh sách story bạn bè */}
        {friendGroups.map((group) => {
          const hasUnviewed = group.stories.some(s => !s.isViewed);
          // Lấy index trong mảng gốc storyGroups (ko phải friendGroups)
          const originalIndex = storyGroups.findIndex(g => g.userId === group.userId);
          
          return (
            <StoryRing
              key={group.userId}
              name={group.userFullName}
              avatarUrl={group.userAvatar}
              hasUnviewed={hasUnviewed}
              onClick={() => handleOpenViewer(originalIndex)}
            />
          );
        })}
      </div>

      {activeGroupIndex !== null && (
        <StoryViewer
          initialGroupIndex={activeGroupIndex}
          storyGroups={storyGroups}
          onClose={handleCloseViewer}
        />
      )}

      {isCreatorOpen && (
        <StoryCreator onClose={() => setIsCreatorOpen(false)} />
      )}
    </div>
  );
};
