import { ChevronUp } from "lucide-react";
import { UploadDropzone } from "./UploadDropzone";
import { UploadRow } from "./UploadRow";
import { useUploadStore } from "./upload.store";

export function UploadQueue({ onPickFiles, onDropPaths }: { onPickFiles: () => void; onDropPaths?: (paths: string[]) => void }) {
  const tasks = useUploadStore((state) => state.tasks);
  const pauseTask = useUploadStore((state) => state.pauseTask);
  const cancelTask = useUploadStore((state) => state.cancelTask);
  const retryTask = useUploadStore((state) => state.retryTask);
  const clearCompleted = useUploadStore((state) => state.clearCompleted);
  const setQueueVisible = useUploadStore((state) => state.setQueueVisible);
  const currentPath = tasks[0]?.objectKey.includes("/") ? `/${tasks[0].objectKey.split("/").slice(0, -1).join("/")}` : "/";

  return (
    <section className="glass-panel rounded-panel border border-app-border/45 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">Upload Queue ({tasks.length})</h3>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-md border border-app-border/45 bg-white/[0.04] px-2 py-1 text-xs text-app-muted hover:text-app-text" onClick={clearCompleted}>
            Clear Completed
          </button>
          <button type="button" className="rounded-md border border-app-border/45 bg-white/[0.04] p-1 text-xs text-app-muted hover:text-app-text" onClick={() => setQueueVisible(false)}>
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <UploadDropzone onPickFiles={onPickFiles} onDropPaths={onDropPaths} targetPath={currentPath} />

      <div className="mt-3 space-y-2">
        {tasks.length === 0 ? <p className="text-xs text-app-soft">No uploads yet.</p> : null}
        {tasks.map((task) => (
          <UploadRow
            key={task.id}
            task={task}
            onPause={() => pauseTask(task.id)}
            onCancel={() => cancelTask(task.id)}
            onRetry={() => {
              void retryTask(task.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}
