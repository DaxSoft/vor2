import type { ReactNode } from "react";
import { ToastLayer } from "@/components/feedback/ToastLayer";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ToastLayer />
    </>
  );
}
