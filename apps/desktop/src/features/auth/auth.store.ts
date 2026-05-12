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
      set({ session: null, isLoading: false, error: "Sign-in failed." });
    }
  },
  async signInWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signInWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch {
      set({ isLoading: false, error: "Invalid username or password." });
    }
  },
  async signUpWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signUpWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch {
      set({ isLoading: false, error: "Could not create account with those credentials." });
    }
  },
  async signOut() {
    await authService.signOut();
    set({ session: null, isLocked: true });
  },
  async deleteAccount() {
    set({ isLoading: true, error: null });
    try {
      await authService.deleteAccount();
      set({ session: null, isLocked: true, isLoading: false });
    } catch {
      set({ isLoading: false, error: "Could not delete account." });
    }
  },
  lock() {
    set({ isLocked: true, session: null });
  },
  unlock() {
    set({ isLocked: false });
  }
}));
