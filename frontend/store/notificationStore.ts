import { create } from "zustand";

type NotificationUiState = {
  unreadEstimate: number;
  setUnreadEstimate: (n: number) => void;
};

export const useNotificationStore = create<NotificationUiState>((set) => ({
  unreadEstimate: 0,
  setUnreadEstimate: (n) => set({ unreadEstimate: n }),
}));
