import type { AuthSession } from "@r2-explorer/auth/src/session";
export interface AuthStoreState {
    isLoading: boolean;
    isLocked: boolean;
    session: AuthSession | null;
    error: string | null;
    hydrate: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
    lock: () => void;
    unlock: () => void;
}
