export function UploadDropzone({
  onPickFiles
}: {
  onPickFiles: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-dashed border-app-border bg-white/5 px-3 py-3 text-xs text-app-muted"
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
