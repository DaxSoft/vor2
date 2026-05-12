import type { R2ExplorerNode } from "./explorer.types";
interface RawListing {
    folders: Array<{
        key: string;
        name: string;
        childCount?: number;
    }>;
    files: Array<{
        key: string;
        name: string;
        sizeBytes: number;
        mimeType?: string;
        lastModified?: string;
        etag?: string;
        storageClass?: string;
    }>;
}
export declare function mapListingToNodes(listing: RawListing, publicUrl?: string): R2ExplorerNode[];
export {};
