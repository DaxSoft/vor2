import {
  FolderPlus,
  Info,
  Minus,
  Moon,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  Square,
  Sun,
  UploadCloud,
  X,
} from "lucide-react";
import logoMark from "@/assets/logo-mark.svg";
import { DashboardBackgroundImage } from "@vor2/ui/src/primitives/default-background";

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
  theme,
  onToggleTheme,
  onMinimize,
  onToggleMaximize,
  onClose,
  onStartDragging,
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
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
  onStartDragging: () => void;
}) {
  return (
    <header
      data-tauri-drag-region
      className="flex items-center gap-3 border-b border-app-border/20 px-4 py-3 relative"
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
      <DashboardBackgroundImage
        url="https://r2.travelerspentales.com/files/bg-1.png"
        opacity={0.8}
      />

      <div data-tauri-drag-region className="flex items-center gap-2">
        <img src={logoMark} alt="vor2" className="h-8 w-8" />
        <span
          data-tauri-drag-region
          className="text-sm font-semibold text-app-text"
        >
          vor2
        </span>
      </div>

      <label
        data-no-drag="true"
        data-tauri-drag-region="false"
        className="relative ml-2 max-w-[420px] flex-1"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-soft" />
        <input
          data-no-drag="true"
          aria-label="Search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="blue-focus h-9 w-full rounded-lg border border-app-border/20 bg-white/[0.04] pl-9 pr-16 text-sm text-app-text"
          placeholder="Search files and folders..."
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-app-border/20 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-app-soft">
          Ctrl+F
        </span>
      </label>

      <div
        className="ml-auto flex items-center gap-2"
        data-no-drag="true"
        data-tauri-drag-region="false"
      >
        <button
          data-no-drag="true"
          type="button"
          aria-label="New folder"
          className="rounded-lg border border-app-border/20 bg-accent-soft px-3 py-1.5 text-xs text-app-text"
          onClick={onNewFolder}
        >
          <FolderPlus className="mr-1 inline h-3.5 w-3.5" />
          New Folder
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Upload"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onUpload}
        >
          <UploadCloud className="mr-1 inline h-3.5 w-3.5" />
          Upload
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Refresh"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onRefresh}
        >
          <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
          Refresh
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="About"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-1.5 text-xs"
          onClick={onOpenAbout}
        >
          <Info className="mr-1 inline h-3.5 w-3.5" />
          About
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Toggle sidebar"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-2 py-1.5 text-xs"
          onClick={onToggleSidebar}
        >
          {sidebarVisible ? (
            <PanelLeftClose className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="More"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-2 py-1.5 text-xs"
          onClick={onOpenSettings}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Toggle theme"
          className="rounded-lg border border-app-border/20 bg-white/[0.04] px-2 py-1.5 text-xs"
          onClick={onToggleTheme}
        >
          {theme === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      <div
        className="flex items-center gap-1"
        data-no-drag="true"
        data-tauri-drag-region="false"
      >
        <button
          data-no-drag="true"
          type="button"
          aria-label="Minimize"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border/20 hover:text-app-text"
          onClick={onMinimize}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Maximize"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border/20 hover:text-app-text"
          onClick={onToggleMaximize}
        >
          <Square className="h-3.5 w-3.5" />
        </button>
        <button
          data-no-drag="true"
          type="button"
          aria-label="Close"
          className="rounded border border-transparent p-1 text-app-muted hover:border-app-border/20 hover:text-rose-200"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
