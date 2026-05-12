import { S3Client } from "@aws-sdk/client-s3";
import type { R2ClientConfig } from "./r2-types";

export function createR2Client(config: R2ClientConfig): S3Client {
  return new S3Client({
    region: config.region || "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
  });
}
