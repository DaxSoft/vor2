export interface AuthSessionUser {
  id: string;
  email?: string;
  name?: string;
  image?: string;
  githubId?: string;
}

export interface AuthSession {
  user: AuthSessionUser;
  expiresAt: string;
}

export interface AuthState {
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  session: AuthSession | null;
}
