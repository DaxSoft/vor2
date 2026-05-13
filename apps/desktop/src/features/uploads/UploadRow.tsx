import { CheckCircle2, Pause, RotateCcw, XCircle } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { UploadTask } from "./upload.types";

function formatEta(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0s";
  }
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

export function UploadRow({
  task,
  onPause,
  onCancel,
  onRetry,
}: {
  task: UploadTask;
  onPause: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  const remainingBytes = Math.max(task.sizeBytes - task.uploadedBytes, 0);
  const speedLabel =
    task.speedBytesPerSecond > 0
      ? `${formatBytes(task.speedBytesPerSecond)}/s`
      : "--";
  const etaSeconds =
    task.status === "completed"
      ? 0
      : task.speedBytesPerSecond > 0
        ? remainingBytes / task.speedBytesPerSecond
        : Number.NaN;
  const etaLabel = Number.isFinite(etaSeconds) ? formatEta(etaSeconds) : "--";

  return (
    <div className="rounded-lg border border-app-border/20 bg-white/[0.04] p-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="truncate text-app-text">{task.fileName}</span>
        <span className="text-app-muted">{Math.round(task.progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/10">
        <div
          className="h-full bg-[linear-gradient(90deg,#2488ff,#5aa7ff)]"
          style={{ width: `${task.progress}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-app-soft">
        <span>
          {formatBytes(task.uploadedBytes)} / {formatBytes(task.sizeBytes)}
        </span>
        <span className="uppercase tracking-wide">{task.status}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-app-soft">
        <span>Speed: {speedLabel}</span>
        <span>ETA: {etaLabel}</span>
      </div>
      <div className="mt-2 flex justify-end gap-2 text-[11px]">
        <button
          type="button"
          className="rounded border border-app-border/20 bg-white/[0.04] px-2 py-1"
          onClick={onPause}
        >
          <Pause className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="rounded border border-app-border/20 bg-white/[0.04] px-2 py-1"
          onClick={onCancel}
        >
          <XCircle className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="rounded border border-app-border/20 bg-white/[0.04] px-2 py-1"
          onClick={onRetry}
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        {task.status === "completed" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : null}
      </div>
    </div>
  );
}
