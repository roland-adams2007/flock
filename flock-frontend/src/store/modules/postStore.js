import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

export const usePostStore = create(
  devtools(
    (set, get) => ({
      currentPost: null,
      comments: [],
      isLoadingPost: false,
      isLoadingComments: false,
      postError: null,
      error: null,

      fetchPost: async (postId, token) => {
        set({
          isLoadingPost: true,
          postError: null,
          currentPost: null,
          comments: [],
        });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(`${API_BASE}/posts/${postId}`, {
            headers,
          });
          if (data.success) {
            set({ currentPost: data.post, isLoadingPost: false });
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

      fetchComments: async (postId, token) => {
        set({ isLoadingComments: true });
        try {
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const { data } = await axios.get(
            `${API_BASE}/posts/${postId}/comments`,
            { headers },
          );
          if (data.success) {
            set({ comments: data.comments, isLoadingComments: false });
          }
        } catch (err) {
          set({ isLoadingComments: false });
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
            { headers: { Authorization: `Bearer ${token}` } },
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
            { headers: { Authorization: `Bearer ${token}` } },
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

      createComment: async (postId, content, token) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts/${postId}/comments`,
            { content },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (data.success) {
            set((state) => ({
              comments: [data.comment, ...state.comments],
              currentPost: state.currentPost
                ? {
                    ...state.currentPost,
                    counts: {
                      ...state.currentPost.counts,
                      comments: (state.currentPost.counts?.comments ?? 0) + 1,
                    },
                  }
                : null,
            }));
          }
          return data;
        } catch (err) {
          set({ error: err.response?.data?.message || "Failed to comment" });
          return { error: true };
        }
      },

      likeComment: async (commentId, token) => {
        try {
          await axios.post(
            `${API_BASE}/comments/${commentId}/like`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to like comment",
          });
        }
      },

      unlikeComment: async (commentId, token) => {
        try {
          await axios.delete(`${API_BASE}/comments/${commentId}/like`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to unlike comment",
          });
        }
      },

      repostComment: async (commentId, token) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/comments/${commentId}/repost`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          );
          return data;
        } catch (err) {
          set({
            error: err.response?.data?.message || "Failed to repost comment",
          });
          return { error: true };
        }
      },

      unrepostComment: async (commentId, token) => {
        try {
          await axios.delete(`${API_BASE}/comments/${commentId}/repost`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          set({
            error:
              err.response?.data?.message || "Failed to undo repost comment",
          });
        }
      },

      replyToComment: async (postId, content, token, parentCommentId) => {
        try {
          const { data } = await axios.post(
            `${API_BASE}/posts/${postId}/comments`,
            { content, parent_comment_id: parentCommentId },
            { headers: { Authorization: `Bearer ${token}` } },
          );
          if (data.success) {
            set((state) => ({
              comments: [data.comment, ...state.comments],
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

      updateLocalComment: (commentId, changes) => {
        set((state) => ({
          comments: state.comments.map((c) =>
            c.id === commentId ? { ...c, ...changes } : c,
          ),
        }));
      },

      clearPost: () =>
        set({ currentPost: null, comments: [], postError: null, error: null }),
    }),
    { name: "PostStore" },
  ),
);
