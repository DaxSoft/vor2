import { ChevronRight } from "lucide-react";

export function Breadcrumb({ currentPath, onOpen }: { currentPath: string; onOpen: (path: string) => void }) {
  const parts = currentPath.replace(/^\//, "").split("/").filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-xs text-app-muted">
      <button type="button" onClick={() => onOpen("/")} className="hover:text-app-text">
        root
      </button>
      {parts.map((part, index) => {
        const path = `/${parts.slice(0, index + 1).join("/")}`;
        return (
          <div key={path} className="flex items-center gap-2">
            <ChevronRight className="h-3 w-3" />
            <button type="button" onClick={() => onOpen(path)} className="hover:text-app-text">
              {part}
            </button>
          </div>
        );
      })}
    </div>
  );
}
