import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { useAuthStore } from "@/features/auth/auth.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import { useUiStore } from "./settings.store";

interface SyncFolder {
  id: string;
  connectionId: string;
  localPath: string;
  targetPrefix: string;
}

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
  const connections = useConnectionStore((state) => state.items);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const [syncFolders, setSyncFolders] = useState<SyncFolder[]>([]);
  const [targetPrefix, setTargetPrefix] = useState("");

  const loadSyncFolders = async () => {
    const folders = await invoke<SyncFolder[]>("list_sync_folders");
    setSyncFolders(folders);
  };

  useEffect(() => {
    void hydrate();
    void loadSyncFolders();
  }, [hydrate]);

  const activeConnection = connections.find((item) => item.id === activeConnectionId) ?? connections[0] ?? null;

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

      <div className="mt-4 rounded border border-app-border bg-white/5 p-3">
        <h3 className="text-xs font-semibold text-app-text">Sync folders</h3>
        <p className="mt-1 text-[11px] text-app-soft">
          Local changes upload to the selected connection while vor2 is running. Removed local files are not deleted from storage.
        </p>
        <label className="mt-3 block text-[11px] text-app-muted">
          Target prefix
          <input
            className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.04] px-2 py-1.5 text-xs text-app-text"
            value={targetPrefix}
            onChange={(event) => setTargetPrefix(event.target.value)}
            placeholder="optional/folder"
          />
        </label>
        <button
          type="button"
          className="mt-2 w-full rounded border border-app-border px-3 py-2 text-xs text-app-text hover:border-accent"
          onClick={async () => {
            if (!activeConnection) {
              return;
            }
            const localPath = await invoke<string | null>("open_folder_dialog");
            if (!localPath) {
              return;
            }
            await invoke("add_sync_folder", {
              connectionId: activeConnection.id,
              localPath,
              targetPrefix
            });
            setTargetPrefix("");
            await loadSyncFolders();
          }}
        >
          Add sync folder for {activeConnection?.name ?? "connection"}
        </button>
        <div className="mt-2 max-h-28 space-y-1 overflow-auto">
          {syncFolders.map((folder) => (
            <div key={folder.id} className="flex items-center justify-between gap-2 rounded border border-app-border/20 px-2 py-1.5">
              <div className="min-w-0">
                <p className="truncate text-[11px] text-app-text">{folder.localPath}</p>
                <p className="truncate text-[10px] text-app-soft">{folder.targetPrefix || "/"}</p>
              </div>
              <button
                type="button"
                className="shrink-0 rounded border border-rose-400/40 px-2 py-1 text-[10px] text-rose-200"
                onClick={async () => {
                  await invoke("remove_sync_folder", { syncFolderId: folder.id });
                  await loadSyncFolders();
                }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

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
