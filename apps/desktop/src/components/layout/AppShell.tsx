import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ExplorerView } from "@/features/explorer/ExplorerView";
import { UploadQueue } from "@/features/uploads/UploadQueue";
import { ConnectionForm } from "@/features/connections/ConnectionForm";
import { useExplorerStore } from "@/features/explorer/explorer.store";
import { useConnectionStore } from "@/features/connections/connection.store";
import { useUploadStore } from "@/features/uploads/upload.store";
import { SettingsView } from "@/features/settings/SettingsView";
import { AboutView } from "@/features/settings/AboutView";
import { bindTrayEvents } from "@/features/tray/tray.events";
import {
  closeToTray,
  minimizeWindow,
  toggleMaximizeWindow,
} from "@/lib/desktop-window";

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
  const setActiveExplorerConnection = useExplorerStore(
    (state) => state.setActiveConnection,
  );
  const currentPath = useExplorerStore((state) => state.currentPath);
  const activeConnectionId = useConnectionStore(
    (state) => state.activeConnectionId,
  );
  const connections = useConnectionStore((state) => state.items);
  const addPathEntries = useUploadStore((state) => state.addPathEntries);
  const pauseAll = useUploadStore((state) => state.pauseAll);
  const resumeAll = useUploadStore((state) => state.resumeAll);
  const isQueuePaused = useUploadStore((state) => state.isPaused);
  const uploadTasks = useUploadStore((state) => state.tasks);
  const isQueueVisible = useUploadStore((state) => state.isQueueVisible);
  const setQueueVisible = useUploadStore((state) => state.setQueueVisible);
  const [search, setSearch] = useState("");
  const [folderName, setFolderName] = useState("New folder");
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const activeConnection =
    connections.find((item) => item.id === activeConnectionId) ?? null;

  useEffect(() => {
    if (!activeConnection) {
      return;
    }
    setActiveExplorerConnection(
      activeConnection.id,
      activeConnection.bucketName,
      activeConnection.publicUrl,
    );
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
        return;
      }
      if (action === "settings") {
        setShowSettings(true);
        return;
      }
      if (action === "connections") {
        setShowConnectionForm(true);
      }
    }).then((items) => {
      unsubscribers.push(...items);
    });

    void getCurrentWindow()
      .onDragDropEvent(async (event) => {
        if (event.payload.type !== "drop") {
          return;
        }
        if (!activeConnection) {
          return;
        }
        setQueueVisible(true);
        const entries = await invoke<FileDialogEntry[]>("inspect_file_paths", {
          paths: event.payload.paths,
        });
        await addPathEntries(
          entries,
          currentPath,
          activeConnection.id,
          activeConnection.bucketName,
        );
        await refresh();
      })
      .then((unlisten) => {
        unsubscribers.push(unlisten);
      });

    return () => {
      for (const unlisten of unsubscribers) {
        unlisten();
      }
    };
  }, [
    activeConnection,
    addPathEntries,
    currentPath,
    isQueuePaused,
    pauseAll,
    refresh,
    resumeAll,
    setQueueVisible,
  ]);

  const onUpload = useMemo(
    () => async () => {
      if (!activeConnection) {
        return;
      }
      setQueueVisible(true);
      const entries = await invoke<FileDialogEntry[]>("open_file_dialog");
      if (entries.length === 0) {
        return;
      }
      await addPathEntries(
        entries,
        currentPath,
        activeConnection.id,
        activeConnection.bucketName,
      );
      await refresh();
    },
    [activeConnection, addPathEntries, currentPath, refresh, setQueueVisible],
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
    [createFolder, folderName],
  );

  return (
    <div
      data-tauri-drag-region
      className="h-screen w-screen overflow-hidden text-[#f5f8ff] app-background"
    >
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
          onOpenAbout={() => {
            setShowAbout(true);
          }}
          onRefresh={() => {
            void refresh();
          }}
          onOpenSettings={() => {
            setShowSettings(true);
          }}
          onToggleSidebar={() => {
            setSidebarVisible((value) => !value);
          }}
          sidebarVisible={sidebarVisible}
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

        <div
          className={`grid min-h-0 flex-1 gap-3 p-3 ${sidebarVisible ? "grid-cols-[320px_1fr]" : "grid-cols-1"}`}
        >
          {sidebarVisible ? (
            <Sidebar
              onAddConnection={() => {
                setShowConnectionForm(true);
              }}
              onOpenSettings={() => {
                setShowSettings(true);
              }}
            />
          ) : null}
          <div className="flex min-h-0 flex-col gap-3">
            <ExplorerView
              onUpload={() => {
                void onUpload();
              }}
              onNewFolder={onNewFolder}
            />
            {isQueueVisible || uploadTasks.length > 0 ? (
              <UploadQueue
                onPickFiles={() => {
                  void onUpload();
                }}
                onDropPaths={(paths) => {
                  if (!activeConnection) {
                    return;
                  }
                  void invoke<FileDialogEntry[]>("inspect_file_paths", {
                    paths,
                  }).then(async (entries) => {
                    await addPathEntries(
                      entries,
                      currentPath,
                      activeConnection.id,
                      activeConnection.bucketName,
                    );
                    await refresh();
                  });
                }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {showSettings ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <SettingsView
            onClose={() => {
              setShowSettings(false);
            }}
          />
        </div>
      ) : null}

      {showAbout ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <AboutView
            onClose={() => {
              setShowAbout(false);
            }}
          />
        </div>
      ) : null}

      {showConnectionForm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4">
          <div className="glass-shell w-full max-w-xl rounded-app p-6">
            <ConnectionForm
              onCreated={() => {
                setShowConnectionForm(false);
              }}
            />
            <button
              type="button"
              className="mt-3 w-full rounded border border-app-border px-3 py-2 text-xs text-app-text hover:border-accent"
              onClick={() => {
                setShowConnectionForm(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
