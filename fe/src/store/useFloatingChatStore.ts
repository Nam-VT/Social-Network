import { create } from 'zustand';

interface FloatingChatStore {
  activeRoomIds: number[];
  openChat: (roomId: number) => void;
  closeChat: (roomId: number) => void;
  toggleChat: (roomId: number) => void;
}

export const useFloatingChatStore = create<FloatingChatStore>((set) => ({
  activeRoomIds: [],
  openChat: (roomId) =>
    set((state) => {
      // Giữ tối đa 3 cửa sổ chat nổi
      if (state.activeRoomIds.includes(roomId)) return state;
      const newIds = [roomId, ...state.activeRoomIds].slice(0, 3);
      return { activeRoomIds: newIds };
    }),
  closeChat: (roomId) =>
    set((state) => ({
      activeRoomIds: state.activeRoomIds.filter((id) => id !== roomId),
    })),
  toggleChat: (roomId) =>
    set((state) => {
      if (state.activeRoomIds.includes(roomId)) {
        return { activeRoomIds: state.activeRoomIds.filter((id) => id !== roomId) };
      }
      const newIds = [roomId, ...state.activeRoomIds].slice(0, 3);
      return { activeRoomIds: newIds };
    }),
}));
