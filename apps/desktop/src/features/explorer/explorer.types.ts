export type R2NodeKind = "folder" | "file";

export interface R2BaseNode {
  id: string;
  key: string;
  name: string;
  path: string;
  kind: R2NodeKind;
}

export interface R2FolderNode extends R2BaseNode {
  kind: "folder";
  childCount?: number;
  totalSizeBytes?: number;
}

export interface R2FileNode extends R2BaseNode {
  kind: "file";
  sizeBytes: number;
  mimeType?: string;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
  publicUrl?: string;
  isPublic: boolean;
}

export type R2ExplorerNode = R2FolderNode | R2FileNode;

export type SortBy = "name" | "type" | "size" | "modified";

export interface ExplorerStoreState {
  activeConnectionId: string | null;
  bucketName: string;
  publicUrl?: string;
  currentPath: string;
  nodes: R2ExplorerNode[];
  selectedNodeId: string | null;
  expandedFolders: string[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: SortBy;
  sortDirection: "asc" | "desc";
  viewMode: "table";
  loadPath: (path: string) => Promise<void>;
  refresh: () => Promise<void>;
  selectNode: (id: string) => void;
  openNode: (id: string) => Promise<void>;
  goBack: () => Promise<void>;
  goParent: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteNode: (key: string) => Promise<void>;
  renameNode: (oldKey: string, newKey: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSort: (sortBy: SortBy, direction: "asc" | "desc") => void;
  setActiveConnection: (connectionId: string, bucketName: string, publicUrl?: string) => void;
}
