import type { R2ExplorerNode } from "./explorer.types";
export declare const explorerService: {
    browse(connectionId: string, bucketName: string, path: string, publicUrl?: string): Promise<R2ExplorerNode[]>;
    createFolder(connectionId: string, bucketName: string, path: string, folderName: string): Promise<void>;
};
