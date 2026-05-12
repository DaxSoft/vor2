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

export interface UploadLocalEntry {
  path: string;
  fileName: string;
  sizeBytes: number;
}

export interface UploadStoreState {
  tasks: UploadTask[];
  isQueueVisible: boolean;
  isPaused: boolean;
  concurrency: number;
  setQueueVisible: (visible: boolean) => void;
  addPathEntries: (entries: UploadLocalEntry[], targetPath: string, connectionId: string, bucketName: string) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  pauseTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;
  retryTask: (taskId: string) => Promise<void>;
  clearCompleted: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
}
