import { invoke } from "@tauri-apps/api/core";

export const trayService = {
  async showMainWindow() {
    await invoke("show_main_window");
  },
  async hideMainWindow() {
    await invoke("hide_main_window");
  }
};
