export const ROUTES = {
  AUTH: "/auth",
  ONBOARDING: "/onboarding",
  APP: "/app",
  SETTINGS: "/settings",
  SETTINGS_CONNECTIONS: "/settings/connections"
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
