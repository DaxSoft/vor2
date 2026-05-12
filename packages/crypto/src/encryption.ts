import { deriveKey } from "./key-derivation";
import type { EncryptedSecretEnvelope } from "./crypto-types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(value, "base64"));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptSecret(
  value: string,
  masterKey: Uint8Array,
  salt: string,
  info: string
): Promise<EncryptedSecretEnvelope> {
  const key = await deriveKey(masterKey, salt, info);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      key,
      encoder.encode(value)
    )
  );
  const tag = encrypted.slice(encrypted.length - 16);
  const ciphertext = encrypted.slice(0, encrypted.length - 16);

  return {
    version: 1,
    algorithm: "AES-256-GCM",
    ciphertext: toBase64(ciphertext),
    iv: toBase64(iv),
    tag: toBase64(tag)
  };
}

export async function decryptSecret(
  envelope: EncryptedSecretEnvelope,
  masterKey: Uint8Array,
  salt: string,
  info: string
): Promise<string> {
  const key = await deriveKey(masterKey, salt, info);
  const iv = fromBase64(envelope.iv);
  const ciphertext = fromBase64(envelope.ciphertext);
  const tag = fromBase64(envelope.tag);

  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    combined
  );

  return decoder.decode(decrypted);
}
