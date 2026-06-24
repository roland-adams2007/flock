import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const useNotificationStore = create(
  devtools(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      page: 1,
      lastPage: 1,
      error: null,

      fetchNotifications: async (token, page = 1) => {
        if (!token) return;
        set({ isLoading: true, error: null });
        try {
          const { data } = await axios.get(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { page },
          });
          if (data.success) {
            const incoming = data.data?.data ?? [];
            set((state) => ({
              notifications:
                page === 1
                  ? incoming
                  : [...state.notifications, ...incoming],
              unreadCount: data.unread_count ?? 0,
              page: data.data?.current_page ?? page,
              lastPage: data.data?.last_page ?? 1,
              isLoading: false,
            }));
          }
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to load notifications",
            isLoading: false,
          });
        }
      },

      markAllAsRead: async (token) => {
        if (!token) return;
        try {
          await axios.post(
            `${API_BASE}/notifications/mark-as-read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          // Optimistically mark everything read locally
          set((state) => ({
            unreadCount: 0,
            notifications: state.notifications.map((n) => ({
              ...n,
              read_at: n.read_at ?? new Date().toISOString(),
            })),
          }));
        } catch {
          // silent — badge will correct on next fetch
        }
      },

      clearNotifications: () =>
        set({ notifications: [], page: 1, lastPage: 1, error: null }),
    }),
    { name: "NotificationStore" },
  ),
);