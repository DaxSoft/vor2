import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";

interface AppSettingsState {
  startMinimizedToTray: boolean;
  closeToTray: boolean;
  launchAtStartup: boolean;
  isLoading: boolean;
  error: string | null;
  sidebarWidth: number;
  detailsPanelVisible: boolean;
  uploadPanelVisible: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<Pick<AppSettingsState, "startMinimizedToTray" | "closeToTray" | "launchAtStartup">>) => Promise<void>;
  setSidebarWidth: (width: number) => void;
  setDetailsPanelVisible: (visible: boolean) => void;
  setUploadPanelVisible: (visible: boolean) => void;
}

interface AppSettingsDto {
  startMinimizedToTray: boolean;
  closeToTray: boolean;
  launchAtStartup: boolean;
}

export const useUiStore = create<AppSettingsState>((set, get) => ({
  startMinimizedToTray: true,
  closeToTray: true,
  launchAtStartup: false,
  isLoading: false,
  error: null,
  sidebarWidth: 284,
  detailsPanelVisible: true,
  uploadPanelVisible: true,
  async hydrate() {
    set({ isLoading: true, error: null });
    try {
      const result = await invoke<AppSettingsDto>("get_app_settings");
      set({ ...result, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load settings.";
      set({ isLoading: false, error: message });
    }
  },
  async updateSettings(patch) {
    const state = get();
    const payload: AppSettingsDto = {
      startMinimizedToTray: patch.startMinimizedToTray ?? state.startMinimizedToTray,
      closeToTray: patch.closeToTray ?? state.closeToTray,
      launchAtStartup: patch.launchAtStartup ?? state.launchAtStartup
    };

    set({ ...payload, isLoading: true, error: null });
    try {
      const result = await invoke<AppSettingsDto>("update_app_settings", { input: payload });
      await invoke("set_startup_enabled", { enabled: result.launchAtStartup });
      set({ ...result, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save settings.";
      set({ isLoading: false, error: message });
    }
  },
  setSidebarWidth(width) {
    set({ sidebarWidth: width });
  },
  setDetailsPanelVisible(visible) {
    set({ detailsPanelVisible: visible });
  },
  setUploadPanelVisible(visible) {
    set({ uploadPanelVisible: visible });
  }
}));
