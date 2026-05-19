import { ChevronRight, Folder } from "lucide-react";

export function Breadcrumb({
  currentPath,
  onOpen,
}: {
  currentPath: string;
  onOpen: (path: string) => void;
}) {
  const parts = currentPath.replace(/^\//, "").split("/").filter(Boolean);

  return (
    <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-app-muted">
      <button
        type="button"
        onClick={() => onOpen("/")}
        className="shrink-0 hover:text-app-text"
      >
        <span className="inline-flex items-center gap-1">
          <Folder className="h-3.5 w-3.5" />
          root
        </span>
      </button>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join("/")}`;
        return (
          <div key={path} className="flex min-w-0 items-center gap-2">
            <ChevronRight className="h-3 w-3 shrink-0" />
            <button
              type="button"
              onClick={() => onOpen(path)}
              className="min-w-0 max-w-40 truncate hover:text-app-text"
              title={part}
            >
              {part}
            </button>
          </div>
        );
      })}
    </div>
  );
}
