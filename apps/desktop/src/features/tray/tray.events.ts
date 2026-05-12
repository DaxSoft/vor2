import { listen } from "@tauri-apps/api/event";
import type { TrayMenuAction } from "./tray.types";

export function bindTrayEvents(onAction: (action: TrayMenuAction) => void) {
  return Promise.all([
    listen<TrayMenuAction>("tray-action", (event) => {
      onAction(event.payload);
    })
  ]);
}
