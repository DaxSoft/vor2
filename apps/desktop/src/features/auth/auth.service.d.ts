export declare const authService: {
    getSession(): Promise<import("@r2-explorer/auth/src/session").AuthSession | null>;
    signInWithGithub(): Promise<void>;
    signOut(): Promise<void>;
};
