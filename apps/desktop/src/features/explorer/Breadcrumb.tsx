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
    <div className="flex items-center gap-2 text-sm text-app-muted">
      <button
        type="button"
        onClick={() => onOpen("/")}
        className="hover:text-app-text"
      >
        <span className="inline-flex items-center gap-1">
          <Folder className="h-3.5 w-3.5" />
          root
        </span>
      </button>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join("/")}`;
        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3" />
            <button
              type="button"
              onClick={() => onOpen(path)}
              className="hover:text-app-text"
            >
              {part}
            </button>
          </div>
        );
      })}
    </div>
  );
}
