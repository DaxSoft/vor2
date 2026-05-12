import { invoke } from "@tauri-apps/api/core";
import type { AuthSession } from "./session";

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface AuthClient {
  getSession: () => Promise<AuthSession | null>;
  signInWithPassword: (credentials: AuthCredentials) => Promise<AuthSession>;
  signUpWithPassword: (credentials: AuthCredentials) => Promise<AuthSession>;
  signOut: () => Promise<void>;
}

interface NativeAuthSessionResponse {
  user: {
    id: string;
    username: string;
  };
  expiresAt: string;
}

function mapSession(value: NativeAuthSessionResponse): AuthSession {
  return {
    user: {
      id: value.user.id,
      username: value.user.username
    },
    expiresAt: value.expiresAt
  };
}

export function createAuthClient(): AuthClient {
  return {
    async getSession() {
      const session = await invoke<NativeAuthSessionResponse | null>("get_session");
      return session ? mapSession(session) : null;
    },

    async signInWithPassword(credentials) {
      const session = await invoke<NativeAuthSessionResponse>("sign_in_with_password", {
        username: credentials.username,
        password: credentials.password
      });
      return mapSession(session);
    },

    async signUpWithPassword(credentials) {
      const session = await invoke<NativeAuthSessionResponse>("sign_up_with_password", {
        username: credentials.username,
        password: credentials.password
      });
      return mapSession(session);
    },

    async signOut() {
      await invoke("clear_session");
    }
  };
}
