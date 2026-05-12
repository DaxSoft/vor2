import type { R2ConnectionCreateInput, R2ConnectionSafe } from "./connection.types";
export declare const connectionService: {
    list(): Promise<R2ConnectionSafe[]>;
    create(input: R2ConnectionCreateInput): Promise<R2ConnectionSafe>;
    setActive(connectionId: string): Promise<void>;
};
