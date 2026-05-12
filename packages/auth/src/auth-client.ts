import type { AuthSession } from "./session";

export interface AuthClient {
  getSession: () => Promise<AuthSession | null>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function createAuthClient(baseUrl: string): AuthClient {
  return {
    async getSession() {
      const response = await fetch(`${baseUrl}/api/auth/session`, { credentials: "include" });
      if (!response.ok) {
        return null;
      }
      const body = (await response.json()) as { session?: AuthSession };
      return body.session ?? null;
    },

    async signInWithGithub() {
      const response = await fetch(`${baseUrl}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "github" }),
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("GitHub sign-in failed.");
      }

      const data = (await response.json()) as { url?: string };
      const oauthUrl = data.url;
      if (!oauthUrl) {
        throw new Error("GitHub sign-in failed.");
      }
      await import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(oauthUrl));
    },

    async signOut() {
      await fetch(`${baseUrl}/api/auth/sign-out`, { method: "POST", credentials: "include" });
    }
  };
}
