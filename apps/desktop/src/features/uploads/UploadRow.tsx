import { CheckCircle2, Pause, RotateCcw, XCircle } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { UploadTask } from "./upload.types";

export function UploadRow({
  task,
  onPause,
  onCancel,
  onRetry
}: {
  task: UploadTask;
  onPause: () => void;
  onCancel: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-lg border border-app-border bg-white/5 p-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="truncate text-app-text">{task.fileName}</span>
        <span className="text-app-muted">{Math.round(task.progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded bg-white/10">
        <div className="h-full bg-[linear-gradient(90deg,#2488ff,#5aa7ff)]" style={{ width: `${task.progress}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-app-soft">
        <span>
          {formatBytes(task.uploadedBytes)} / {formatBytes(task.sizeBytes)}
        </span>
        <span>{task.status}</span>
      </div>
      <div className="mt-2 flex gap-2 text-[11px]">
        <button type="button" className="rounded border border-app-border px-2 py-1" onClick={onPause}>
          <Pause className="mr-1 inline h-3 w-3" />
          Pause
        </button>
        <button type="button" className="rounded border border-app-border px-2 py-1" onClick={onCancel}>
          <XCircle className="mr-1 inline h-3 w-3" />
          Cancel
        </button>
        <button type="button" className="rounded border border-app-border px-2 py-1" onClick={onRetry}>
          <RotateCcw className="mr-1 inline h-3 w-3" />
          Retry
        </button>
        {task.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : null}
      </div>
    </div>
  );
}
