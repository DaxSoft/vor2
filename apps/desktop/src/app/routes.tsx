import { useEffect } from "react";
import { ROUTES, type AppRoute } from "@/lib/constants";
import { AuthScreen } from "@/features/auth/AuthScreen";
import { ConnectionForm } from "@/features/connections/ConnectionForm";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsView } from "@/features/settings/SettingsView";
import { useAuthStore } from "@/features/auth/auth.store";
import { useConnectionStore } from "@/features/connections/connection.store";

function resolveRoute(isAuthenticated: boolean, hasConnections: boolean): AppRoute {
  if (!isAuthenticated) {
    return ROUTES.AUTH;
  }
  if (!hasConnections) {
    return ROUTES.ONBOARDING;
  }
  return ROUTES.APP;
}

export function AppRoutes() {
  const session = useAuthStore((state) => state.session);
  const items = useConnectionStore((state) => state.items);
  const hydrateConnections = useConnectionStore((state) => state.hydrate);

  useEffect(() => {
    if (session) {
      void hydrateConnections();
    }
  }, [hydrateConnections, session]);

  const route = resolveRoute(Boolean(session), items.length > 0);

  if (route === ROUTES.AUTH) {
    return <AuthScreen />;
  }

  if (route === ROUTES.ONBOARDING) {
    return (
      <div className="flex h-screen w-screen items-center justify-center app-background px-6">
        <div className="glass-shell w-full max-w-xl rounded-app p-6">
          <ConnectionForm onCreated={() => undefined} />
        </div>
      </div>
    );
  }

  if (route === ROUTES.SETTINGS || route === ROUTES.SETTINGS_CONNECTIONS) {
    return (
      <div className="p-4">
        <SettingsView onClose={() => undefined} />
      </div>
    );
  }

  return <AppShell />;
}
