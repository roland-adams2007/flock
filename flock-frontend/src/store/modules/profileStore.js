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

      isFollowing: false,
      isFollowLoading: false,

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

      fetchPosts: async (username, token, page = 1) => {
        set({ isLoadingPosts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/posts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => ({
              profiles: { ...state.profiles, [username]: { ...state.profiles[username], posts: data.posts } },
              isLoadingPosts: false,
            }));
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load posts", isLoadingPosts: false });
        }
      },

      fetchReplies: async (username, token, page = 1) => {
        set({ isLoadingReplies: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/replies`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => ({
              profiles: { ...state.profiles, [username]: { ...state.profiles[username], replies: data.replies } },
              isLoadingReplies: false,
            }));
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load replies", isLoadingReplies: false });
        }
      },

      fetchLikedPosts: async (username, token, page = 1) => {
        set({ isLoadingLikedPosts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/likes/posts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => ({
              profiles: { ...state.profiles, [username]: { ...state.profiles[username], likedPosts: data.liked_posts } },
              isLoadingLikedPosts: false,
            }));
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load liked posts", isLoadingLikedPosts: false });
        }
      },

      fetchReposts: async (username, token, page = 1) => {
        set({ isLoadingReposts: true, error: null });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/profile/reposts`, { params: { username, page }, headers });
          if (data.success) {
            set((state) => ({
              profiles: { ...state.profiles, [username]: { ...state.profiles[username], reposts: data.reposted_posts } },
              isLoadingReposts: false,
            }));
          }
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to load reposts", isLoadingReposts: false });
        }
      },

      createPost: async (content, token, username) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (data.success && username) {
            set((state) => {
              const profile = state.profiles[username];
              if (!profile || !profile.posts) return {};
              return {
                profiles: {
                  ...state.profiles,
                  [username]: {
                    ...profile,
                    posts: {
                      ...profile.posts,
                      data: [data.post, ...(profile.posts.data ?? [])],
                      total: (profile.posts.total ?? 0) + 1,
                    },
                  },
                },
              };
            });
          }
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to create post" });
          return { error: true };
        }
      },

      deletePost: async (postId, token) => {
        try {
          await axios.delete(`${API_BASE}/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to delete post" });
        }
      },

      editPost: async (postId, content, token) => {
        try {
          const { data } = await axios.put(
            `${API_BASE}/posts/${postId}`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to edit post" });
          return { error: true };
        }
      },

      likePost: async (postId, token) => {
        try {
          await axios.post(`${API_BASE}/posts/${postId}/like`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to like post" });
        }
      },

      unlikePost: async (postId, token) => {
        try {
          await axios.delete(`${API_BASE}/posts/${postId}/like`, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to unlike post" });
        }
      },

      repostPost: async (postId, token) => {
        try {
          await axios.post(`${API_BASE}/posts/${postId}/repost`, {}, { headers: { Authorization: `Bearer ${token}` } });
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to repost" });
        }
      },

      createComment: async (postId, content, token) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts/${postId}/comments`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to comment" });
          return { error: true };
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
              if (!profile) return {};
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
              if (!profile) return {};
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