import { Folder } from "lucide-react";
import type { R2ExplorerNode } from "./explorer.types";

export function FolderTree({ nodes, onOpen }: { nodes: R2ExplorerNode[]; onOpen: (id: string) => void }) {
  const folders = nodes.filter((node) => node.kind === "folder");

  return (
    <div className="space-y-1">
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className="flex min-w-0 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-app-muted hover:bg-accent-soft hover:text-app-text"
          onClick={() => onOpen(folder.id)}
        >
          <Folder className="h-4 w-4 shrink-0 text-accent" />
          <span className="min-w-0 truncate" title={folder.name}>
            {folder.name}
          </span>
        </button>
      ))}
    </div>
  );
}
