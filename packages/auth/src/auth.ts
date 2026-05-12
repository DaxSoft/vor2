import { betterAuth } from "better-auth";

export interface BetterAuthEnvironment {
  baseUrl: string;
  authSecret: string;
}

export function createDesktopBetterAuth(env: BetterAuthEnvironment) {
  return betterAuth({
    baseURL: env.baseUrl,
    secret: env.authSecret,
    emailAndPassword: {
      enabled: true
    }
  });
}
