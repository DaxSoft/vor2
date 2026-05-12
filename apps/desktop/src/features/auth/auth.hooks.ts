import { useEffect } from "react";
import { useAuthStore } from "./auth.store";

export function useHydrateAuth() {
  const hydrate = useAuthStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
}
