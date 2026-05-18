interface LoadingIndicatorProps {
  text?: string;
  className?: string;
  spinnerClassName?: string;
}

export function LoadingIndicator({
  text = "Loading...",
  className = "",
  spinnerClassName = "",
}: LoadingIndicatorProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 text-xs text-app-muted ${className}`}
    >
      <span
        className={`h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-app-border/40 border-t-accent ${spinnerClassName}`}
        aria-hidden="true"
      />
      <span>{text}</span>
    </span>
  );
}
