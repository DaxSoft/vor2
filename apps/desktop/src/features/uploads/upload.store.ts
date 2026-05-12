import { create } from "zustand";
import { uploadService } from "./upload.service";
import { updateUploadProgress } from "./upload-progress";
import type { UploadStoreState } from "./upload.types";

export const useUploadStore = create<UploadStoreState>((set, get) => ({
  tasks: [],
  isQueueVisible: false,
  isPaused: false,
  concurrency: 3,
  setQueueVisible(visible) {
    set({ isQueueVisible: visible });
  },
  async addPathEntries(entries, targetPath, connectionId, bucketName) {
    const tasks = entries.map((entry) => ({
      id: `${Date.now()}-${entry.fileName}`,
      connectionId,
      bucketName,
      sourcePath: entry.path,
      objectKey: `${targetPath.replace(/\/$/, "")}/${entry.fileName}`.replace(/^\//, ""),
      fileName: entry.fileName,
      sizeBytes: entry.sizeBytes,
      uploadedBytes: 0,
      progress: 0,
      speedBytesPerSecond: 0,
      status: "queued" as const
    }));

    set({ tasks: [...get().tasks, ...tasks], isQueueVisible: true });

    await uploadService.enqueueUploads(connectionId, bucketName, targetPath, entries);

    for (const task of tasks) {
      await get().startTask(task.id);
    }
  },
  async startTask(taskId) {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    set({
      tasks: get().tasks.map((item) => (item.id === taskId ? { ...item, status: "uploading", startedAt: new Date() } : item))
    });

    set({
      tasks: get().tasks.map((item) => (item.id === taskId ? updateUploadProgress(item, item.sizeBytes, item.sizeBytes) : item))
    });
  },
  pauseTask(taskId) {
    set({ tasks: get().tasks.map((item) => (item.id === taskId ? { ...item, status: "paused" } : item)) });
  },
  cancelTask(taskId) {
    set({ tasks: get().tasks.map((item) => (item.id === taskId ? { ...item, status: "canceled" } : item)) });
  },
  async retryTask(taskId) {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }
    set({
      tasks: get().tasks.map((item) =>
        item.id === taskId ? { ...item, status: "queued", progress: 0, uploadedBytes: 0, errorMessage: undefined } : item
      )
    });
    await get().startTask(taskId);
  },
  clearCompleted() {
    const remaining = get().tasks.filter((item) => item.status !== "completed");
    set({ tasks: remaining, isQueueVisible: remaining.length > 0 });
  },
  pauseAll() {
    set({ isPaused: true, tasks: get().tasks.map((item) => ({ ...item, status: item.status === "uploading" ? "paused" : item.status })) });
  },
  resumeAll() {
    set({ isPaused: false, tasks: get().tasks.map((item) => ({ ...item, status: item.status === "paused" ? "queued" : item.status })) });
  }
}));
