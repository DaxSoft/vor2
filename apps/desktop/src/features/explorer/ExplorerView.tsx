import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Download,
  FolderPlus,
  PencilLine,
  RefreshCw,
  Share2,
  Trash2,
  UploadCloud
} from "lucide-react";
import { buildPublicUrl } from "@r2-explorer/r2/src/path-utils";
import { Breadcrumb } from "./Breadcrumb";
import { DetailsPanel } from "./DetailsPanel";
import { ExplorerTable } from "./ExplorerTable";
import { explorerService } from "./explorer.service";
import { useExplorerStore } from "./explorer.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import { formatBytes } from "@/lib/format";
import type { R2ExplorerNode } from "./explorer.types";

interface ExplorerViewProps {
  onUpload: () => void;
  onNewFolder: () => void;
}

interface NodeContextMenuState {
  x: number;
  y: number;
  node: R2ExplorerNode;
}

interface BackgroundContextMenuState {
  x: number;
  y: number;
}

export function ExplorerView({ onUpload, onNewFolder }: ExplorerViewProps) {
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
  const renameNode = useExplorerStore((state) => state.renameNode);
  const goParent = useExplorerStore((state) => state.goParent);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const connections = useConnectionStore((state) => state.items);
  const [nodeMenu, setNodeMenu] = useState<NodeContextMenuState | null>(null);
  const [backgroundMenu, setBackgroundMenu] = useState<BackgroundContextMenuState | null>(null);
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

  const closeMenus = () => {
    setNodeMenu(null);
    setBackgroundMenu(null);
  };

  useEffect(() => {
    const onClick = () => closeMenus();
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

  const buildRenamedKey = (node: R2ExplorerNode, nextName: string): string => {
    if (node.kind === "folder") {
      const trimmed = node.key.replace(/\/$/, "");
      const parts = trimmed.split("/");
      parts.pop();
      const parent = parts.join("/");
      return `${parent ? `${parent}/` : ""}${nextName}/`;
    }
    const parts = node.key.split("/");
    parts.pop();
    const parent = parts.join("/");
    return `${parent ? `${parent}/` : ""}${nextName}`;
  };

  const rename = async (node: R2ExplorerNode) => {
    const currentName = node.name;
    const nextName = window.prompt("Rename to", currentName)?.trim();
    if (!nextName || nextName === currentName) {
      return;
    }
    const newKey = buildRenamedKey(node, nextName);
    await renameNode(node.key, newKey);
    setMessage("Renamed.");
  };

  const executeDelete = async () => {
    if (!confirmDelete) {
      return;
    }
    await deleteNode(confirmDelete.key);
    setConfirmDelete(null);
    setMessage(confirmDelete.kind === "folder" ? "Folder and subcontent deleted." : "File deleted.");
  };

  const runNodeAction = (action: (node: R2ExplorerNode) => Promise<void> | void) => {
    const menu = nodeMenu;
    closeMenus();
    if (!menu) {
      return;
    }
    void action(menu.node);
  };

  const runBackgroundAction = (action: () => Promise<void> | void) => {
    closeMenus();
    void action();
  };

  return (
    <div className="grid min-h-0 flex-1 gap-3 grid-cols-[1fr_320px]">
      <section
        className="glass-panel flex min-h-0 flex-col rounded-panel border border-app-border/45 p-3"
        onContextMenu={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("tbody tr")) {
            return;
          }
          event.preventDefault();
          setBackgroundMenu({ x: event.clientX, y: event.clientY });
          setNodeMenu(null);
        }}
      >
        <div className="mb-3 flex items-center gap-2 border-b border-app-border/45 pb-2">
          <button
            type="button"
            className="rounded-md border border-app-border/45 bg-white/[0.04] p-1 text-app-muted hover:text-app-text"
            onClick={() => {
              void goParent();
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
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
                setNodeMenu({ x: event.clientX, y: event.clientY, node });
                setBackgroundMenu(null);
              }}
            />
          ) : null}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-app-border/45 pt-2 text-[11px] text-app-soft">
          <span>{visibleNodes.length} items</span>
          <span>{selectedFile ? `1 selected (${formatBytes(selectedFile.sizeBytes)})` : "0 selected"}</span>
        </div>
        {message ? <p className="mt-1 text-[11px] text-app-soft">{message}</p> : null}
      </section>

      <aside className="glass-panel rounded-panel border border-app-border/45 p-3">
        {selectedFile ? (
          <DetailsPanel
            node={selectedFile}
            onDelete={async () => {
              setConfirmDelete(selectedFile);
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-app-muted">
            Select a file to view details
          </div>
        )}
      </aside>

      {nodeMenu ? (
        <div
          className="glass-shell fixed z-50 min-w-52 rounded-xl border border-white/20 p-1.5 text-xs shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
          style={{ left: nodeMenu.x, top: nodeMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {nodeMenu.node.kind === "file" ? (
            <>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(copyUrl)}>
                <Copy className="h-3.5 w-3.5 text-app-muted" />
                Copy URL
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(shareNode)}>
                <Share2 className="h-3.5 w-3.5 text-app-muted" />
                Share
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(downloadNode)}>
                <Download className="h-3.5 w-3.5 text-app-muted" />
                Download
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(rename)}>
                <PencilLine className="h-3.5 w-3.5 text-app-muted" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-200 hover:bg-rose-500/20"
                onClick={() => {
                  const node = nodeMenu.node;
                  closeMenus();
                  setConfirmDelete(node);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          ) : (
            <>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(downloadNode)}>
                <Download className="h-3.5 w-3.5 text-app-muted" />
                Download
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10" onClick={() => runNodeAction(rename)}>
                <PencilLine className="h-3.5 w-3.5 text-app-muted" />
                Rename
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-rose-200 hover:bg-rose-500/20"
                onClick={() => {
                  const node = nodeMenu.node;
                  closeMenus();
                  setConfirmDelete(node);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      ) : null}

      {backgroundMenu ? (
        <div
          className="glass-shell fixed z-50 min-w-44 rounded-xl border border-white/20 p-1.5 text-xs shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
          style={{ left: backgroundMenu.x, top: backgroundMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
            onClick={() => runBackgroundAction(async () => loadPath(currentPath))}
          >
            <RefreshCw className="h-3.5 w-3.5 text-app-muted" />
            Refresh
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
            onClick={() => runBackgroundAction(onUpload)}
          >
            <UploadCloud className="h-3.5 w-3.5 text-app-muted" />
            Upload
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
            onClick={() => runBackgroundAction(onNewFolder)}
          >
            <FolderPlus className="h-3.5 w-3.5 text-app-muted" />
            New folder
          </button>
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
              <button className="rounded border border-app-border/45 px-3 py-1.5 text-xs" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button
                className="rounded border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs text-rose-200"
                onClick={() => void executeDelete()}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
