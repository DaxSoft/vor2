import { createAuthClient } from "@r2-explorer/auth/src/auth-client";

const client = createAuthClient();

export const authService = {
  async getSession() {
    return client.getSession();
  },
  async signInWithPassword(username: string, password: string) {
    return client.signInWithPassword({ username, password });
  },
  async signUpWithPassword(username: string, password: string) {
    return client.signUpWithPassword({ username, password });
  },
  async signOut() {
    return client.signOut();
  }
};
