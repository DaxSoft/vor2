const encoder = new TextEncoder();

async function importKey(rawKey: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", rawKey, "HKDF", false, ["deriveBits", "deriveKey"]);
}

export async function deriveKey(masterKey: Uint8Array, salt: string, info: string): Promise<CryptoKey> {
  const sourceKey = await importKey(masterKey);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      info: encoder.encode(info)
    },
    sourceKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
