import type { UploadTask } from "./upload.types";

export function updateUploadProgress(task: UploadTask, uploadedBytes: number, sizeBytes: number): UploadTask {
  const progress = sizeBytes > 0 ? Math.min(100, (uploadedBytes / sizeBytes) * 100) : 100;
  return {
    ...task,
    uploadedBytes,
    progress,
    status: progress >= 100 ? "completed" : "uploading",
    completedAt: progress >= 100 ? new Date() : task.completedAt
  };
}
