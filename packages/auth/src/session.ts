export interface AuthSessionUser {
  id: string;
  username: string;
}

export interface AuthSession {
  user: AuthSessionUser;
  expiresAt: string;
}

export interface AuthState {
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  session: AuthSession | null;
}
