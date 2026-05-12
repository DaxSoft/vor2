import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { AppProviders } from "./providers";
import { AppRoutes } from "./routes";
import { useHydrateAuth } from "@/features/auth/auth.hooks";
import { useAuthStore } from "@/features/auth/auth.store";

export function App() {
  useHydrateAuth();
  const isLoading = useAuthStore((state) => state.isLoading);

  return <AppProviders>{isLoading ? <LoadingScreen /> : <AppRoutes />}</AppProviders>;
}
