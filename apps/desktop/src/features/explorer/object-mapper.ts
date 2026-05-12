import { buildPublicUrl } from "@r2-explorer/r2/src/path-utils";
import type { R2ExplorerNode, R2FileNode, R2FolderNode } from "./explorer.types";

interface RawListing {
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

export function mapListingToNodes(listing: RawListing, publicUrl?: string): R2ExplorerNode[] {
  const folders: R2FolderNode[] = listing.folders.map((folder) => ({
    id: folder.key,
    key: folder.key,
    name: folder.name,
    path: folder.key,
    kind: "folder",
    childCount: folder.childCount,
    totalSizeBytes: folder.totalSizeBytes
  }));

  const files: R2FileNode[] = listing.files.map((file) => ({
    id: file.key,
    key: file.key,
    name: file.name,
    path: file.key,
    kind: "file",
    sizeBytes: file.sizeBytes,
    mimeType: file.mimeType,
    lastModified: file.lastModified ? new Date(file.lastModified) : undefined,
    etag: file.etag,
    storageClass: file.storageClass,
    publicUrl: buildPublicUrl(publicUrl, file.key),
    isPublic: Boolean(publicUrl)
  }));

  return [...folders, ...files];
}
