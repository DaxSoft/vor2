import { FolderPlus, Minus, MoreHorizontal, PanelLeftClose, PanelLeftOpen, RefreshCw, Search, Square, UploadCloud, X } from "lucide-react";
import logoMark from "@/assets/logo-mark.svg";

export function TitleBar({
  search,
  onSearch,
  onNewFolder,
  onUpload,
  onRefresh,
  onOpenSettings,
  onToggleSidebar,
  sidebarVisible,
  onMinimize,
  onToggleMaximize,
  onClose,
  onStartDragging
}: {
  search: string;
  onSearch: (value: string) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  onStartDragging: () => void;
}) {
  return (
    <header
      className="flex items-center gap-3 border-b border-app-border px-4 py-3"
      onMouseDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        const target = event.target as HTMLElement;
        if (target.closest("[data-no-drag='true']")) {
          return;
        }
        onStartDragging();
      }}
    >
      <div className="flex items-center gap-2" data-no-drag="true">
        <img src={logoMark} alt="R2 Explorer" className="h-4 w-4" />
        <span className="text-sm font-semibold text-app-text">R2 Explorer</span>
      </div>

      <label data-no-drag="true" className="relative ml-2 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-soft" />
        <input
          data-no-drag="true"
          aria-label="Search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="blue-focus h-9 w-full rounded-lg border border-app-border bg-white/5 pl-9 pr-3 text-xs text-app-text"
          placeholder="Search files and folders"
        />
      </label>

      <div className="flex items-center gap-2" data-no-drag="true">
        <button data-no-drag="true" type="button" aria-label="New folder" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onNewFolder}>
          <FolderPlus className="mr-1 inline h-3.5 w-3.5" />
          New Folder
        </button>
        <button data-no-drag="true" type="button" aria-label="Upload" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onUpload}>
          <UploadCloud className="mr-1 inline h-3.5 w-3.5" />
          Upload
        </button>
        <button data-no-drag="true" type="button" aria-label="Refresh" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Toggle sidebar"
          className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs"
          onClick={onToggleSidebar}
        >
          {sidebarVisible ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        </button>
        <button data-no-drag="true" type="button" aria-label="More" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onOpenSettings}>
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="ml-2 flex items-center gap-1" data-no-drag="true">
        <button data-no-drag="true" type="button" aria-label="Minimize" className="rounded border border-app-border p-1 text-app-muted hover:text-app-text" onClick={onMinimize}>
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button data-no-drag="true" type="button" aria-label="Maximize" className="rounded border border-app-border p-1 text-app-muted hover:text-app-text" onClick={onToggleMaximize}>
          <Square className="h-3.5 w-3.5" />
        </button>
        <button data-no-drag="true" type="button" aria-label="Close" className="rounded border border-app-border p-1 text-rose-300 hover:text-rose-200" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
