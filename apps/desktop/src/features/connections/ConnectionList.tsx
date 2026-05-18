import { useConnectionStore } from "./connection.store";
import { Cloud, Database } from "lucide-react";

export function ConnectionList() {
  const items = useConnectionStore((state) => state.items);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-app-border bg-white/10 px-3 py-2 text-xs backdrop-blur-xl">
          <div className="flex items-center gap-2 font-medium text-app-text">
            {item.provider === "s3" ? <Database className="h-3.5 w-3.5 text-amber-300" /> : <Cloud className="h-3.5 w-3.5 text-accent" />}
            {item.name}
          </div>
          <div className="text-app-soft">{item.bucketName}</div>
        </div>
      ))}
    </div>
  );
}
