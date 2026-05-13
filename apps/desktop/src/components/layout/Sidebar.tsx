import { Database, Folder, FolderPlus, HardDrive, Plus, Settings } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useConnectionStore } from "@/features/connections/connection.store";
import { connectionService } from "@/features/connections/connection.service";
import { useExplorerStore } from "@/features/explorer/explorer.store";
import { formatBytes } from "@/lib/format";

export function Sidebar({
  onAddConnection,
  onOpenSettings
}: {
  onAddConnection: () => void;
  onOpenSettings: () => void;
}) {
  const connections = useConnectionStore((state) => state.items);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const setActiveConnection = useConnectionStore((state) => state.setActiveConnection);
  const nodes = useExplorerStore((state) => state.nodes);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const [usage, setUsage] = useState<{ objectCount: number; totalSizeBytes: number; source?: string } | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);

  const folderNodes = useMemo(
    () => nodes.filter((node) => node.kind === "folder").sort((a, b) => a.name.localeCompare(b.name)),
    [nodes]
  );

  const pathParts = useMemo(
    () => currentPath.replace(/^\//, "").split("/").filter(Boolean),
    [currentPath]
  );

  useEffect(() => {
    const active = connections.find((connection) => connection.id === activeConnectionId);
    if (!activeConnectionId || !active) {
      setUsage(null);
      return;
    }
    setUsageLoading(true);
    void connectionService
      .getBucketUsage(activeConnectionId, active.bucketName)
      .then((value) => {
        setUsage(value);
      })
      .catch(() => {
        setUsage(null);
      })
      .finally(() => {
        setUsageLoading(false);
      });
  }, [activeConnectionId, connections]);

  return (
    <aside className="glass-panel grid min-h-0 grid-cols-[36px_1fr] gap-3 rounded-panel border border-app-border/45 p-3">
      <div className="flex flex-col items-center justify-between">
        <div className="space-y-2">
          <button type="button" className="rounded-lg border border-app-border/45 bg-white/[0.04] p-2 text-app-muted hover:text-app-text">
            <HardDrive className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg border border-app-border/45 bg-white/[0.04] p-2 text-app-muted hover:text-app-text"
            onClick={onAddConnection}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          className="rounded-lg border border-app-border/45 bg-white/[0.04] p-2 text-app-muted hover:text-app-text"
          onClick={onOpenSettings}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-col">
        <div className="rounded-xl border border-app-border/45 bg-white/[0.04] p-2">
          <div className="mb-2 rounded-lg border border-app-border/45 bg-white/[0.03] px-2 py-2 text-xs text-app-muted">
            All Buckets
          </div>
          <div className="space-y-1.5">
            {connections.map((connection) => (
              <button
                key={connection.id}
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-sm ${
                  connection.id === activeConnectionId
                    ? "border-accent/60 bg-accent-soft text-app-text"
                    : "border-white/5 bg-white/[0.02] text-app-muted hover:bg-white/[0.05]"
                }`}
                onClick={() => setActiveConnection(connection.id)}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span className="truncate">{connection.bucketName}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-xl border border-app-border/45 bg-white/[0.03] p-2">
          <div className="mb-2 flex items-center justify-between text-xs text-app-muted">
            <span>Folders</span>
            <button
              type="button"
              className="rounded-md border border-app-border/45 p-1 hover:text-app-text"
              onClick={() => {
                void loadPath(currentPath);
              }}
            >
              <FolderPlus className="h-3 w-3" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-1 overflow-auto pr-1">
            <button
              type="button"
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs ${
                currentPath === "/" ? "bg-accent-soft text-app-text" : "text-app-muted hover:bg-white/[0.06]"
              }`}
              onClick={() => {
                void loadPath("/");
              }}
            >
              <Folder className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">/</span>
            </button>
            {pathParts.map((part, index) => {
              const path = `/${pathParts.slice(0, index + 1).join("/")}`;
              return (
                <button
                  key={path}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs ${
                    currentPath === path ? "bg-accent-soft text-app-text" : "text-app-muted hover:bg-white/[0.06]"
                  }`}
                  style={{ paddingLeft: `${8 + index * 10}px` }}
                  onClick={() => {
                    void loadPath(path);
                  }}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{part}</span>
                </button>
              );
            })}
            {folderNodes.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-app-muted hover:bg-white/[0.06]"
                onClick={() => {
                  void loadPath(`/${folder.key.replace(/\/$/, "")}`);
                }}
              >
                <Folder className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-app-border/45 bg-white/[0.03] p-3">
          <p className="text-xs text-app-muted">Storage Usage</p>
          {usageLoading ? (
            <p className="mt-2 text-xs text-app-soft">Loading...</p>
          ) : usage ? (
            <>
              <p className="mt-2 text-xs text-app-text">{formatBytes(usage.totalSizeBytes)}</p>
              <p className="mt-1 text-[11px] text-app-soft">{usage.objectCount} objects</p>
              <p className="mt-2 text-[10px] text-app-soft">
                {usage.source === "graphql" ? "Cloudflare GraphQL metrics" : "Live bucket scan (R2 API)"}
              </p>
            </>
          ) : (
            <p className="mt-2 text-xs text-app-soft">Could not load usage.</p>
          )}
        </div>
      </div>
    </aside>
  );
}
