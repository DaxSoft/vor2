import { LoadingIndicator } from "./LoadingIndicator";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center app-background">
      <LoadingIndicator text="Loading vor2..." />
    </div>
  );
}
