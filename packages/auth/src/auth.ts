import { betterAuth } from "better-auth";

export interface BetterAuthEnvironment {
  baseUrl: string;
  githubClientId: string;
  githubClientSecret: string;
}

export function createDesktopBetterAuth(env: BetterAuthEnvironment) {
  return betterAuth({
    baseURL: env.baseUrl,
    secret: env.githubClientSecret,
    socialProviders: {
      github: {
        clientId: env.githubClientId,
        clientSecret: env.githubClientSecret
      }
    }
  });
}
