import { invoke } from "@tauri-apps/api/core";

export const uploadService = {
  async enqueueUploads(connectionId: string, bucketName: string, targetPath: string, files: File[]) {
    const serializable = files.map((file) => ({
      fileName: file.name,
      sizeBytes: file.size,
      sourcePath: file.name,
      targetPath
    }));
    await invoke("enqueue_uploads", { connectionId, bucketName, targetPath, files: serializable });
  }
};
