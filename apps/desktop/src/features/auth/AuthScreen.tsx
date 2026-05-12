import { Cloud } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "./auth.store";

export function AuthScreen() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const signInWithPassword = useAuthStore((state) => state.signInWithPassword);
  const signUpWithPassword = useAuthStore((state) => state.signUpWithPassword);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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

        <div className="space-y-3">
          <label className="block text-xs text-app-muted">
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="blue-focus mt-1 block w-full rounded-lg border border-app-border bg-white/5 px-3 py-2 text-sm text-app-text"
              placeholder="username"
              autoComplete="username"
            />
          </label>
          <label className="block text-xs text-app-muted">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="blue-focus mt-1 block w-full rounded-lg border border-app-border bg-white/5 px-3 py-2 text-sm text-app-text"
              placeholder="password"
              autoComplete="current-password"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            aria-label="Sign in"
            onClick={() => {
              void signInWithPassword(username.trim(), password);
            }}
            className="blue-focus rounded-xl border border-white/15 bg-accent-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-accent disabled:opacity-70"
            disabled={isLoading || !username.trim() || !password}
          >
            Sign In
          </button>
          <button
            type="button"
            aria-label="Create account"
            onClick={() => {
              void signUpWithPassword(username.trim(), password);
            }}
            className="blue-focus rounded-xl border border-app-border bg-white/10 px-4 py-3 text-sm font-semibold text-app-text transition hover:bg-white/15 disabled:opacity-70"
            disabled={isLoading || !username.trim() || !password}
          >
            Create Account
          </button>
        </div>

        <p className="mt-4 text-xs text-app-soft">
          Your R2 credentials are encrypted locally and unlocked only after sign-in.
        </p>

        {error ? <p className="mt-3 text-xs text-rose-300">{error}</p> : null}
      </div>
    </div>
  );
}
