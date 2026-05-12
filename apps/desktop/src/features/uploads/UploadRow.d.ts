import type { UploadTask } from "./upload.types";
export declare function UploadRow({ task, onPause, onCancel, onRetry }: {
    task: UploadTask;
    onPause: () => void;
    onCancel: () => void;
    onRetry: () => void;
}): import("react/jsx-runtime").JSX.Element;
