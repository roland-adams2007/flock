import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const useProfileStore = create(
  devtools(
    (set, get) => ({
      profiles: {},
      activeUsername: null,

      isLoadingProfile: false,
      isLoadingPosts: false,
      isLoadingReplies: false,
      isLoadingLikedPosts: false,
      isLoadingReposts: false,
      isLoadingFollowers: false,
      isLoadingFollowing: false,

      isFollowing: false,
      isFollowLoading: false,

      followers: [],
      following: [],

      error: null,

      getProfile: (username) => get().profiles[username] ?? null,

      fetchProfile: async (username, token) => {
        if (get().profiles[username]) {
          set({ activeUsername: username });
          return;
        }
        set({ isLoadingProfile: true, error: null, activeUsername: username });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/${username}`, { headers });
          if (data.success) {
            set((state) => ({
              profiles: {
                ...state.profiles,
                [username]: {
                  info: data.user,
                  mine: data.mine,
                  followers_count: data.followers_count,
                  following_count: data.following_count,
                  posts: null,
                  replies: null,
                  likedPosts: null,
                  reposts: null,
                },
              },
              isFollowing: data.is_following ?? false,
              isLoadingProfile: false,
            }));
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load profile", isLoadingProfile: false });
        }
      },

      fetchPosts: async (username, token, page = 1, force = false) => {
        const profile = get().profiles[username];
        if (!force && page === 1 && profile?.posts) return;
        const isFirstPage = page === 1;
        set({ isLoadingPosts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/posts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => {
              const existing = state.profiles[username];
              const prevData = !isFirstPage && existing?.posts?.data ? existing.posts.data : [];
              return {
                profiles: {
                  ...state.profiles,
                  [username]: {
                    ...existing,
                    posts: {
                      ...data.posts,
                      data: [...prevData, ...data.posts.data],
                    },
                  },
                },
                isLoadingPosts: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load posts", isLoadingPosts: false });
        }
      },

      fetchReplies: async (username, token, page = 1, force = false) => {
        const profile = get().profiles[username];
        if (!force && page === 1 && profile?.replies) return;
        const isFirstPage = page === 1;
        set({ isLoadingReplies: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/replies`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => {
              const existing = state.profiles[username];
              const prevData = !isFirstPage && existing?.replies?.data ? existing.replies.data : [];
              return {
                profiles: {
                  ...state.profiles,
                  [username]: {
                    ...existing,
                    replies: {
                      ...data.replies,
                      data: [...prevData, ...data.replies.data],
                    },
                  },
                },
                isLoadingReplies: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load replies", isLoadingReplies: false });
        }
      },

      fetchLikedPosts: async (username, token, page = 1, force = false) => {
        const profile = get().profiles[username];
        if (!force && page === 1 && profile?.likedPosts) return;
        const isFirstPage = page === 1;
        set({ isLoadingLikedPosts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/likes/posts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => {
              const existing = state.profiles[username];
              const prevData = !isFirstPage && existing?.likedPosts?.data ? existing.likedPosts.data : [];
              return {
                profiles: {
                  ...state.profiles,
                  [username]: {
                    ...existing,
                    likedPosts: {
                      ...data.liked_posts,
                      data: [...prevData, ...data.liked_posts.data],
                    },
                  },
                },
                isLoadingLikedPosts: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load liked posts", isLoadingLikedPosts: false });
        }
      },

      fetchReposts: async (username, token, page = 1, force = false) => {
        const profile = get().profiles[username];
        if (!force && page === 1 && profile?.reposts) return;
        const isFirstPage = page === 1;
        set({ isLoadingReposts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/reposts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => {
              const existing = state.profiles[username];
              const prevData = !isFirstPage && existing?.reposts?.data ? existing.reposts.data : [];
              return {
                profiles: {
                  ...state.profiles,
                  [username]: {
                    ...existing,
                    reposts: {
                      ...data.reposted_posts,
                      data: [...prevData, ...data.reposted_posts.data],
                    },
                  },
                },
                isLoadingReposts: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load reposts", isLoadingReposts: false });
        }
      },

      fetchFollowers: async (username, token) => {
        set({ isLoadingFollowers: true });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/${username}/followers`, { headers });
          if (data.success) {
            set({ followers: data.followers, isLoadingFollowers: false });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load followers", isLoadingFollowers: false });
        }
      },

      fetchFollowing: async (username, token) => {
        set({ isLoadingFollowing: true });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/${username}/following`, { headers });
          if (data.success) {
            set({ following: data.following, isLoadingFollowing: false });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load following", isLoadingFollowing: false });
        }
      },

      updateProfile: async (username, form, token) => {
        try {
          const { data } = await axios.put(
            `${API_BASE}/profile/${username}`,
            form,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success) {
            set((state) => ({
              profiles: {
                ...state.profiles,
                [username]: {
                  ...state.profiles[username],
                  info: { ...state.profiles[username]?.info, ...data.profile },
                },
              },
            }));
          }
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to update profile" });
          return { error: true };
        }
      },

      uploadAvatar: async (file, token) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await axios.post(`${API_BASE}/media/upload`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
          if (!data.url) return { error: true };
          return { url: data.url };
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to upload avatar" });
          return { error: true };
        }
      },

      followUser: async (username, token) => {
        set({ isFollowLoading: true });
        try {
          const { data } = await axios.post(
            `${API_BASE}/profile/${username}/follow`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success) {
            set((state) => {
              const profile = state.profiles[username];
              if (!profile) return { isFollowing: true, isFollowLoading: false };
              return {
                profiles: { ...state.profiles, [username]: { ...profile, followers_count: profile.followers_count + 1 } },
                isFollowing: true,
                isFollowLoading: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to follow user", isFollowLoading: false });
        }
      },

      unfollowUser: async (username, token) => {
        set({ isFollowLoading: true });
        try {
          const { data } = await axios.delete(
            `${API_BASE}/profile/${username}/follow`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success) {
            set((state) => {
              const profile = state.profiles[username];
              if (!profile) return { isFollowing: false, isFollowLoading: false };
              return {
                profiles: { ...state.profiles, [username]: { ...profile, followers_count: Math.max(0, profile.followers_count - 1) } },
                isFollowing: false,
                isFollowLoading: false,
              };
            });
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to unfollow user", isFollowLoading: false });
        }
      },

      clearProfile: () => set({ activeUsername: null, error: null }),
    }),
    { name: "ProfileStore" }
  )
);