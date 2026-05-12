import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { buildPublicUrl, joinObjectKey, toPrefix } from "./path-utils";
import type { R2FileItem, R2ListResult } from "./r2-types";
import { createR2Client } from "./r2-client";
import type { R2ClientConfig } from "./r2-types";

export interface R2ConnectionRuntime extends R2ClientConfig {
  bucketName: string;
  publicUrl?: string;
}

export async function listObjects(connection: R2ConnectionRuntime, currentPath: string): Promise<R2ListResult> {
  const client = createR2Client(connection);
  const prefix = toPrefix(currentPath);
  const result = await client.send(
    new ListObjectsV2Command({
      Bucket: connection.bucketName,
      Prefix: prefix,
      Delimiter: "/"
    })
  );

  const folders = (result.CommonPrefixes ?? [])
    .map((item) => item.Prefix)
    .filter((value): value is string => Boolean(value));

  const files: R2FileItem[] = (result.Contents ?? [])
    .filter((item) => item.Key && item.Key !== prefix && !item.Key.endsWith("/"))
    .map((item) => {
      const key = item.Key as string;
      return {
        key,
        name: key.split("/").at(-1) ?? key,
        sizeBytes: Number(item.Size ?? 0),
        lastModified: item.LastModified,
        etag: item.ETag,
        storageClass: item.StorageClass,
        mimeType: undefined
      };
    });

  return { folders, files, prefix };
}

export async function createFolder(connection: R2ConnectionRuntime, currentPath: string, folderName: string): Promise<void> {
  const client = createR2Client(connection);
  const key = `${joinObjectKey(currentPath, folderName).replace(/\/$/, "")}/`;
  await client.send(
    new PutObjectCommand({
      Bucket: connection.bucketName,
      Key: key,
      Body: ""
    })
  );
}

export async function uploadFile(
  connection: R2ConnectionRuntime,
  objectKey: string,
  file: Blob,
  onProgress?: (loaded: number, total: number) => void
): Promise<string | undefined> {
  const client = createR2Client(connection);
  const upload = new Upload({
    client,
    params: {
      Bucket: connection.bucketName,
      Key: objectKey,
      Body: file
    }
  });

  if (onProgress) {
    upload.on("httpUploadProgress", (event) => {
      onProgress(Number(event.loaded ?? 0), Number(event.total ?? 0));
    });
  }

  await upload.done();
  return buildPublicUrl(connection.publicUrl, objectKey);
}

export async function renameObject(
  connection: R2ConnectionRuntime,
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const client = createR2Client(connection);
  await client.send(
    new CopyObjectCommand({
      Bucket: connection.bucketName,
      CopySource: `${connection.bucketName}/${sourceKey}`,
      Key: destinationKey
    })
  );
  await client.send(
    new DeleteObjectCommand({
      Bucket: connection.bucketName,
      Key: sourceKey
    })
  );
}

export async function downloadObject(connection: R2ConnectionRuntime, key: string): Promise<Blob | null> {
  const client = createR2Client(connection);
  const response = await client.send(
    new GetObjectCommand({
      Bucket: connection.bucketName,
      Key: key
    })
  );
  if (!response.Body) {
    return null;
  }
  return response.Body.transformToWebStream
    ? new Response(response.Body.transformToWebStream()).blob()
    : null;
}

export async function deleteObject(connection: R2ConnectionRuntime, key: string): Promise<void> {
  const client = createR2Client(connection);
  await client.send(
    new DeleteObjectCommand({
      Bucket: connection.bucketName,
      Key: key
    })
  );
}
