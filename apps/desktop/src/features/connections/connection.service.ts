import { invoke } from "@tauri-apps/api/core";
import type { R2ConnectionCreateInput, R2ConnectionSafe } from "./connection.types";

export const connectionService = {
  async list(): Promise<R2ConnectionSafe[]> {
    return invoke<R2ConnectionSafe[]>("list_connections");
  },

  async create(input: R2ConnectionCreateInput): Promise<R2ConnectionSafe> {
    return invoke<R2ConnectionSafe>("create_connection", { input });
  },

  async setActive(connectionId: string): Promise<void> {
    await invoke("set_active_connection", { connectionId });
  },

  async getBucketUsage(connectionId: string, bucketName: string): Promise<{ objectCount: number; totalSizeBytes: number; source?: string }> {
    return invoke("get_bucket_usage", { connectionId, bucketName });
  }
};
