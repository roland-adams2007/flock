import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const usePostStore = create(
  devtools(
    (set, get) => ({
      currentPost: null,
      parentPost: null,
      replies: [],
      isLoadingPost: false,
      isLoadingReplies: false,
      postError: null,
      error: null,

      fetchPost: async (postId, token) => {
        set({
          isLoadingPost: true,
          postError: null,
          currentPost: null,
          parentPost: null,
          replies: [],
        });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/posts/${postId}`, {
            headers,
          });
          if (data.success) {
            set({
              currentPost: data.post,
              parentPost: data.parent ?? null,
              isLoadingPost: false,
            });
          } else {
            set({
              postError: data.message || "Failed to load post",
              isLoadingPost: false,
            });
          }
        } catch (err) {
          set({
            postError: err.response?.data?.message || "Failed to load post",
            isLoadingPost: false,
          });
        }
      },

      fetchReplies: async (postId, token) => {
        set({ isLoadingReplies: true });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(
            `${API_BASE}/posts/${postId}/replies`,
            { headers },
          );
          if (data.success) {
            set({ replies: data.comments, isLoadingReplies: false });
          }
        } catch (err) {
          set({ isLoadingReplies: false });
        }
      },

      createPost: async (content, token, username, mediaUrls = []) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts`,
            { content, media: mediaUrls },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return data;
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to create post",
          });
          return { error: true };
        }
      },

      deletePost: async (postId, token) => {
        try {
          await axios.delete(`${API_BASE}/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to delete post",
          });
        }
      },

      editPost: async (postId, content, token) => {
        try {
          const { data } = await axios.put(
            `${API_BASE}/posts/${postId}`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to edit post" });
          return { error: true };
        }
      },

      likePost: async (postId, token) => {
        try {
          await axios.post(
            `${API_BASE}/posts/${postId}/like`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to like post" });
        }
      },

      unlikePost: async (postId, token) => {
        try {
          await axios.delete(`${API_BASE}/posts/${postId}/like`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to unlike post",
          });
        }
      },

      repostPost: async (postId, token) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts/${postId}/repost`,
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to repost" });
          return { error: true };
        }
      },

      unrepostPost: async (postId, token) => {
        try {
          await axios.delete(`${API_BASE}/posts/${postId}/repost`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to undo repost",
          });
        }
      },

      createReply: async (parentPostId, content, token) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts/${parentPostId}/replies`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (data.success) {
            set((state) => ({
              replies: [data.comment, ...state.replies],
              currentPost: state.currentPost
                ? {
                    ...state.currentPost,
                    counts: {
                      ...state.currentPost.counts,
                      replies: (state.currentPost.counts?.replies ?? 0) + 1,
                    },
                  }
                : null,
            }));
          }
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to reply" });
          return { error: true };
        }
      },

      uploadMedia: async (file, token) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const { data } = await axios.post(
            `${API_BASE}/media/upload`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );
          if (!data.url) return { error: true };
          return {
            url: data.url,
            type:
              data.type ?? (file.type.startsWith("video") ? "video" : "image"),
          };
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to upload media",
          });
          return { error: true };
        }
      },

      updateLocalReply: (replyId, changes) => {
        set((state) => ({
          replies: state.replies.map((r) =>
            r.id === replyId ? { ...r, ...changes } : r,
          ),
        }));
      },

      clearPost: () =>
        set({
          currentPost: null,
          parentPost: null,
          replies: [],
          postError: null,
          error: null,
        }),
    }),
    { name: "PostStore" },
  ),
);
