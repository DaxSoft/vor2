import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useUiStore } from "./settings.store";

export function SettingsView({ onClose }: { onClose: () => void }) {
  const hydrate = useUiStore((state) => state.hydrate);
  const updateSettings = useUiStore((state) => state.updateSettings);
  const startMinimizedToTray = useUiStore((state) => state.startMinimizedToTray);
  const closeToTray = useUiStore((state) => state.closeToTray);
  const launchAtStartup = useUiStore((state) => state.launchAtStartup);
  const isLoading = useUiStore((state) => state.isLoading);
  const error = useUiStore((state) => state.error);
  const signOut = useAuthStore((state) => state.signOut);
  const deleteAccount = useAuthStore((state) => state.deleteAccount);
  const authSession = useAuthStore((state) => state.session);
  const authError = useAuthStore((state) => state.error);
  const authLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <div className="glass-panel w-full max-w-md rounded-panel border border-app-border p-4 text-xs text-app-muted">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-app-text">Settings</h2>
        <button type="button" className="rounded border border-app-border px-2 py-1 text-xs hover:border-accent" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="space-y-2">
        <label className="flex items-center justify-between gap-3 rounded border border-app-border bg-white/5 px-3 py-2">
          <span>Start minimized to tray</span>
          <input
            type="checkbox"
            checked={startMinimizedToTray}
            onChange={(event) => {
              void updateSettings({ startMinimizedToTray: event.target.checked });
            }}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded border border-app-border bg-white/5 px-3 py-2">
          <span>Close to tray</span>
          <input
            type="checkbox"
            checked={closeToTray}
            onChange={(event) => {
              void updateSettings({ closeToTray: event.target.checked });
            }}
          />
        </label>

        <label className="flex items-center justify-between gap-3 rounded border border-app-border bg-white/5 px-3 py-2">
          <span>Launch at startup</span>
          <input
            type="checkbox"
            checked={launchAtStartup}
            onChange={(event) => {
              void updateSettings({ launchAtStartup: event.target.checked });
            }}
          />
        </label>
      </div>

      {isLoading ? <p className="mt-3 text-[11px] text-app-soft">Saving...</p> : null}
      {error ? <p className="mt-3 text-[11px] text-rose-300">{error}</p> : null}
      {authError ? <p className="mt-3 text-[11px] text-rose-300">{authError}</p> : null}

      <button
        type="button"
        className="mt-4 w-full rounded border border-app-border px-3 py-2 text-xs text-app-text hover:border-accent"
        onClick={() => {
          void signOut();
        }}
      >
        Sign out
      </button>

      <button
        type="button"
        disabled={authLoading}
        className="mt-2 w-full rounded border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 hover:border-rose-300 disabled:opacity-60"
        onClick={() => {
          const username = authSession?.user.username ?? "this account";
          const ok = window.confirm(
            `Delete ${username}? This will permanently remove your user account, all saved R2 connections, and upload history on this device.`
          );
          if (!ok) {
            return;
          }
          void deleteAccount().then(() => {
            onClose();
          });
        }}
      >
        Delete account
      </button>
    </div>
  );
}
