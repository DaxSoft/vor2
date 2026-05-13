import {
  FolderPlus,
  Info,
  Minus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Square,
  UploadCloud,
  X
} from "lucide-react";
import logoMark from "@/assets/logo-mark.svg";

export function TitleBar({
  search,
  onSearch,
  onNewFolder,
  onUpload,
  onOpenAbout,
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
  onOpenAbout: () => void;
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
      className="flex items-center gap-3 border-b border-app-border/70 px-4 py-3"
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
      <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
        <img src={logoMark} alt="vor2" className="h-4 w-4" />
        <span className="text-sm font-semibold text-app-text">R2 Explorer</span>
      </div>

      <label data-no-drag="true" className="relative ml-2 max-w-[420px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-soft" />
        <input
          data-no-drag="true"
          aria-label="Search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="blue-focus h-9 w-full rounded-lg border border-app-border/70 bg-white/[0.04] pl-9 pr-16 text-xs text-app-text"
          placeholder="Search files and folders..."
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-app-border/70 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-app-soft">
          Ctrl+F
        </span>
      </label>

      <div className="ml-auto flex items-center gap-2" data-no-drag="true">
        <button
          data-no-drag="true"
          type="button"
          aria-label="New folder"
          className="rounded-lg border border-accent/50 bg-accent-soft px-3 py-1.5 text-xs text-app-text"
          onClick={onNewFolder}
        >
          <FolderPlus className="mr-1 inline h-3.5 w-3.5" />
          New Folder
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Upload"
          className="rounded-lg border border-app-border/70 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onUpload}
        >
          <UploadCloud className="mr-1 inline h-3.5 w-3.5" />
          Upload
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Refresh"
          className="rounded-lg border border-app-border/70 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
          Refresh
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="About"
          className="rounded-lg border border-app-border/60 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onOpenAbout}
        >
          <Info className="mr-1 inline h-3.5 w-3.5" />
          About
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Toggle sidebar"
          className="rounded-lg border border-app-border/70 bg-white/[0.04] px-2 py-1.5 text-xs"
          onClick={onToggleSidebar}
        >
          {sidebarVisible ? <PanelLeftClose className="h-3.5 w-3.5" /> : <PanelLeftOpen className="h-3.5 w-3.5" />}
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="More"
          className="rounded-lg border border-app-border/70 bg-white/[0.04] px-2 py-1.5 text-xs"
          onClick={onOpenSettings}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1" data-no-drag="true">
        <button
          data-no-drag="true"
          type="button"
          aria-label="Minimize"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border hover:text-app-text"
          onClick={onMinimize}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Maximize"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border hover:text-app-text"
          onClick={onToggleMaximize}
        >
          <Square className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Close"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border hover:text-rose-200"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
