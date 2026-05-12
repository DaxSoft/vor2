export declare const ROUTES: {
    readonly AUTH: "/auth";
    readonly ONBOARDING: "/onboarding";
    readonly APP: "/app";
    readonly SETTINGS: "/settings";
    readonly SETTINGS_CONNECTIONS: "/settings/connections";
};
export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
