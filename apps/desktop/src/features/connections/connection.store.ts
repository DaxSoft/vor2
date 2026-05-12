import { create } from "zustand";
import { connectionService } from "./connection.service";
import { validateConnectionInput } from "./connection.validation";
import type { ConnectionStoreState } from "./connection.types";

export const useConnectionStore = create<ConnectionStoreState>((set, get) => ({
  items: [],
  activeConnectionId: null,
  isLoading: false,
  error: null,
  async hydrate() {
    set({ isLoading: true, error: null });
    try {
      const items = await connectionService.list();
      set({
        items,
        activeConnectionId: items.find((item) => item.status === "ACTIVE")?.id ?? items[0]?.id ?? null,
        isLoading: false
      });
    } catch {
      set({
        error: "Could not connect to this R2 bucket. Check the endpoint, bucket name, and access key permissions.",
        isLoading: false
      });
    }
  },
  async createConnection(input) {
    const validation = validateConnectionInput(input);
    if (validation) {
      set({ error: validation });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const created = await connectionService.create(input);
      const previous = get().items;
      set({ items: [...previous, created], activeConnectionId: created.id, isLoading: false });
      await connectionService.setActive(created.id);
    } catch {
      set({
        error: "Could not connect to this R2 bucket. Check the endpoint, bucket name, and access key permissions.",
        isLoading: false
      });
    }
  },
  setActiveConnection(connectionId) {
    set({ activeConnectionId: connectionId });
    void connectionService.setActive(connectionId);
  }
}));
