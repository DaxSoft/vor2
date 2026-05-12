import { create } from "zustand";
import { uploadService } from "./upload.service";
import { updateUploadProgress } from "./upload-progress";
import type { UploadStoreState } from "./upload.types";

export const useUploadStore = create<UploadStoreState>((set, get) => ({
  tasks: [],
  isQueueVisible: true,
  isPaused: false,
  concurrency: 3,
  addFiles(files, targetPath) {
    const tasks = files.map((file) => ({
      id: `${Date.now()}-${file.name}`,
      connectionId: "",
      bucketName: "",
      sourcePath: file.name,
      objectKey: `${targetPath.replace(/\/$/, "")}/${file.name}`.replace(/^\//, ""),
      fileName: file.name,
      sizeBytes: file.size,
      uploadedBytes: 0,
      progress: 0,
      speedBytesPerSecond: 0,
      status: "queued" as const
    }));

    set({ tasks: [...get().tasks, ...tasks] });
  },
  async startTask(taskId) {
    const task = get().tasks.find((item) => item.id === taskId);
    if (!task) {
      return;
    }

    set({
      tasks: get().tasks.map((item) => (item.id === taskId ? { ...item, status: "uploading", startedAt: new Date() } : item))
    });

    await uploadService.enqueueUploads(task.connectionId, task.bucketName, "/", []);

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
    set({ tasks: get().tasks.filter((item) => item.status !== "completed") });
  },
  pauseAll() {
    set({ isPaused: true, tasks: get().tasks.map((item) => ({ ...item, status: item.status === "uploading" ? "paused" : item.status })) });
  },
  resumeAll() {
    set({ isPaused: false, tasks: get().tasks.map((item) => ({ ...item, status: item.status === "paused" ? "queued" : item.status })) });
  }
}));
