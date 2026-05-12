import type { R2ConnectionCreateInput } from "./connection.types";

export function validateConnectionInput(input: R2ConnectionCreateInput): string | null {
  if (!input.name.trim()) {
    return "Connection name is required.";
  }
  if (!input.bucketName.trim()) {
    return "Bucket name is required.";
  }
  if (!input.endpoint.trim()) {
    return "Endpoint is required.";
  }
  if (!input.accessKeyId.trim() || !input.secretAccessKey.trim()) {
    return "Access Key ID and Secret Access Key are required.";
  }
  return null;
}
