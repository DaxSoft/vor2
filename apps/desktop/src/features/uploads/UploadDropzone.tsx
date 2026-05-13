export function UploadDropzone({
  onPickFiles,
  onDropPaths,
  targetPath
}: {
  onPickFiles: () => void;
  onDropPaths?: (paths: string[]) => void;
  targetPath?: string;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-app-border/45 bg-white/[0.04] px-3 py-3 text-xs text-app-muted"
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
        <div>
          <p>Drag and drop files or folders to upload to <span className="text-accent">{targetPath ?? "/"}</span></p>
        </div>
        <button type="button" className="rounded border border-app-border/45 bg-white/[0.05] px-2 py-1 text-[11px] text-app-text" onClick={onPickFiles}>
          Select Files
        </button>
      </div>
    </div>
  );
}
