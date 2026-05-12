export type ConnectionStatus = "ACTIVE" | "DISABLED" | "NEEDS_REAUTH" | "ERROR";

export type UploadStatus =
  | "QUEUED"
  | "UPLOADING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";
