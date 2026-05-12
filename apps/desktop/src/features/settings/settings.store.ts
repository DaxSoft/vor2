import { create } from "zustand";

interface UiState {
  sidebarWidth: number;
  detailsPanelVisible: boolean;
  uploadPanelVisible: boolean;
  setSidebarWidth: (width: number) => void;
  setDetailsPanelVisible: (visible: boolean) => void;
  setUploadPanelVisible: (visible: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarWidth: 284,
  detailsPanelVisible: true,
  uploadPanelVisible: true,
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
