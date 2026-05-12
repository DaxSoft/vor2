export interface R2ClientConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface R2ListResult {
  folders: string[];
  files: R2FileItem[];
  prefix: string;
}

export interface R2FileItem {
  key: string;
  name: string;
  sizeBytes: number;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
  mimeType?: string;
}

export interface UploadPolicy {
  maxConcurrentUploads: number;
  retryAttempts: number;
  retryBackoffMs: number[];
}
