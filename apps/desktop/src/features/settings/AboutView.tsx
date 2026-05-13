interface AboutViewProps {
  onClose: () => void;
}

export function AboutView({ onClose }: AboutViewProps) {
  return (
    <div className="glass-shell w-full max-w-2xl rounded-app p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-app-text">About vor2</h2>
        <button
          type="button"
          className="rounded border border-app-border px-3 py-1 text-xs text-app-text hover:border-accent"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <div className="space-y-3 text-sm text-app-muted">
        <p>
          <span className="font-semibold text-accent">vor2</span> is a{" "}
          <span className="font-semibold text-white">desktop-first Cloudflare R2 explorer</span> made to keep storage
          workflows simple.
        </p>
        <p>
          Core goal: Cloudflare R2 is powerful, but managing files often means opening the Cloudflare dashboard,
          external tools, or direct API calls. <span className="font-semibold text-white">vor2 makes this easier</span>{" "}
          with one app for browsing buckets, uploading files, and copying public URLs quickly.
        </p>
        <p>
          Creator portfolio:{" "}
          <a
            href="http://vorlefan.com/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent underline decoration-accent/70 underline-offset-2"
          >
            vorlefan.com
          </a>
        </p>
        <p>
          Open source and open to collaboration: suggestions, issues, and PRs are welcome at{" "}
          <a
            href="https://github.com/DaxSoft/vor2"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-accent underline decoration-accent/70 underline-offset-2"
          >
            github.com/DaxSoft/vor2
          </a>
          .
        </p>
        <p>
          Version: <span className="font-semibold text-white">beta 0.0.1</span>
        </p>
      </div>
    </div>
  );
}
