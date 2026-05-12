import { Cloud } from "lucide-react";
import { useAuthStore } from "./auth.store";

export function AuthScreen() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const signInWithGithub = useAuthStore((state) => state.signInWithGithub);

  return (
    <div className="flex h-screen w-screen items-center justify-center app-background px-6">
      <div className="glass-shell w-full max-w-lg rounded-app p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Cloud className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-sm font-semibold text-app-text">R2 Explorer</h1>
            <p className="text-xs text-app-muted">Your Cloudflare R2 files, one click away.</p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Continue with GitHub"
          onClick={() => {
            void signInWithGithub();
          }}
          className="blue-focus w-full rounded-xl border border-white/15 bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent"
          disabled={isLoading}
        >
          Continue with GitHub
        </button>

        <p className="mt-4 text-xs text-app-soft">
          Your R2 credentials are encrypted locally and unlocked only after sign-in.
        </p>

        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
