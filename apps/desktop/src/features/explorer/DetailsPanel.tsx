import { Copy, Download, Share2, Trash2 } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2ExplorerNode } from "./explorer.types";

export function DetailsPanel({ node }: { node: R2ExplorerNode | undefined }) {
  if (!node) {
    return <div className="text-xs text-app-soft">Select a file to view details.</div>;
  }

  if (node.kind === "folder") {
    return (
      <div className="space-y-2 text-xs">
        <h3 className="text-sm font-semibold text-app-text">{node.name}</h3>
        <p className="text-app-muted">Path: {node.path}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-app-text">{node.name}</h3>
      <div className="space-y-1 text-app-muted">
        <p>Size: {formatBytes(node.sizeBytes)}</p>
        <p>Type: {node.mimeType ?? "Unknown"}</p>
        <p>Last Modified: {formatDate(node.lastModified)}</p>
        <p>ETag: {node.etag ?? "-"}</p>
        <p>Storage Class: {node.storageClass ?? "-"}</p>
        <p>Object Key: {node.key}</p>
        <p>Status: {node.isPublic ? "Public" : "Private"}</p>
        <p>Public URL: {node.publicUrl ?? "No public URL configured"}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left" disabled={!node.publicUrl}>
          <Copy className="mr-1 inline h-3 w-3" />
          Copy URL
        </button>
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left" disabled={!node.publicUrl}>
          <Share2 className="mr-1 inline h-3 w-3" />
          Share
        </button>
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left">
          <Download className="mr-1 inline h-3 w-3" />
          Download
        </button>
        <button type="button" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-left text-rose-200">
          <Trash2 className="mr-1 inline h-3 w-3" />
          Delete
        </button>
      </div>
    </div>
  );
}
