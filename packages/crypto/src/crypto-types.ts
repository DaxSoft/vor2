export interface EncryptedSecretEnvelope {
  version: 1;
  algorithm: "AES-256-GCM";
  ciphertext: string;
  iv: string;
  tag: string;
}

export interface R2SecretPayload {
  accessKeyId: string;
  secretAccessKey: string;
}
