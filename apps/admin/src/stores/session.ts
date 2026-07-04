import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/types';

const STORAGE_KEY = 'altan.admin.session';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** True once we have a valid access token + user. */
  isAuthenticated: () => boolean;
  setSession: (p: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (p: { accessToken: string; refreshToken: string }) => void;
  setUser: (user: AuthUser) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: () => Boolean(get().accessToken && get().user),
      setSession: ({ accessToken, refreshToken, user }) => set({ accessToken, refreshToken, user }),
      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: STORAGE_KEY },
  ),
);

/** Non-reactive accessors for use inside the axios interceptor (outside React). */
export const sessionApi = {
  getAccessToken: () => useSessionStore.getState().accessToken,
  getRefreshToken: () => useSessionStore.getState().refreshToken,
  setTokens: (p: { accessToken: string; refreshToken: string }) =>
    useSessionStore.getState().setTokens(p),
  clear: () => useSessionStore.getState().clear(),
};
