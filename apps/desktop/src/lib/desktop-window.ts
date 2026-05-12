import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";

export function isDesktopRuntime(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  if ("__TAURI_INTERNALS__" in window) {
    return true;
  }
  return navigator.userAgent.includes("Tauri");
}

export async function minimizeWindow(): Promise<void> {
  if (!isDesktopRuntime()) {
    return;
  }
  await getCurrentWindow().minimize();
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (!isDesktopRuntime()) {
    return;
  }
  await getCurrentWindow().toggleMaximize();
}

export async function closeToTray(): Promise<void> {
  if (!isDesktopRuntime()) {
    return;
  }
  await invoke("hide_main_window");
}
