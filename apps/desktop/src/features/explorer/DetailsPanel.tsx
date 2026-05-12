import { useState } from "react";
import { Copy, Download, Share2, Trash2 } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2FileNode } from "./explorer.types";

export function DetailsPanel({ node, onDelete }: { node: R2FileNode; onDelete: (key: string) => Promise<void> }) {
  const [message, setMessage] = useState<string | null>(null);

  const copyUrl = async () => {
    if (!node.publicUrl) {
      setMessage("No public URL configured for this connection.");
      return;
    }
    await navigator.clipboard.writeText(node.publicUrl);
    setMessage("Public URL copied.");
  };

  const shareUrl = async () => {
    if (!node.publicUrl) {
      setMessage("No public URL configured for this connection.");
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: node.name, url: node.publicUrl });
      setMessage("Share dialog opened.");
      return;
    }
    await navigator.clipboard.writeText(node.publicUrl);
    setMessage("Share not supported. URL copied instead.");
  };

  const download = () => {
    if (!node.publicUrl) {
      setMessage("No public URL configured for this connection.");
      return;
    }
    window.open(node.publicUrl, "_blank", "noopener,noreferrer");
  };

  const remove = async () => {
    await onDelete(node.key);
    setMessage("Object deleted.");
  };

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
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left" onClick={() => void copyUrl()}>
          <Copy className="mr-1 inline h-3 w-3" />
          Copy URL
        </button>
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left" onClick={() => void shareUrl()}>
          <Share2 className="mr-1 inline h-3 w-3" />
          Share
        </button>
        <button type="button" className="rounded-lg border border-app-border bg-white/5 px-2 py-1 text-left" onClick={download}>
          <Download className="mr-1 inline h-3 w-3" />
          Download
        </button>
        <button
          type="button"
          className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1 text-left text-rose-200"
          onClick={() => void remove()}
        >
          <Trash2 className="mr-1 inline h-3 w-3" />
          Delete
        </button>
      </div>
      {message ? <p className="text-[11px] text-app-soft">{message}</p> : null}
    </div>
  );
}
