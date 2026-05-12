import { File, Folder } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2ExplorerNode } from "./explorer.types";

export function ExplorerTable({
  nodes,
  selectedNodeId,
  onSelect,
  onOpen
}: {
  nodes: R2ExplorerNode[];
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  return (
    <table className="w-full table-fixed text-left text-[13px]">
      <thead>
        <tr className="border-b border-app-border text-xs font-semibold text-app-muted">
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
            className={`cursor-pointer border-b border-white/5 ${
              node.id === selectedNodeId ? "bg-accent-soft" : "hover:bg-white/5"
            }`}
            onClick={() => onSelect(node.id)}
            onDoubleClick={() => {
              void onOpen(node.id);
            }}
          >
            <td className="px-3 py-2">
              <div className="flex items-center gap-2">
                {node.kind === "folder" ? <Folder className="h-4 w-4 text-accent" /> : <File className="h-4 w-4 text-accent" />}
                <span className="truncate">{node.name}</span>
              </div>
            </td>
            <td className="px-3 py-2 text-app-muted">{node.kind === "folder" ? "Folder" : node.mimeType ?? "File"}</td>
            <td className="px-3 py-2 text-app-muted">{node.kind === "file" ? formatBytes(node.sizeBytes) : "-"}</td>
            <td className="px-3 py-2 text-app-muted">{node.kind === "file" ? formatDate(node.lastModified) : "-"}</td>
            <td className="px-3 py-2 text-app-muted">{node.kind === "file" ? (node.isPublic ? "Public" : "Private") : "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
