import { create } from "zustand";
import { authService } from "./auth.service";
import type { AuthStoreState } from "./auth.types";

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error && typeof error === "object") {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }
  }
  return fallback;
}

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
      set({ session: null, isLoading: false, isLocked: true, error: null });
    }
  },
  async signInWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signInWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch (error) {
      const message = toErrorMessage(error, "Invalid username or password.");
      set({ isLoading: false, error: message });
    }
  },
  async signUpWithPassword(username, password) {
    set({ isLoading: true, error: null });
    try {
      const session = await authService.signUpWithPassword(username, password);
      set({ session, isLoading: false, isLocked: false });
    } catch (error) {
      const message = toErrorMessage(error, "Could not create account with those credentials.");
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
      const message = toErrorMessage(error, "Could not delete account.");
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
