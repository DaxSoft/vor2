import { invoke } from "@tauri-apps/api/core";
import type { UploadLocalEntry } from "./upload.types";

export const uploadService = {
  async enqueueUploads(connectionId: string, bucketName: string, targetPath: string, entries: UploadLocalEntry[]) {
    const serializable = entries.map((entry) => ({
      fileName: entry.fileName,
      sizeBytes: entry.sizeBytes,
      sourcePath: entry.path,
      targetPath: `${targetPath.replace(/\/$/, "")}/${entry.fileName}`.replace(/^\//, "")
    }));
    await invoke("enqueue_uploads", { connectionId, bucketName, targetPath, files: serializable });
  }
};
