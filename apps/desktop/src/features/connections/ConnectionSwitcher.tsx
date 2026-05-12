import { Check, ChevronDown, Plus } from "lucide-react";
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
        className="blue-focus flex w-full items-center justify-between rounded-xl border border-app-border bg-white/5 px-3 py-2 text-sm"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{active?.name ?? "Select connection"}</span>
        <ChevronDown className="h-4 w-4 text-app-muted" />
      </button>

      {open ? (
        <div className="glass-panel absolute z-30 mt-2 w-full rounded-xl border border-app-border p-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs hover:bg-accent-soft"
              onClick={() => {
                setActiveConnection(item.id);
                setOpen(false);
              }}
            >
              <span className="truncate">{item.name}</span>
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
