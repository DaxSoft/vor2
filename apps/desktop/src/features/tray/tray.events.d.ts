import type { TrayMenuAction } from "./tray.types";
export declare function bindTrayEvents(onAction: (action: TrayMenuAction) => void): Promise<[import("@tauri-apps/api/event").UnlistenFn]>;
