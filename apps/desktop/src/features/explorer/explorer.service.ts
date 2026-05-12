import { invoke } from "@tauri-apps/api/core";
import { mapListingToNodes } from "./object-mapper";
import type { R2ExplorerNode } from "./explorer.types";

interface ExplorerListingResult {
  folders: Array<{ key: string; name: string; childCount?: number }>;
  files: Array<{
    key: string;
    name: string;
    sizeBytes: number;
    mimeType?: string;
    lastModified?: string;
    etag?: string;
    storageClass?: string;
  }>;
}

export const explorerService = {
  async browse(connectionId: string, bucketName: string, path: string, publicUrl?: string): Promise<R2ExplorerNode[]> {
    const result = await invoke<ExplorerListingResult>("browse_folder", {
      connectionId,
      bucketName,
      path
    });
    return mapListingToNodes(result, publicUrl);
  },

  async createFolder(connectionId: string, bucketName: string, path: string, folderName: string): Promise<void> {
    await invoke("create_folder", {
      connectionId,
      bucketName,
      path,
      folderName
    });
  }
};
