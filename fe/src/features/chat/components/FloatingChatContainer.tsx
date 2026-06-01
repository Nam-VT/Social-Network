import { useFloatingChatStore } from '@/store/useFloatingChatStore';
import { FloatingChatWindow } from './FloatingChatWindow';

export const FloatingChatContainer = () => {
  const activeRoomIds = useFloatingChatStore((state) => state.activeRoomIds);

  if (activeRoomIds.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-4 sm:right-24 z-[150] flex items-end gap-3 pointer-events-none">
      {activeRoomIds.map((roomId) => (
        <FloatingChatWindow key={roomId} roomId={roomId} />
      ))}
    </div>
  );
};
