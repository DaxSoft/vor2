export function UploadDropzone({
  onPickFiles,
  onDropPaths
}: {
  onPickFiles: () => void;
  onDropPaths?: (paths: string[]) => void;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-app-border bg-white/5 px-3 py-3 text-xs text-app-muted"
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDrop={(event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer?.files ?? []);
        const paths = files
          .map((file) => (file as unknown as { path?: string }).path)
          .filter((value): value is string => Boolean(value));
        if (paths.length > 0) {
          onDropPaths?.(paths);
        }
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span>Drag and drop files from Windows Explorer into this window</span>
        <button type="button" className="rounded border border-app-border px-2 py-1 text-[11px] text-app-text" onClick={onPickFiles}>
          Select Files
        </button>
      </div>
    </div>
  );
}
