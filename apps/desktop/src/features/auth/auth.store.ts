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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-in failed.";
      set({ session: null, isLoading: false, error: message });
    }
  },
  async signInWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signInWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid username or password.";
      set({ isLoading: false, error: message });
    }
  },
  async signUpWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signUpWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create account with those credentials.";
      set({ isLoading: false, error: message });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not delete account.";
      set({ isLoading: false, error: message });
    }
  },
  lock() {
    set({ isLocked: true, session: null });
  },
  unlock() {
    set({ isLocked: false });
  }
}));
