import { create } from "zustand";
import { authService } from "./auth.service";
import type { AuthStoreState } from "./auth.types";

export const useAuthStore = create<AuthStoreState>((set) => ({
  isLoading: true,
  isLocked: false,
  session: null,
  error: null,
  async hydrate() {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.getSession();
      set({ session, isLocked: false, isLoading: false });
    } catch {
      set({ session: null, isLoading: false, error: "GitHub sign-in failed. Try again or check your browser authorization window." });
    }
  },
  async signInWithGithub() {
    set({ isLoading: true, error: null });
    try {
      await authService.signInWithGithub();
      const session = await authService.getSession();
      set({ session, isLoading: false, isLocked: false });
    } catch {
      set({ isLoading: false, error: "GitHub sign-in failed. Try again or check your browser authorization window." });
    }
  },
  async signOut() {
    await authService.signOut();
    set({ session: null, isLocked: true });
  },
  lock() {
    set({ isLocked: true, session: null });
  },
  unlock() {
    set({ isLocked: false });
  }
}));
