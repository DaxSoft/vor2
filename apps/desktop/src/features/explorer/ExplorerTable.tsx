import { File, Folder } from "lucide-react";
import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2ExplorerNode } from "./explorer.types";

function formatSignedTtl(expiresAt: Date | undefined, nowMs: number): string {
  if (!expiresAt) {
    return "";
  }
  const seconds = Math.floor((expiresAt.getTime() - nowMs) / 1000);
  if (seconds <= 0) {
    return "expired";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const minutesLeft = minutes % 60;
  return minutesLeft > 0 ? `${hours}h ${minutesLeft}m` : `${hours}h`;
}

export function ExplorerTable({
  nodes,
  selectedNodeId,
  selectedNodeIds,
  onSelect,
  onToggleSelect,
  onSelectAll,
  onOpen,
  onContextMenu,
  onMove,
}: {
  nodes: R2ExplorerNode[];
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  onSelect: (id: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onOpen: (id: string) => void;
  onContextMenu: (event: MouseEvent, node: R2ExplorerNode) => void;
  onMove: (node: R2ExplorerNode, folder: R2ExplorerNode) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <table className="w-full table-fixed text-left text-[13px] text-app-text">
      <thead>
        <tr className="border-b border-app-border/20 text-xs font-semibold text-app-muted">
          <th className="w-9 px-3 py-2">
            <input
              aria-label="Select all"
              type="checkbox"
              checked={
                nodes.length > 0 && selectedNodeIds.length === nodes.length
              }
              onChange={onSelectAll}
            />
          </th>
          <th className="px-3 py-2">Name</th>
          <th className="px-3 py-2">Size</th>
          <th className="px-3 py-2">Modified</th>
          <th className="px-3 py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node) => (
          <tr
            key={node.id}
            className={`cursor-pointer border-b border-app-border/35 ${
              selectedNodeIds.includes(node.id) || node.id === selectedNodeId
                ? "bg-accent-soft"
                : "hover:bg-white/5"
            }`}
            draggable
            onClick={() => onSelect(node.id)}
            onDoubleClick={() => {
              void onOpen(node.id);
            }}
            onContextMenu={(event) => onContextMenu(event, node)}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/vor2-node-id", node.id);
              event.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(event) => {
              if (node.kind === "folder") {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(event) => {
              if (node.kind !== "folder") {
                return;
              }
              event.preventDefault();
              const draggedId = event.dataTransfer.getData("text/vor2-node-id");
              const dragged = nodes.find((item) => item.id === draggedId);
              if (dragged && dragged.id !== node.id) {
                onMove(dragged, node);
              }
            }}
          >
            <td className="px-3 py-2">
              <input
                aria-label={`Select ${node.name}`}
                type="checkbox"
                checked={selectedNodeIds.includes(node.id)}
                onClick={(event) => event.stopPropagation()}
                onChange={() => onToggleSelect(node.id)}
              />
            </td>
            <td className="px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                {node.kind === "folder" ? (
                  <Folder className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-accent" />
                )}
                <span className="truncate text-app-text">{node.name}</span>
              </div>
            </td>
            {/* <td className="px-3 py-2 text-app-muted">
              {node.kind === "folder" ? "Folder" : (node.mimeType ?? "File")}
            </td> */}
            <td className="px-3 py-2 text-app-muted">
              {node.kind === "file"
                ? formatBytes(node.sizeBytes)
                : formatBytes(node.totalSizeBytes ?? 0)}
            </td>
            <td className="px-3 py-2 text-app-muted">
              {node.kind === "file" ? formatDate(node.lastModified) : "-"}
            </td>
            <td className="px-3 py-2 text-app-muted">
              {node.kind === "file" ? (
                <span className="inline-flex items-center gap-1.5 text-app-text">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      node.signedUrl
                        ? "bg-sky-400"
                        : node.isPublic
                          ? "bg-emerald-400"
                          : "bg-slate-500"
                    }`}
                  />
                  {node.signedUrl
                    ? `Signed (${formatSignedTtl(node.signedUrlExpiresAt, now)})`
                    : node.isPublic
                      ? "Public"
                      : "Private"}
                </span>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
