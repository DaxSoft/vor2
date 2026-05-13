import { invoke } from "@tauri-apps/api/core";
import { mapListingToNodes } from "./object-mapper";
import type { R2ExplorerNode } from "./explorer.types";

interface ExplorerListingResult {
  folders: Array<{ key: string; name: string; childCount?: number; totalSizeBytes?: number }>;
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

interface PresignedUrlResult {
  url: string;
  ttlSeconds: number;
  expiresAt: string;
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
  },

  async deleteObject(connectionId: string, bucketName: string, objectKey: string): Promise<void> {
    await invoke("delete_object", {
      connectionId,
      bucketName,
      objectKey
    });
  },

  async deletePrefix(connectionId: string, bucketName: string, prefix: string): Promise<void> {
    await invoke("delete_prefix", {
      connectionId,
      bucketName,
      prefix
    });
  },

  async listPrefixObjects(connectionId: string, bucketName: string, prefix: string): Promise<string[]> {
    const result = await invoke<{ keys: string[] }>("list_prefix_objects", {
      connectionId,
      bucketName,
      prefix
    });
    return result.keys;
  },

  async renameObject(connectionId: string, bucketName: string, oldKey: string, newKey: string): Promise<void> {
    await invoke("rename_object", {
      connectionId,
      bucketName,
      oldKey,
      newKey
    });
  },

  async renamePrefix(connectionId: string, bucketName: string, oldPrefix: string, newPrefix: string): Promise<void> {
    await invoke("rename_prefix", {
      connectionId,
      bucketName,
      oldPrefix,
      newPrefix
    });
  },

  async createPresignedGetUrl(
    connectionId: string,
    bucketName: string,
    objectKey: string,
    ttlSeconds = 900
  ): Promise<PresignedUrlResult> {
    return invoke<PresignedUrlResult>("create_presigned_get_url", {
      connectionId,
      bucketName,
      objectKey,
      ttlSeconds
    });
  }
};
