import { useConnectionStore } from "./connection.store";

export function ConnectionList() {
  const items = useConnectionStore((state) => state.items);
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-app-border bg-white/5 px-3 py-2 text-xs">
          <div className="font-medium text-app-text">{item.name}</div>
          <div className="text-app-soft">{item.bucketName}</div>
        </div>
      ))}
    </div>
  );
}
