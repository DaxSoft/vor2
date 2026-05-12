import type { DragEvent } from "react";

export function UploadDropzone({
  onFiles
}: {
  onFiles: (files: File[]) => void;
}) {
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    if (files.length) {
      onFiles(files);
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      className="rounded-lg border border-dashed border-app-border bg-white/5 px-3 py-3 text-xs text-app-muted"
    >
      Drag and drop files to upload
    </div>
  );
}
