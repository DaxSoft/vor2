import { createAuthClient } from "@r2-explorer/auth/src/auth-client";

const authBaseUrl = "http://localhost:3478";
const client = createAuthClient(authBaseUrl);

export const authService = {
  async getSession() {
    return client.getSession();
  },
  async signInWithGithub() {
    return client.signInWithGithub();
  },
  async signOut() {
    return client.signOut();
  }
};
