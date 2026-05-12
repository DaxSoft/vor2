import { useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TitleBar } from "./TitleBar";
import { ExplorerView } from "@/features/explorer/ExplorerView";
import { UploadQueue } from "@/features/uploads/UploadQueue";
import { useExplorerStore } from "@/features/explorer/explorer.store";

export function AppShell() {
  const setSearchQuery = useExplorerStore((state) => state.setSearchQuery);
  const createFolder = useExplorerStore((state) => state.createFolder);
  const refresh = useExplorerStore((state) => state.refresh);
  const [search, setSearch] = useState("");
  const [folderName, setFolderName] = useState("New folder");

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
          onUpload={() => undefined}
          onRefresh={() => {
            void refresh();
          }}
        />

        <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr] gap-3 p-3">
          <Sidebar onAddConnection={() => undefined} />
          <div className="flex min-h-0 flex-col gap-3">
            <ExplorerView />
            <UploadQueue />
          </div>
        </div>
      </div>
    </div>
  );
}
