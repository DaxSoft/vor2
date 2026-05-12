import { Settings } from "lucide-react";
import { ConnectionSwitcher } from "@/features/connections/ConnectionSwitcher";

export function Sidebar({ onAddConnection }: { onAddConnection: () => void }) {
  return (
    <aside className="glass-panel rounded-panel border border-app-border p-3">
      <ConnectionSwitcher onAddConnection={onAddConnection} />

      <div className="mt-4 rounded-lg border border-app-border bg-white/5 p-3">
        <p className="text-xs text-app-muted">Storage Usage</p>
        <p className="mt-1 text-sm font-semibold text-app-text">R2 Bucket</p>
      </div>

      <button type="button" className="mt-4 inline-flex items-center gap-2 text-xs text-app-muted hover:text-app-text">
        <Settings className="h-4 w-4" />
        Settings
      </button>
    </aside>
  );
}
