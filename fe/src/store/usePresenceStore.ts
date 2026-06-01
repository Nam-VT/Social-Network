import { create } from 'zustand';

/**
 * Zustand store lưu trạng thái online/offline real-time.
 * Được cập nhật bởi usePresenceSocket khi nhận event từ /topic/presence.
 */
interface PresenceStore {
  onlineUsers: Set<string>;
  lastSeenMap: Map<string, string>; // username → ISO datetime string
  setOnline: (username: string) => void;
  setOffline: (username: string, lastSeenAt?: string) => void;
  isOnline: (username: string) => boolean;
  getLastSeen: (username: string) => string | undefined;
}

export const usePresenceStore = create<PresenceStore>((set, get) => ({
  onlineUsers: new Set(),
  lastSeenMap: new Map(),
  setOnline: (username) =>
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, username]) })),
  setOffline: (username, lastSeenAt) =>
    set((state) => {
      const next = new Set(state.onlineUsers);
      next.delete(username);
      const nextMap = new Map(state.lastSeenMap);
      if (lastSeenAt) {
        nextMap.set(username, lastSeenAt);
      }
      return { onlineUsers: next, lastSeenMap: nextMap };
    }),
  isOnline: (username) => get().onlineUsers.has(username),
  getLastSeen: (username) => get().lastSeenMap.get(username),
}));
