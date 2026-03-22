import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role } from 'shared';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  requiresPasswordChange: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (
    user: User,
    accessToken: string,
    refreshToken: string,
    requiresPasswordChange?: boolean
  ) => void;
  setRequiresPasswordChange: (requires: boolean) => void;
  logout: () => void;

  // Helpers
  isAdmin: () => boolean;
  isTeamHead: () => boolean;
  isSubTeamHead: () => boolean;
  isHOD: () => boolean;
  isAssistantHOD: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      requiresPasswordChange: false,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      login: (user, accessToken, refreshToken, requiresPasswordChange) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          requiresPasswordChange: requiresPasswordChange ?? get().requiresPasswordChange,
        }),
      setRequiresPasswordChange: (requires) => set({ requiresPasswordChange: requires }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          requiresPasswordChange: false,
        }),

      isAdmin: () => get().user?.role === Role.ADMIN,
      isTeamHead: () => get().user?.role === Role.TEAM_HEAD,
      isSubTeamHead: () => get().user?.role === Role.SUB_TEAM_HEAD,
      isHOD: () => get().user?.role === Role.HOD,
      isAssistantHOD: () => get().user?.role === Role.ASSISTANT_HOD,
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        requiresPasswordChange: state.requiresPasswordChange,
      }),
    }
  )
);
