import type { AuthSession } from "@r2-explorer/auth/src/session";

export interface AuthStoreState {
  isLoading: boolean;
  isLocked: boolean;
  session: AuthSession | null;
  error: string | null;
  hydrate: () => Promise<void>;
  signInWithPassword: (username: string, password: string) => Promise<void>;
  signUpWithPassword: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
}
