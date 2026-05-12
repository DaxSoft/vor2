import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useHydrateAuth } from "@/features/auth/auth.hooks";
import { useAuthStore } from "@/features/auth/auth.store";
import { isDesktopRuntime } from "@/lib/desktop-window";

export function App() {
  useHydrateAuth();
  const isLoading = useAuthStore((state) => state.isLoading);

  if (!isDesktopRuntime()) {
    return (
      <div className="flex h-screen w-screen items-center justify-center app-background px-6">
        <div className="glass-shell w-full max-w-xl rounded-app p-6 text-sm text-app-text">
          This project is a desktop app. Run it with <code>yarn dev</code> to launch Tauri.
        </div>
      </div>
    );
  }

  return <AppProviders>{isLoading ? <LoadingScreen /> : <AppRoutes />}</AppProviders>;
}
