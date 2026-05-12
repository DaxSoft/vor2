export type UploadTaskStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface UploadTask {
  id: string;
  connectionId: string;
  bucketName: string;
  sourcePath: string;
  objectKey: string;
  fileName: string;
  sizeBytes: number;
  uploadedBytes: number;
  progress: number;
  speedBytesPerSecond: number;
  status: UploadTaskStatus;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface UploadStoreState {
  tasks: UploadTask[];
  isQueueVisible: boolean;
  isPaused: boolean;
  concurrency: number;
  addFiles: (files: File[], targetPath: string) => void;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => Promise<void>;
  clearCompleted: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
}
