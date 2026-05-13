import { File, Folder } from "lucide-react";
import type { MouseEvent } from "react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2ExplorerNode } from "./explorer.types";

export function ExplorerTable({
  nodes,
  selectedNodeId,
  onSelect,
  onOpen,
  onContextMenu,
}: {
  nodes: R2ExplorerNode[];
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onContextMenu: (event: MouseEvent, node: R2ExplorerNode) => void;
}) {
  return (
    <table className="w-full table-fixed text-left text-[13px]">
      <thead>
        <tr className="border-b border-app-border/20 text-xs font-semibold text-app-muted">
          <th className="px-3 py-2">Name</th>
          <th className="px-3 py-2">Type</th>
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
              node.id === selectedNodeId ? "bg-accent-soft" : "hover:bg-white/5"
            }`}
            onClick={() => onSelect(node.id)}
            onDoubleClick={() => {
              void onOpen(node.id);
            }}
            onContextMenu={(event) => onContextMenu(event, node)}
          >
            <td className="px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                {node.kind === "folder" ? (
                  <Folder className="h-4 w-4 shrink-0 text-accent" />
                ) : (
                  <File className="h-4 w-4 shrink-0 text-accent" />
                )}
                <span className="truncate">{node.name}</span>
              </div>
            </td>
            <td className="px-3 py-2 text-app-muted">
              {node.kind === "folder" ? "Folder" : (node.mimeType ?? "File")}
            </td>
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
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${node.isPublic ? "bg-emerald-400" : "bg-slate-500"}`}
                  />
                  {node.isPublic ? "Public" : "Private"}
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
