import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import {
  supabase,
  syncWithLaravel,
  checkEmail,
  checkIfProfileExists,
} from "../../lib/supabase";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;

async function fetchMe(token) {
  try {
    const { data } = await axios.get(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.data ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        token: null,
        me: null,
        isAuthenticated: false,
        isInitializing: false,
        isAuthenticating: false,
        isInitialized: false,
        googleUser: null,
        error: null,

        setToken: (token) => set({ token, isAuthenticated: !!token }),
        setGoogleUser: (googleUser) => set({ googleUser }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        initializeAuth: async () => {
          const token = get().token;
          if (!token) {
            set({
              isAuthenticated: false,
              isInitializing: false,
              isInitialized: true,
              me: null,
            });
            return;
          }
          set({ isInitializing: true });
          const me = await fetchMe(token);
          set({
            isAuthenticated: true,
            isInitialized: true,
            isInitializing: false,
            me,
          });
        },

        handleGoogleCallback: async (session) => {
          set({ isInitializing: true, error: null });
          try {
            const profileCheck = await checkIfProfileExists(
              session.access_token,
            );

            if (!profileCheck.hasProfile) {
              set({
                googleUser: session.user,
                isInitializing: false,
                isInitialized: true,
              });
              return { needsUsername: true };
            }

            const result = await syncWithLaravel(session.access_token, {
              email: session.user.email,
            });

            if (result.error) {
              set({
                error: result.error,
                isInitializing: false,
                isInitialized: true,
              });
              return { error: result.error };
            }

            const me = await fetchMe(result.token);
            set({
              token: result.token,
              isAuthenticated: true,
              isInitializing: false,
              isInitialized: true,
              me,
            });
            return { success: true };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isInitializing: false,
              isInitialized: true,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        loginWithGoogle: async () => {
          set({ isAuthenticating: true, error: null });
          try {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/auth` },
            });
            if (error) {
              set({ error: error.message, isAuthenticating: false });
              return { error: error.message };
            }
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isAuthenticating: false,
            });
          }
        },

        checkEmailExists: async (email) => {
          set({ isAuthenticating: true, error: null });
          try {
            const data = await checkEmail(email);
            set({ isAuthenticating: false });
            if (data.error) {
              set({ error: data.error });
              return { error: data.error };
            }
            return { exists: data.exists };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isAuthenticating: false,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        login: async (email, password) => {
          set({ isAuthenticating: true, error: null });
          try {
            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (error) {
              set({ error: error.message, isAuthenticating: false });
              return { error: error.message };
            }

            const result = await syncWithLaravel(data.session.access_token, {
              email,
            });
            if (result.error) {
              set({ error: result.error, isAuthenticating: false });
              return { error: result.error };
            }

            const me = await fetchMe(result.token);
            set({
              token: result.token,
              isAuthenticated: true,
              isAuthenticating: false,
              isInitialized: true,
              me,
            });
            return { success: true };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isAuthenticating: false,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        register: async (email, password, username, displayName) => {
          set({ isAuthenticating: true, error: null });
          try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) {
              set({ error: error.message, isAuthenticating: false });
              return { error: error.message };
            }

            localStorage.setItem(
              "pending_profile",
              JSON.stringify({ username, display_name: displayName }),
            );
            set({ isAuthenticating: false });
            return { success: true, needsVerification: true };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isAuthenticating: false,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        finishGoogleSetup: async (username) => {
          set({ isAuthenticating: true, error: null });
          try {
            const {
              data: { session },
              error: sessionError,
            } = await supabase.auth.getSession();
            if (sessionError || !session) {
              set({
                error: "Session expired. Please sign in again.",
                isAuthenticating: false,
              });
              return { error: "Session expired. Please sign in again." };
            }

            const googleUser = get().googleUser;
            const result = await syncWithLaravel(session.access_token, {
              email: googleUser.email,
              username,
              display_name: googleUser.user_metadata?.full_name || "",
              avatar: googleUser.user_metadata?.avatar_url || "",
            });

            if (result.error) {
              set({ error: result.error, isAuthenticating: false });
              return { error: result.error };
            }

            const me = await fetchMe(result.token);
            set({
              token: result.token,
              isAuthenticated: true,
              isAuthenticating: false,
              isInitialized: true,
              googleUser: null,
              me,
            });
            return { success: true };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isAuthenticating: false,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        handleEmailConfirmCallback: async (session) => {
          set({ isInitializing: true, error: null });
          try {
            const pending = JSON.parse(
              localStorage.getItem("pending_profile") || "{}",
            );
            const result = await syncWithLaravel(session.access_token, {
              email: session.user.email,
              username: pending.username,
              display_name: pending.display_name,
            });

            localStorage.removeItem("pending_profile");
            if (result.error) {
              set({
                error: result.error,
                isInitializing: false,
                isInitialized: true,
              });
              return { error: result.error };
            }

            const me = await fetchMe(result.token);
            set({
              token: result.token,
              isAuthenticated: true,
              isInitializing: false,
              isInitialized: true,
              me,
            });
            return { success: true };
          } catch {
            set({
              error: "Something went wrong. Try again.",
              isInitializing: false,
              isInitialized: true,
            });
            return { error: "Something went wrong. Try again." };
          }
        },

        updateMe: (patch) =>
          set((state) => ({
            me: state.me ? { ...state.me, ...patch } : state.me,
          })),

        logout: async () => {
          set({ isAuthenticating: true });
          try {
            await supabase.auth.signOut();
          } finally {
            set({
              token: null,
              isAuthenticated: false,
              isInitialized: true,
              isAuthenticating: false,
              googleUser: null,
              error: null,
              me: null,
            });
          }
        },
      }),
      {
        name: "flock-auth-storage",
        partialize: (state) => ({ token: state.token, me: state.me }),
      },
    ),
    { name: "AuthStore" },
  ),
);
