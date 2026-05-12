import { UploadDropzone } from "./UploadDropzone";
import { UploadRow } from "./UploadRow";
import { useUploadStore } from "./upload.store";

export function UploadQueue({ onPickFiles }: { onPickFiles: () => void }) {
  const tasks = useUploadStore((state) => state.tasks);
  const pauseTask = useUploadStore((state) => state.pauseTask);
  const cancelTask = useUploadStore((state) => state.cancelTask);
  const retryTask = useUploadStore((state) => state.retryTask);
  const clearCompleted = useUploadStore((state) => state.clearCompleted);
  const setQueueVisible = useUploadStore((state) => state.setQueueVisible);

  return (
    <section className="glass-panel rounded-panel border border-app-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-app-text">Upload Queue</h3>
        <div className="flex items-center gap-3">
          <button type="button" className="text-xs text-app-muted hover:text-app-text" onClick={clearCompleted}>
            Clear completed
          </button>
          <button
            type="button"
            className="text-xs text-app-muted hover:text-app-text"
            onClick={() => setQueueVisible(false)}
          >
            Hide
          </button>
        </div>
      </div>

      <UploadDropzone onPickFiles={onPickFiles} />

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
