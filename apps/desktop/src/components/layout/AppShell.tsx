import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ExplorerView } from "@/features/explorer/ExplorerView";
import { UploadQueue } from "@/features/uploads/UploadQueue";
import { useExplorerStore } from "@/features/explorer/explorer.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import { useUploadStore } from "@/features/uploads/upload.store";
import { bindTrayEvents } from "@/features/tray/tray.events";
import { closeToTray, minimizeWindow, toggleMaximizeWindow } from "@/lib/desktop-window";

interface FileDialogEntry {
  path: string;
  fileName: string;
  sizeBytes: number;
}

export function AppShell() {
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const createFolder = useExplorerStore((state) => state.createFolder);
  const refresh = useExplorerStore((state) => state.refresh);
  const loadPath = useExplorerStore((state) => state.loadPath);
  const setActiveExplorerConnection = useExplorerStore((state) => state.setActiveConnection);
  const currentPath = useExplorerStore((state) => state.currentPath);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const connections = useConnectionStore((state) => state.items);
  const addPathEntries = useUploadStore((state) => state.addPathEntries);
  const pauseAll = useUploadStore((state) => state.pauseAll);
  const resumeAll = useUploadStore((state) => state.resumeAll);
  const isQueuePaused = useUploadStore((state) => state.isPaused);
  const [search, setSearch] = useState("");
  const [folderName, setFolderName] = useState("New folder");

  const activeConnection = connections.find((item) => item.id === activeConnectionId) ?? null;

  useEffect(() => {
    if (!activeConnection) {
      return;
    }
    setActiveExplorerConnection(activeConnection.id, activeConnection.bucketName);
    void loadPath(activeConnection.lastSelectedPath || "/");
  }, [activeConnection, loadPath, setActiveExplorerConnection]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    void bindTrayEvents((action) => {
      if (action === "pause_upload_queue") {
        if (isQueuePaused) {
          resumeAll();
          return;
        }
        pauseAll();
      }
    }).then((items) => {
      unsubscribers.push(...items);
    });

    void getCurrentWindow().onDragDropEvent(async (event) => {
      if (event.payload.type !== "drop") {
        return;
      }
      if (!activeConnection) {
        return;
      }
      const entries = await invoke<FileDialogEntry[]>("inspect_file_paths", { paths: event.payload.paths });
      void addPathEntries(entries, currentPath, activeConnection.id, activeConnection.bucketName);
    }).then((unlisten) => {
      unsubscribers.push(unlisten);
    });

    return () => {
      for (const unlisten of unsubscribers) {
        unlisten();
      }
    };
  }, [activeConnection, addPathEntries, currentPath, isQueuePaused, pauseAll, resumeAll]);

  const onUpload = useMemo(
    () => async () => {
      if (!activeConnection) {
        return;
      }
      const entries = await invoke<FileDialogEntry[]>("open_file_dialog");
      if (entries.length === 0) {
        return;
      }
      await addPathEntries(entries, currentPath, activeConnection.id, activeConnection.bucketName);
    },
    [activeConnection, addPathEntries, currentPath]
  );

  const onNewFolder = useMemo(
    () => () => {
      const value = window.prompt("Folder name", folderName);
      if (!value) {
        return;
      }
      setFolderName(value);
      void createFolder(value);
    },
    [createFolder, folderName]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#05070d] text-[#f5f8ff] app-background">
      <div className="mx-4 my-4 flex h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-app glass-shell">
        <TitleBar
          search={search}
          onSearch={(value) => {
            setSearch(value);
            setSearchQuery(value);
          }}
          onNewFolder={onNewFolder}
          onUpload={() => {
            void onUpload();
          }}
          onRefresh={() => {
            void refresh();
          }}
          onMinimize={() => {
            void minimizeWindow();
          }}
          onToggleMaximize={() => {
            void toggleMaximizeWindow();
          }}
          onClose={() => {
            void closeToTray();
          }}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-3 p-3">
          <Sidebar onAddConnection={() => undefined} />
          <div className="flex min-h-0 flex-col gap-3">
            <ExplorerView />
            <UploadQueue
              onPickFiles={() => {
                void onUpload();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
