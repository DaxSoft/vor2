import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  Copy,
  Download,
  Folder,
  FolderPlus,
  Filter,
  Link2,
  MoveRight,
  PencilLine,
  RefreshCw,
  Share2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { buildPublicUrl } from "@vor2/r2/src/path-utils";
import { Breadcrumb } from "./Breadcrumb";
import { DetailsPanel } from "./DetailsPanel";
import { ExplorerTable } from "./ExplorerTable";
import { explorerService } from "./explorer.service";
import { useExplorerStore } from "./explorer.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import { formatBytes } from "@/lib/format";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
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

const TTL_PRESETS_MINUTES = [1, 5, 15, 30, 60, 720, 1440];

export function ExplorerView({ onUpload, onNewFolder }: ExplorerViewProps) {
  const nodes = useExplorerStore((state) => state.nodes);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const selectedNodeId = useExplorerStore((state) => state.selectedNodeId);
  const selectedNodeIds = useExplorerStore((state) => state.selectedNodeIds);
  const isLoading = useExplorerStore((state) => state.isLoading);
  const error = useExplorerStore((state) => state.error);
  const searchQuery = useExplorerStore((state) => state.searchQuery);
  const deleteNode = useExplorerStore((state) => state.deleteNode);
  const deleteNodes = useExplorerStore((state) => state.deleteNodes);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const openNode = useExplorerStore((state) => state.openNode);
  const selectNode = useExplorerStore((state) => state.selectNode);
  const toggleNodeSelection = useExplorerStore(
    (state) => state.toggleNodeSelection,
  );
  const selectAllNodes = useExplorerStore((state) => state.selectAllNodes);
  const clearSelection = useExplorerStore((state) => state.clearSelection);
  const renameNode = useExplorerStore((state) => state.renameNode);
  const moveNode = useExplorerStore((state) => state.moveNode);
  const goParent = useExplorerStore((state) => state.goParent);
  const setPresignedUrl = useExplorerStore((state) => state.setPresignedUrl);
  const activeConnectionId = useConnectionStore(
    (state) => state.activeConnectionId,
  );
  const connections = useConnectionStore((state) => state.items);
  const [nodeMenu, setNodeMenu] = useState<NodeContextMenuState | null>(null);
  const [backgroundMenu, setBackgroundMenu] =
    useState<BackgroundContextMenuState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<R2ExplorerNode | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [expiringDialogNode, setExpiringDialogNode] =
    useState<R2ExplorerNode | null>(null);
  const [expiringMinutes, setExpiringMinutes] = useState("15");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveDestination, setMoveDestination] = useState("");
  const [isMovingSelected, setIsMovingSelected] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameBaseName, setRenameBaseName] = useState("");
  const [isRenamingSelected, setIsRenamingSelected] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedResults, setAdvancedResults] = useState<
    R2ExplorerNode[] | null
  >(null);
  const [advancedSearch, setAdvancedSearch] = useState({
    pattern: "",
    useRegex: false,
    scope: "current" as "current" | "anywhere",
    sizeMode: "any" as "any" | "less" | "more",
    sizeMb: "0",
    period: "all",
    fromDate: "",
    toDate: "",
    quickFilter: "all",
  });

  const visibleNodes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const source = advancedResults ?? nodes;
    if (!query) {
      return source;
    }
    return source.filter(
      (node) =>
        node.name.toLowerCase().includes(query) ||
        node.key.toLowerCase().includes(query),
    );
  }, [advancedResults, nodes, searchQuery]);

  const selectedNode = useMemo(
    () => visibleNodes.find((node) => node.id === selectedNodeId),
    [visibleNodes, selectedNodeId],
  );
  const selectedFile = selectedNode?.kind === "file" ? selectedNode : null;
  const selectedNodes = useMemo(
    () => visibleNodes.filter((node) => selectedNodeIds.includes(node.id)),
    [selectedNodeIds, visibleNodes],
  );
  const activeConnection =
    connections.find((item) => item.id === activeConnectionId) ?? null;
  const moveFolderOptions = useMemo(() => {
    const selectedKeys = new Set(selectedNodes.map((node) => node.key));
    const folders = visibleNodes
      .filter((node) => {
        if (node.kind !== "folder" || selectedKeys.has(node.key)) {
          return false;
        }
        return !selectedNodes.some(
          (selected) =>
            selected.kind === "folder" && node.key.startsWith(selected.key),
        );
      })
      .map((node) => ({
        key: node.key.replace(/\/$/, ""),
        label: `/${node.key.replace(/\/$/, "")}`,
      }));
    return [{ key: "", label: "/" }, ...folders];
  }, [selectedNodes, visibleNodes]);

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

  const copyExpiringUrl = async (node: R2ExplorerNode) => {
    if (node.kind !== "file") {
      return;
    }
    if (node.signedUrl) {
      await navigator.clipboard.writeText(node.signedUrl);
      setMessage("Expiring URL copied.");
      return;
    }
    setExpiringDialogNode(node);
    setExpiringMinutes("15");
  };

  const createExpiringLink = async (
    node: R2ExplorerNode,
    ttlMinutes: number,
  ) => {
    if (!activeConnectionId || !activeConnection || node.kind !== "file") {
      return;
    }
    const signed = await explorerService.createPresignedGetUrl(
      activeConnectionId,
      activeConnection.bucketName,
      node.key,
      Math.max(1, Math.floor(ttlMinutes)) * 60,
    );
    setPresignedUrl(node.key, signed);
    await navigator.clipboard.writeText(signed.url);
    setMessage("Expiring link created and copied.");
  };

  const shareNode = async (node: R2ExplorerNode) => {
    if (node.kind !== "file") {
      return;
    }
    const url = node.signedUrl ?? node.publicUrl;
    if (!url) {
      setMessage("No URL available. Create an expiring link first.");
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: node.name, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    setMessage("Share not supported. URL copied.");
  };

  const downloadNode = async (node: R2ExplorerNode) => {
    if (!activeConnectionId || !activeConnection) {
      return;
    }

    if (node.kind === "file") {
      let downloadUrl = node.signedUrl ?? node.publicUrl;
      if (!downloadUrl) {
        const signed = await explorerService.createPresignedGetUrl(
          activeConnectionId,
          activeConnection.bucketName,
          node.key,
          900,
        );
        setPresignedUrl(node.key, signed);
        downloadUrl = signed.url;
      }
      await openUrl(downloadUrl);
      setMessage("Download started.");
      return;
    }

    const keys = await explorerService.listPrefixObjects(
      activeConnectionId,
      activeConnection.bucketName,
      node.key,
    );
    for (const key of keys) {
      let url: string | undefined;
      if (activeConnection.publicUrl) {
        url = buildPublicUrl(activeConnection.publicUrl, key) ?? undefined;
      }
      if (!url) {
        const signed = await explorerService.createPresignedGetUrl(
          activeConnectionId,
          activeConnection.bucketName,
          key,
          900,
        );
        setPresignedUrl(key, signed);
        url = signed.url;
      }
      await openUrl(url);
    }
    setMessage(
      keys.length === 0
        ? "Folder is empty."
        : `Download started for ${keys.length} file(s).`,
    );
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

  const moveToFolder = async (node: R2ExplorerNode, folder: R2ExplorerNode) => {
    if (folder.kind !== "folder") {
      return;
    }
    const newKey = `${folder.key}${node.name}${node.kind === "folder" ? "/" : ""}`;
    const ok = window.confirm(`Move ${node.name} to ${folder.name}?`);
    if (!ok) {
      return;
    }
    await moveNode(node.key, newKey);
    setMessage("Moved.");
  };

  const openMoveDialog = () => {
    if (selectedNodes.length === 0) {
      return;
    }
    setMoveDestination(moveFolderOptions[0]?.key ?? "");
    setMoveDialogOpen(true);
  };

  const moveSelected = async () => {
    if (selectedNodes.length === 0 || isMovingSelected) {
      return;
    }
    const destination = moveDestination.replace(/^\/+|\/+$/g, "");
    const ok = window.confirm(
      `Move ${selectedNodes.length} item(s) to ${destination || "/"}?`,
    );
    if (!ok) {
      return;
    }
    setIsMovingSelected(true);
    try {
      for (const node of selectedNodes) {
        await moveNode(
          node.key,
          `${destination ? `${destination}/` : ""}${node.name}${node.kind === "folder" ? "/" : ""}`,
        );
      }
      clearSelection();
      setMoveDialogOpen(false);
      setMessage("Batch move completed.");
    } finally {
      setIsMovingSelected(false);
    }
  };

  const openRenameDialog = () => {
    if (selectedNodes.length === 0) {
      return;
    }
    setRenameBaseName("");
    setRenameDialogOpen(true);
  };

  const renameSelected = async () => {
    const baseName = renameBaseName.trim();
    if (selectedNodes.length === 0 || !baseName || isRenamingSelected) {
      return;
    }
    setIsRenamingSelected(true);
    try {
      for (const [index, node] of selectedNodes.entries()) {
        const extension =
          node.kind === "file" && node.name.includes(".")
            ? `.${node.name.split(".").pop()}`
            : "";
        await renameNode(
          node.key,
          buildRenamedKey(node, `${baseName}-${index + 1}${extension}`),
        );
      }
      clearSelection();
      setRenameDialogOpen(false);
      setMessage("Batch rename completed.");
    } finally {
      setIsRenamingSelected(false);
    }
  };

  const openDeleteDialog = () => {
    if (selectedNodes.length === 0) {
      return;
    }
    setDeleteDialogOpen(true);
  };

  const deleteSelected = async () => {
    if (selectedNodes.length === 0 || isDeletingSelected) {
      return;
    }
    setIsDeletingSelected(true);
    try {
      await deleteNodes(selectedNodes.map((node) => node.key));
      clearSelection();
      setDeleteDialogOpen(false);
      setMessage("Batch delete completed.");
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const runAdvancedSearch = async () => {
    if (!activeConnectionId || !activeConnection) {
      return;
    }
    const daysByPeriod: Record<string, number> = {
      recent: 1,
      last7: 7,
      last15: 15,
      last30: 30,
    };
    const days = daysByPeriod[advancedSearch.period];
    const fromDate = days
      ? new Date(Date.now() - days * 86400000).toISOString()
      : advancedSearch.fromDate || undefined;
    const toDate =
      advancedSearch.period === "custom"
        ? advancedSearch.toDate || undefined
        : undefined;
    const results = await explorerService.search(
      activeConnectionId,
      activeConnection.bucketName,
      {
        pattern: advancedSearch.pattern,
        useRegex: advancedSearch.useRegex,
        scope: advancedSearch.scope,
        path: currentPath,
        sizeMode: advancedSearch.sizeMode,
        sizeBytes:
          Math.max(0, Number(advancedSearch.sizeMb || 0)) * 1024 * 1024,
        fromDate,
        toDate,
        quickFilter: advancedSearch.quickFilter,
      },
      activeConnection.publicUrl,
    );
    setAdvancedResults(results);
    clearSelection();
    setAdvancedOpen(false);
  };

  const clearAdvancedSearch = () => {
    setAdvancedResults(null);
    setAdvancedSearch({
      pattern: "",
      useRegex: false,
      scope: "current",
      sizeMode: "any",
      sizeMb: "0",
      period: "all",
      fromDate: "",
      toDate: "",
      quickFilter: "all",
    });
  };

  const executeDelete = async () => {
    if (!confirmDelete) {
      return;
    }
    await deleteNode(confirmDelete.key);
    setConfirmDelete(null);
    setMessage(
      confirmDelete.kind === "folder"
        ? "Folder and subcontent deleted."
        : "File deleted.",
    );
  };

  const runNodeAction = (
    action: (node: R2ExplorerNode) => Promise<void> | void,
  ) => {
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
    <div className="grid h-full min-h-0 gap-3 grid-cols-[1fr_320px]">
      <section
        className="glass-panel flex min-h-0 flex-col rounded-panel border border-app-border/20 p-3"
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
        <div className="mb-3 flex items-center gap-2 border-b border-app-border/20 pb-2">
          <button
            type="button"
            className="rounded-md border border-app-border/20 bg-white/[0.04] p-1 text-app-muted hover:text-app-text"
            onClick={() => {
              void goParent();
            }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <Breadcrumb
            currentPath={currentPath}
            onOpen={(path) => void loadPath(path)}
          />
          <button
            type="button"
            className="ml-auto rounded-md border border-app-border/20 bg-white/[0.04] px-2 py-1 text-sm text-app-muted hover:text-app-text"
            onClick={() => setAdvancedOpen(true)}
          >
            <Filter className="mr-1 inline h-3.5 w-3.5" />
            Advanced
          </button>
          {advancedResults ? (
            <button
              type="button"
              className="rounded-md border border-app-border/20 bg-white/[0.04] px-2 py-1 text-sm text-app-muted hover:text-app-text"
              onClick={clearAdvancedSearch}
            >
              Clear
            </button>
          ) : null}
        </div>
        {selectedNodes.length > 0 ? (
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-2 text-sm text-app-muted">
            <span className="text-app-text">
              {selectedNodes.length} selected
            </span>
            <button
              className="rounded border border-app-border/20 px-2 py-1 hover:text-app-text"
              onClick={openMoveDialog}
            >
              <MoveRight className="mr-1 inline h-3.5 w-3.5" />
              Move
            </button>
            <button
              className="rounded border border-app-border/20 px-2 py-1 hover:text-app-text"
              onClick={openRenameDialog}
            >
              <PencilLine className="mr-1 inline h-3.5 w-3.5" />
              Rename
            </button>
            <button
              className="rounded border border-rose-500/40 px-2 py-1 text-rose-200"
              onClick={openDeleteDialog}
            >
              <Trash2 className="mr-1 inline h-3.5 w-3.5" />
              Delete
            </button>
            <button
              className="rounded border border-app-border/20 px-2 py-1 hover:text-app-text"
              onClick={clearSelection}
            >
              Cancel
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? <LoadingIndicator text="Loading files..." /> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {!isLoading && !error ? (
            <ExplorerTable
              nodes={visibleNodes}
              selectedNodeId={selectedNodeId}
              selectedNodeIds={selectedNodeIds}
              onSelect={selectNode}
              onToggleSelect={toggleNodeSelection}
              onSelectAll={selectAllNodes}
              onOpen={(id) => void openNode(id)}
              onMove={(node, folder) => void moveToFolder(node, folder)}
              onContextMenu={(event, node) => {
                event.preventDefault();
                setNodeMenu({ x: event.clientX, y: event.clientY, node });
                setBackgroundMenu(null);
              }}
            />
          ) : null}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-app-border/20 pt-2 text-sm text-app-soft">
          <span>{visibleNodes.length} items</span>
          <span>
            {selectedFile
              ? `1 selected (${formatBytes(selectedFile.sizeBytes)})`
              : "0 selected"}
          </span>
        </div>
        {message ? (
          <p className="mt-1 text-[11px] text-app-soft">{message}</p>
        ) : null}
      </section>

      <aside className="glass-panel rounded-panel border border-app-border/20 p-3">
        {selectedFile ? (
          <DetailsPanel
            node={selectedFile}
            onDelete={async (_key) => {
              setConfirmDelete(selectedFile);
            }}
            onDownload={async () => {
              await downloadNode(selectedFile);
            }}
            onCreateExpiringLink={async () => {
              setExpiringDialogNode(selectedFile);
              setExpiringMinutes("15");
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-app-muted">
            Select a file to view details
          </div>
        )}
      </aside>

      {nodeMenu ? (
        <div
          className="glass-shell fixed z-50 min-w-52 rounded-xl border border-white/20 p-1.5 text-sm shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
          style={{ left: nodeMenu.x, top: nodeMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          {nodeMenu.node.kind === "file" ? (
            <>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(copyUrl)}
              >
                <Copy className="h-3.5 w-3.5 text-app-muted" />
                Copy URL
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(shareNode)}
              >
                <Share2 className="h-3.5 w-3.5 text-app-muted" />
                Share
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(downloadNode)}
              >
                <Download className="h-3.5 w-3.5 text-app-muted" />
                Download
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() =>
                  runNodeAction((node) => {
                    setExpiringDialogNode(node);
                    setExpiringMinutes("15");
                  })
                }
              >
                <Link2 className="h-3.5 w-3.5 text-app-muted" />
                Create Expiring Link
              </button>
              {nodeMenu.node.signedUrl ? (
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                  onClick={() => runNodeAction(copyExpiringUrl)}
                >
                  <Copy className="h-3.5 w-3.5 text-app-muted" />
                  Copy Expiring URL
                </button>
              ) : null}
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(rename)}
              >
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
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(downloadNode)}
              >
                <Download className="h-3.5 w-3.5 text-app-muted" />
                Download
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
                onClick={() => runNodeAction(rename)}
              >
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
          className="glass-shell fixed z-50 min-w-44 rounded-xl border border-white/20 p-1.5 text-sm shadow-[0_14px_36px_rgba(0,0,0,0.45)]"
          style={{ left: backgroundMenu.x, top: backgroundMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-white/10"
            onClick={() =>
              runBackgroundAction(async () => loadPath(currentPath))
            }
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
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell w-full max-w-md rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Confirm delete
            </h3>
            <p className="mt-2 text-sm text-app-muted break-all">
              {confirmDelete.kind === "folder"
                ? "Delete this folder and all files/subfolders inside?"
                : "Delete this file?"}
            </p>
            <p className="mt-1 text-[11px] text-app-soft break-all">
              {confirmDelete.key}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded border border-app-border/20 px-3 py-1.5 text-sm"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="rounded border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-sm text-rose-200"
                onClick={() => void executeDelete()}
              >
                Confirm delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {moveDialogOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell flex max-h-[80%] w-full max-w-md flex-col rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Move selected items
            </h3>
            <p className="mt-2 text-sm text-app-muted">
              Choose the destination folder for {selectedNodes.length} selected
              item(s).
            </p>
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-scroll pr-1">
              {moveFolderOptions.map((folder) => (
                <button
                  key={folder.key || "root"}
                  type="button"
                  disabled={isMovingSelected}
                  className={`blue-focus flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm ${
                    moveDestination === folder.key
                      ? "border-accent bg-accent-soft text-app-text"
                      : "border-app-border/20 bg-white/[0.04] text-app-muted hover:text-app-text"
                  }`}
                  onClick={() => setMoveDestination(folder.key)}
                >
                  <Folder className="h-3.5 w-3.5 shrink-0 text-accent" />
                  <span className="truncate">{folder.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                disabled={isMovingSelected}
                className="rounded border border-app-border/20 px-3 py-1.5 text-sm"
                onClick={() => setMoveDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={isMovingSelected}
                className="rounded border border-accent bg-accent-soft px-3 py-1.5 text-sm text-app-text"
                onClick={() => void moveSelected()}
              >
                {isMovingSelected ? (
                  <LoadingIndicator text="Moving..." />
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {renameDialogOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell w-full max-w-md rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Rename selected items
            </h3>
            <p className="mt-2 text-xs text-app-muted">
              Enter a base name. vor2 will rename items as base-1, base-2, and
              keep file extensions.
            </p>
            <label className="mt-4 block text-xs text-app-muted">
              Base name
              <input
                autoFocus
                disabled={isRenamingSelected}
                className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                value={renameBaseName}
                onChange={(event) => setRenameBaseName(event.target.value)}
                placeholder="new-name"
              />
            </label>
            <div className="mt-3 rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-2 text-[11px] text-app-soft">
              Example: {renameBaseName.trim() || "new-name"}-1
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                disabled={isRenamingSelected}
                className="rounded border border-app-border/20 px-3 py-1.5 text-xs"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={isRenamingSelected || !renameBaseName.trim()}
                className="rounded border border-accent bg-accent-soft px-3 py-1.5 text-xs text-app-text disabled:opacity-60"
                onClick={() => void renameSelected()}
              >
                {isRenamingSelected ? (
                  <LoadingIndicator text="Renaming..." />
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {deleteDialogOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell w-full max-w-md rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Delete selected items
            </h3>
            <p className="mt-2 text-xs text-app-muted">
              Delete {selectedNodes.length} selected item(s)? Folders include
              all subfolders and files.
            </p>
            <div className="mt-4 max-h-48 space-y-1 overflow-y-scroll rounded-lg border border-app-border/20 bg-white/[0.04] p-2">
              {selectedNodes.map((node) => (
                <p key={node.id} className="truncate text-[11px] text-app-soft">
                  {node.key}
                </p>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                disabled={isDeletingSelected}
                className="rounded border border-app-border/20 px-3 py-1.5 text-xs"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={isDeletingSelected}
                className="rounded border border-rose-500/40 bg-rose-500/20 px-3 py-1.5 text-xs text-rose-200 disabled:opacity-60"
                onClick={() => void deleteSelected()}
              >
                {isDeletingSelected ? (
                  <LoadingIndicator
                    className="text-rose-200"
                    spinnerClassName="border-rose-400/30 border-t-rose-200"
                    text="Deleting..."
                  />
                ) : (
                  "Confirm delete"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {expiringDialogNode?.kind === "file" ? (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell w-full max-w-md rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Create Expiring Link
            </h3>
            <p className="mt-2 text-sm text-app-muted break-all">
              {expiringDialogNode.name}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {TTL_PRESETS_MINUTES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded border px-2 py-1.5 text-sm ${
                    Number(expiringMinutes) === value
                      ? "border-accent bg-accent-soft text-app-text"
                      : "border-app-border/20 bg-white/[0.04] text-app-muted hover:text-app-text"
                  }`}
                  onClick={() => setExpiringMinutes(String(value))}
                >
                  {value >= 60 ? `${value / 60}h` : `${value}m`}
                </button>
              ))}
            </div>
            <label className="mt-3 block text-sm text-app-muted">
              Custom minutes
              <input
                type="number"
                min={1}
                className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                value={expiringMinutes}
                onChange={(event) => setExpiringMinutes(event.target.value)}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded border border-app-border/20 px-3 py-1.5 text-sm"
                onClick={() => setExpiringDialogNode(null)}
              >
                Cancel
              </button>
              <button
                className="rounded border border-accent bg-accent-soft px-3 py-1.5 text-sm text-app-text"
                onClick={() => {
                  const ttl = Number(expiringMinutes);
                  if (!Number.isFinite(ttl) || ttl <= 0) {
                    setMessage("Invalid TTL minutes.");
                    return;
                  }
                  const node = expiringDialogNode;
                  setExpiringDialogNode(null);
                  void createExpiringLink(node, ttl);
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {advancedOpen ? (
        <div className="overlay-backdrop fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="glass-shell w-full max-w-xl rounded-app p-5">
            <h3 className="text-sm font-semibold text-app-text">
              Advanced Search
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-app-muted">
              <label className="col-span-2">
                Search pattern
                <input
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.pattern}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      pattern: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={advancedSearch.useRegex}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      useRegex: event.target.checked,
                    }))
                  }
                />
                Use regular expression
              </label>
              <label>
                Scope
                <select
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.scope}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      scope: event.target.value as "current" | "anywhere",
                    }))
                  }
                >
                  <option value="current">Current folder</option>
                  <option value="anywhere">Anywhere in bucket</option>
                </select>
              </label>
              <label>
                File size
                <select
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.sizeMode}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      sizeMode: event.target.value as "any" | "less" | "more",
                    }))
                  }
                >
                  <option value="any">Any</option>
                  <option value="less">Less than</option>
                  <option value="more">More than</option>
                </select>
              </label>
              <label>
                Size MB (0 = all)
                <input
                  type="number"
                  min={0}
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.sizeMb}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      sizeMb: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Period
                <select
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.period}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      period: event.target.value,
                    }))
                  }
                >
                  <option value="all">All</option>
                  <option value="recent">Recent</option>
                  <option value="last7">Last 7 days</option>
                  <option value="last15">Last 15 days</option>
                  <option value="last30">Last 30 days</option>
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label>
                Quick filter
                <select
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.quickFilter}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      quickFilter: event.target.value,
                    }))
                  }
                >
                  <option value="all">All</option>
                  <option value="images">Images</option>
                  <option value="documents">Documents</option>
                  <option value="videos">Videos</option>
                  <option value="archives">Archives</option>
                  <option value="last7">Last 7 days</option>
                  <option value="large">Large files &gt; 10 MB</option>
                </select>
              </label>
              <label>
                From
                <input
                  type="date"
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.fromDate}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      fromDate: event.target.value,
                    }))
                  }
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  className="blue-focus mt-1 w-full rounded border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-app-text"
                  value={advancedSearch.toDate}
                  onChange={(event) =>
                    setAdvancedSearch((prev) => ({
                      ...prev,
                      toDate: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded border border-app-border/20 px-3 py-1.5 text-sm"
                onClick={() => setAdvancedOpen(false)}
              >
                Cancel
              </button>
              <button
                className="rounded border border-app-border/20 px-3 py-1.5 text-sm"
                onClick={clearAdvancedSearch}
              >
                Clear
              </button>
              <button
                className="rounded border border-accent bg-accent-soft px-3 py-1.5 text-sm text-app-text"
                onClick={() => void runAdvancedSearch()}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
