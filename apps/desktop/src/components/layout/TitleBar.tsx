import { Cloud, FolderPlus, Minus, MoreHorizontal, RefreshCw, Search, Square, UploadCloud, X } from "lucide-react";

export function TitleBar({
  search,
  onSearch,
  onNewFolder,
  onUpload,
  onRefresh
}: {
  search: string;
  onSearch: (value: string) => void;
  onNewFolder: () => void;
  onUpload: () => void;
  onRefresh: () => void;
}) {
  return (
    <header data-tauri-drag-region className="flex items-center gap-3 border-b border-app-border px-4 py-3">
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold text-app-text">R2 Explorer</span>
      </div>

      <label className="relative ml-2 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-soft" />
        <input
          aria-label="Search"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          className="blue-focus h-9 w-full rounded-lg border border-app-border bg-white/5 pl-9 pr-3 text-xs text-app-text"
          placeholder="Search files and folders"
        />
      </label>

      <div className="flex items-center gap-2">
        <button type="button" aria-label="New folder" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onNewFolder}>
          <FolderPlus className="mr-1 inline h-3.5 w-3.5" />
          New Folder
        </button>
        <button type="button" aria-label="Upload" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onUpload}>
          <UploadCloud className="mr-1 inline h-3.5 w-3.5" />
          Upload
        </button>
        <button type="button" aria-label="Refresh" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="More" className="rounded-lg border border-app-border bg-white/5 px-2 py-1.5 text-xs">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="ml-2 flex items-center gap-1">
        <button type="button" aria-label="Minimize" className="rounded border border-app-border p-1 text-app-muted hover:text-app-text">
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Maximize" className="rounded border border-app-border p-1 text-app-muted hover:text-app-text">
          <Square className="h-3.5 w-3.5" />
        </button>
        <button type="button" aria-label="Close" className="rounded border border-app-border p-1 text-rose-300 hover:text-rose-200">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
