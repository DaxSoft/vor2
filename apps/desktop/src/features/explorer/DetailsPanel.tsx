import { useState } from "react";
import { Copy, Download, Share2, TimerReset, Trash2 } from "lucide-react";
import { formatBytes, formatDate } from "@/lib/format";
import type { R2FileNode } from "./explorer.types";

export function DetailsPanel({
  node,
  onDelete,
  onDownload,
  onCreateExpiringLink,
}: {
  node: R2FileNode;
  onDelete: (key: string) => Promise<void>;
  onDownload: (key: string) => Promise<void>;
  onCreateExpiringLink: (key: string) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const previewUrl = node.signedUrl ?? node.publicUrl;
  const extension = node.name.split(".").pop()?.toLowerCase() ?? "";
  const signedTtl = (() => {
    if (!node.signedUrlExpiresAt) {
      return "-";
    }
    const seconds = Math.floor((node.signedUrlExpiresAt.getTime() - Date.now()) / 1000);
    if (seconds <= 0) {
      return "expired";
    }
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const minutesLeft = minutes % 60;
    return minutesLeft > 0 ? `${hours}h ${minutesLeft}m` : `${hours}h`;
  })();
  const mime = (node.mimeType ?? "").toLowerCase();
  const isImage =
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(extension);
  const isAudio =
    mime.startsWith("audio/") ||
    ["mp3", "wav", "ogg", "aac", "m4a", "flac"].includes(extension);
  const isVideo =
    mime.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv", "avi"].includes(extension);

  const copyUrl = async () => {
    if (!node.publicUrl) {
      setMessage("No public URL configured for this connection.");
      return;
    }
    await navigator.clipboard.writeText(node.publicUrl);
    setMessage("Public URL copied.");
  };

  const copyExpiringUrl = async () => {
    if (!node.signedUrl) {
      setMessage("No expiring URL generated yet.");
      return;
    }
    await navigator.clipboard.writeText(node.signedUrl);
    setMessage("Expiring URL copied.");
  };

  const shareUrl = async () => {
    const url = node.signedUrl ?? node.publicUrl;
    if (!url) {
      setMessage("No URL available yet. Create an expiring link first.");
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: node.name, url });
      setMessage("Share dialog opened.");
      return;
    }
    await navigator.clipboard.writeText(url);
    setMessage("Share not supported. URL copied instead.");
  };

  const copyEtag = async () => {
    if (!node.etag) {
      return;
    }
    await navigator.clipboard.writeText(node.etag);
    setMessage("ETag copied.");
  };

  const createExpiringLink = () => {
    onCreateExpiringLink(node.key);
  };

  const download = async () => {
    await onDownload(node.key);
    setMessage("Download started.");
  };

  const remove = async () => {
    await onDelete(node.key);
    setMessage("Object deleted.");
  };

  return (
    <div className="flex h-full flex-col text-xs">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">Details</h3>
      </div>

      {previewUrl && (isImage || isAudio || isVideo) ? (
        <div className="mb-3 rounded-lg border border-app-border/20 bg-black/20 p-2">
          {isImage ? (
            <img
              src={previewUrl}
              alt={node.name}
              className="max-h-40 w-full rounded object-cover"
            />
          ) : null}
          {isAudio ? (
            <audio controls src={previewUrl} className="w-full" />
          ) : null}
          {isVideo ? (
            <video
              controls
              src={previewUrl}
              className="max-h-48 w-full rounded"
            />
          ) : null}
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="truncate text-base font-semibold text-app-text">
          {node.name}
        </p>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
            node.signedUrl
              ? "border-sky-400/30 bg-sky-500/15 text-sky-200"
              : node.isPublic
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
              : "border-slate-500/30 bg-slate-500/15 text-slate-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              node.signedUrl
                ? "bg-sky-400"
                : node.isPublic
                  ? "bg-emerald-400"
                  : "bg-slate-400"
            }`}
          />
          {node.signedUrl ? "Signed URL Active" : node.isPublic ? "Public" : "Private"}
        </span>
      </div>

      <div className="space-y-2 border-y border-app-border/20 py-3 text-app-muted">
        <div className="flex items-center justify-between gap-2">
          <span>Size</span>
          <span className="text-right text-app-text">
            {formatBytes(node.sizeBytes)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Type</span>
          <span className="text-right text-app-text">
            {node.mimeType ?? "Unknown"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Last Modified</span>
          <span className="text-right text-app-text">
            {formatDate(node.lastModified)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>ETag</span>
          <button
            type="button"
            onClick={() => void copyEtag()}
            className="max-w-[150px] truncate text-right text-app-text underline-offset-2 hover:underline"
            title={node.etag ?? "-"}
          >
            {node.etag ?? "-"}
          </button>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Storage Class</span>
          <span className="text-right text-app-text">
            {node.storageClass ?? "-"}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold text-app-muted">
          Public URL
        </p>
        <p className="truncate text-[11px] text-accent">
          {node.publicUrl ?? "No public URL configured"}
        </p>
      </div>

      <div className="mt-3">
        <p className="mb-1 text-[11px] font-semibold text-app-muted">Expiring URL</p>
        <p className="truncate text-[11px] text-sky-300">
          {node.signedUrl ?? "Not generated"}
        </p>
        <p className="mt-1 text-[11px] text-app-soft">
          TTL: {signedTtl}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-lg border border-app-border/20 bg-accent-soft px-2 py-1.5 text-left text-app-text"
          onClick={() => void copyUrl()}
        >
          <Copy className="mr-1 inline h-3 w-3" />
          Copy URL
        </button>
        <button
          type="button"
          className="rounded-lg border border-app-border/20 bg-white/[0.05] px-2 py-1.5 text-left"
          onClick={() => void shareUrl()}
        >
          <Share2 className="mr-1 inline h-3 w-3" />
          Share
        </button>
        {node.signedUrl ? (
          <button
            type="button"
            className="col-span-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1.5 text-left text-sky-100"
            onClick={() => void copyExpiringUrl()}
          >
            <Copy className="mr-1 inline h-3 w-3" />
            Copy Expiring URL
          </button>
        ) : null}
        <button
          type="button"
          className="col-span-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2 py-1.5 text-left text-sky-100"
          onClick={createExpiringLink}
        >
          <TimerReset className="mr-1 inline h-3 w-3" />
          Create Expiring Link
        </button>
      </div>

      <div className="mt-3 border-t border-app-border/20 pt-3">
        <p className="mb-2 text-[11px] font-semibold text-app-muted">Actions</p>
        <button
          type="button"
          className="mb-2 flex w-full items-center gap-2 rounded-lg border border-app-border/20 bg-white/[0.05] px-2 py-2 text-left"
          onClick={() => void download()}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-2 text-left text-rose-200"
          onClick={() => void remove()}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {message ? (
        <p className="mt-3 text-[11px] text-app-soft">{message}</p>
      ) : null}
    </div>
  );
}
