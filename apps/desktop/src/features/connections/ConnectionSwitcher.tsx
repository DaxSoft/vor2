import { Check, ChevronDown, Cloud, Database, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useConnectionStore } from "./connection.store";

export function ConnectionSwitcher({ onAddConnection }: { onAddConnection: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = useConnectionStore((state) => state.items);
  const activeConnectionId = useConnectionStore((state) => state.activeConnectionId);
  const setActiveConnection = useConnectionStore((state) => state.setActiveConnection);

  const active = useMemo(
    () => items.find((item) => item.id === activeConnectionId) ?? null,
    [activeConnectionId, items]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) {
        return;
      }
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Connection switcher"
        className="blue-focus flex w-full items-center justify-between rounded-xl border border-app-border bg-white/10 px-3 py-2 text-sm backdrop-blur-xl"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          {active?.provider === "s3" ? <Database className="h-3.5 w-3.5 text-amber-300" /> : <Cloud className="h-3.5 w-3.5 text-accent" />}
          <span className="truncate">{active?.name ?? "Select connection"}</span>
        </span>
        <ChevronDown className="h-4 w-4 text-app-muted" />
      </button>

      {open ? (
        <div className="glass-panel absolute z-30 mt-2 w-full rounded-xl border border-app-border p-2 backdrop-blur-2xl">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-white/5 bg-white/5 px-2 py-2 text-left text-xs backdrop-blur-xl hover:bg-accent-soft"
              onClick={() => {
                setActiveConnection(item.id);
                setOpen(false);
              }}
            >
              <span className="flex min-w-0 items-center gap-2">
                {item.provider === "s3" ? <Database className="h-3.5 w-3.5 text-amber-300" /> : <Cloud className="h-3.5 w-3.5 text-accent" />}
                <span className="truncate">{item.name}</span>
              </span>
              {item.id === activeConnectionId ? <Check className="h-4 w-4 text-accent" /> : null}
            </button>
          ))}

          <button
            type="button"
            className="mt-2 flex w-full items-center gap-2 rounded-lg border border-app-border px-2 py-2 text-xs hover:border-accent"
            onClick={() => {
              onAddConnection();
              setOpen(false);
            }}
          >
            <Plus className="h-4 w-4" />
            Add connection
          </button>
        </div>
      ) : null}
    </div>
  );
}
