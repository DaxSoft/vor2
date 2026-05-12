import { useEffect, useMemo, useState } from "react";
import { buildPublicUrl } from "@r2-explorer/r2/src/path-utils";
import { Breadcrumb } from "./Breadcrumb";
import { DetailsPanel } from "./DetailsPanel";
import { ExplorerTable } from "./ExplorerTable";
import { explorerService } from "./explorer.service";
import { useExplorerStore } from "./explorer.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import type { R2ExplorerNode } from "./explorer.types";

export function ExplorerView() {
  const nodes = useExplorerStore((state) => state.nodes);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const selectedNodeId = useExplorerStore((state) => state.selectedNodeId);
  const isLoading = useExplorerStore((state) => state.isLoading);
  const error = useExplorerStore((state) => state.error);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const deleteNode = useExplorerStore((state) => state.deleteNode);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const openNode = useExplorerStore((state) => state.openNode);
  const selectNode = useExplorerStore((state) => state.selectNode);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const connections = useConnectionStore((state) => state.items);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: R2ExplorerNode } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<R2ExplorerNode | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return nodes;
    }
    return nodes.filter((node) => node.name.toLowerCase().includes(query) || node.key.toLowerCase().includes(query));
  }, [nodes, searchQuery]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId),
    [visibleNodes, selectedNodeId]
  );
  const selectedFile = selectedNode?.kind === "file" ? selectedNode : null;
  const activeConnection = connections.find((item) => item.id === activeConnectionId) ?? null;

  useEffect(() => {
    const onClick = () => setContextMenu(null);
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const copyUrl = async (node: R2ExplorerNode) => {
    if (node.kind !== "file" || !node.publicUrl) {
      setMessage("No public URL configured for this file.");
      return;
    }
    await navigator.clipboard.writeText(node.publicUrl);
    setMessage("URL copied.");
  };

  const shareNode = async (node: R2ExplorerNode) => {
    if (node.kind !== "file" || !node.publicUrl) {
      setMessage("No public URL configured for this file.");
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: node.name, url: node.publicUrl });
      return;
    }
    await navigator.clipboard.writeText(node.publicUrl);
    setMessage("Share not supported. URL copied.");
  };

  const downloadNode = async (node: R2ExplorerNode) => {
    if (!activeConnectionId || !activeConnection) {
      return;
    }
    if (node.kind === "file") {
      if (!node.publicUrl) {
        setMessage("No public URL configured for this file.");
        return;
      }
      window.open(node.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!activeConnection.publicUrl) {
      setMessage("No public URL configured for this connection.");
      return;
    }
    const keys = await explorerService.listPrefixObjects(activeConnectionId, activeConnection.bucketName, node.key);
    for (const key of keys) {
      const url = buildPublicUrl(activeConnection.publicUrl, key);
      if (!url) {
        continue;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setMessage(keys.length === 0 ? "Folder is empty." : `Opened ${keys.length} file download(s).`);
  };

  const executeDelete = async () => {
    if (!confirmDelete) {
      return;
    }
    await deleteNode(confirmDelete.key);
    setConfirmDelete(null);
    setMessage(confirmDelete.kind === "folder" ? "Folder and subcontent deleted." : "File deleted.");
  };

  return (
    <div className={`grid min-h-0 flex-1 gap-3 ${selectedFile ? "grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
      <section className="glass-panel flex min-h-0 flex-col rounded-panel border border-app-border p-3">
        <div className="mb-3">
          <Breadcrumb currentPath={currentPath} onOpen={(path) => void loadPath(path)} />
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? <p className="text-xs text-app-muted">Loading...</p> : null}
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          {!isLoading && !error ? (
            <ExplorerTable
              nodes={visibleNodes}
              selectedNodeId={selectedNodeId}
              onSelect={selectNode}
              onOpen={(id) => void openNode(id)}
              onContextMenu={(event, node) => {
                event.preventDefault();
                setContextMenu({ x: event.clientX, y: event.clientY, node });
              }}
            />
          ) : null}
        </div>
        {message ? <p className="mt-2 text-[11px] text-app-soft">{message}</p> : null}
      </section>

      {selectedFile ? (
        <aside className="glass-panel rounded-panel border border-app-border p-3">
          <DetailsPanel
            node={selectedFile}
            onDelete={async (_key) => {
              setConfirmDelete(selectedFile);
            }}
          />
        </aside>
      ) : null}

      {contextMenu ? (
        <div
          className="glass-panel fixed z-50 min-w-44 rounded-lg border border-app-border p-1 text-xs"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {contextMenu.node.kind === "file" ? (
            <>
              <button className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => void copyUrl(contextMenu.node)}>Copy URL</button>
              <button className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => void shareNode(contextMenu.node)}>Share</button>
              <button className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => void downloadNode(contextMenu.node)}>Download</button>
              <button
                className="block w-full rounded px-2 py-1 text-left text-rose-300 hover:bg-rose-500/20"
                onClick={() => {
                  setConfirmDelete(contextMenu.node);
                  setContextMenu(null);
                }}
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => void downloadNode(contextMenu.node)}>Download</button>
              <button
                className="block w-full rounded px-2 py-1 text-left text-rose-300 hover:bg-rose-500/20"
                onClick={() => {
                  setConfirmDelete(contextMenu.node);
                  setContextMenu(null);
                }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}

      {confirmDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="glass-shell w-full max-w-md rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">Confirm delete</h3>
            <p className="mt-2 text-xs text-app-muted break-all">
              {confirmDelete.kind === "folder"
                ? "Delete this folder and all files/subfolders inside?"
                : "Delete this file?"}
            </p>
            <p className="mt-1 text-[11px] text-app-soft break-all">{confirmDelete.key}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border border-app-border px-3 py-1.5 text-xs" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="rounded border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs text-rose-200" onClick={() => void executeDelete()}>
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
