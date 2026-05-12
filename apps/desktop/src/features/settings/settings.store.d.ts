interface UiState {
    sidebarWidth: number;
    detailsPanelVisible: boolean;
    uploadPanelVisible: boolean;
    setSidebarWidth: (width: number) => void;
    setDetailsPanelVisible: (visible: boolean) => void;
    setUploadPanelVisible: (visible: boolean) => void;
}
export declare const useUiStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UiState>>;
export {};
