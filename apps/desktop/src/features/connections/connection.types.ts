export interface R2ConnectionSafe {
  id: string;
  provider?: "r2" | "s3";
  name: string;
  bucketName: string;
  endpoint: string;
  publicUrl?: string;
  region: string;
  status: "ACTIVE" | "DISABLED" | "NEEDS_REAUTH" | "ERROR";
  lastConnectedAt?: Date;
  lastSelectedPath: string;
}

export interface R2ConnectionCreateInput {
  provider: "r2" | "s3";
  name: string;
  bucketName: string;
  accountId?: string;
  endpoint: string;
  publicUrl?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface ConnectionStoreState {
  items: R2ConnectionSafe[];
  activeConnectionId: string | null;
  isLoading: boolean;
  hasHydrated: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  createConnection: (input: R2ConnectionCreateInput) => Promise<void>;
  setActiveConnection: (connectionId: string) => void;
}
