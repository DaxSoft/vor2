import { create } from "zustand";
import { explorerService } from "./explorer.service";
import type { ExplorerStoreState } from "./explorer.types";

function parentPath(path: string): string {
  const clean = path.replace(/\/$/, "").replace(/^\//, "");
  if (!clean) {
    return "/";
  }
  const parts = clean.split("/");
  parts.pop();
  if (parts.length === 0) {
    return "/";
  }
  return `/${parts.join("/")}`;
}

export const useExplorerStore = create<ExplorerStoreState>((set, get) => ({
  activeConnectionId: null,
  bucketName: "",
  currentPath: "/",
  nodes: [],
  selectedNodeId: null,
  expandedFolders: [],
  isLoading: false,
  error: null,
  searchQuery: "",
  sortBy: "name",
  sortDirection: "asc",
  viewMode: "table",
  async loadPath(path) {
    const state = get();
    if (!state.activeConnectionId) {
      return;
    }
    set({ isLoading: true, error: null, currentPath: path });
    try {
      const nodes = await explorerService.browse(state.activeConnectionId, state.bucketName, path);
      set({ nodes, isLoading: false, selectedNodeId: null });
    } catch {
      set({
        isLoading: false,
        error: "Could not connect to this R2 bucket. Check the endpoint, bucket name, and access key permissions."
      });
    }
  },
  async refresh() {
    await get().loadPath(get().currentPath);
  },
  selectNode(id) {
    set({ selectedNodeId: id });
  },
  async openNode(id) {
    const node = get().nodes.find((item) => item.id === id);
    if (!node) {
      return;
    }
    if (node.kind === "folder") {
      await get().loadPath(`/${node.key.replace(/\/$/, "")}`);
      return;
    }
    set({ selectedNodeId: id });
  },
  async goBack() {
    await get().goParent();
  },
  async goParent() {
    await get().loadPath(parentPath(get().currentPath));
  },
  async createFolder(name) {
    const state = get();
    if (!state.activeConnectionId) {
      return;
    }
    await explorerService.createFolder(state.activeConnectionId, state.bucketName, state.currentPath, name);
    await get().refresh();
  },
  setSearchQuery(query) {
    set({ searchQuery: query });
  },
  setSort(sortBy, direction) {
    set({ sortBy, sortDirection: direction });
  },
  setActiveConnection(connectionId, bucketName) {
    set({ activeConnectionId: connectionId, bucketName });
  }
}));
