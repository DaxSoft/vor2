import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { CopyObjectCommand, DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { prisma } from "./client";

type Json = Record<string, unknown>;

function getOsDataDir(): string {
  const home = os.homedir();
  if (process.platform === "win32") return process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");
  if (process.platform === "darwin") return path.join(home, "Library", "Application Support");
  return process.env.XDG_DATA_HOME ?? path.join(home, ".local", "share");
}

const appDir = path.join(getOsDataDir(), "vor2");
const sessionPath = path.join(appDir, "session.json");
const masterKeysPath = path.join(appDir, "master-keys.json");
fs.mkdirSync(appDir, { recursive: true });

function out(value: unknown): never {
  process.stdout.write(`${JSON.stringify({ ok: true, data: value })}\n`);
  process.exit(0);
}

function fail(message: string): never {
  process.stdout.write(`${JSON.stringify({ ok: false, error: message })}\n`);
  process.exit(1);
}

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function nowPlusDaysIso(days: number): string {
  const date = new Date(Date.now() + days * 86400000);
  return date.toISOString();
}

function hashPassword(password: string, saltHex: string): string {
  return crypto.createHash("sha256").update(Buffer.from(saltHex, "hex")).update(password).digest("hex");
}

function readSession(): { userId: string } | null {
  if (!fs.existsSync(sessionPath)) return null;
  return JSON.parse(fs.readFileSync(sessionPath, "utf8")) as { userId: string };
}

function writeSession(userId: string): void {
  fs.writeFileSync(sessionPath, JSON.stringify({ userId }), "utf8");
}

function clearSessionFile(): void {
  if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
}

function readMasterKeys(): Record<string, string> {
  if (!fs.existsSync(masterKeysPath)) return {};
  return JSON.parse(fs.readFileSync(masterKeysPath, "utf8")) as Record<string, string>;
}

function getOrCreateMasterKey(userId: string): Buffer {
  const keys = readMasterKeys();
  if (keys[userId]) return Buffer.from(keys[userId], "base64");
  const generated = crypto.randomBytes(32);
  keys[userId] = generated.toString("base64");
  fs.writeFileSync(masterKeysPath, JSON.stringify(keys), "utf8");
  return generated;
}

function deleteMasterKey(userId: string): void {
  const keys = readMasterKeys();
  delete keys[userId];
  fs.writeFileSync(masterKeysPath, JSON.stringify(keys), "utf8");
}

function deriveKey(masterKey: Buffer, userId: string, connectionId: string): Buffer {
  return crypto.hkdfSync("sha256", masterKey, Buffer.alloc(0), Buffer.from(`${userId}:${connectionId}`), 32);
}

function encryptSecret(masterKey: Buffer, userId: string, connectionId: string, value: string): { ciphertext: string; iv: string; tag: string } {
  const key = deriveKey(masterKey, userId, connectionId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { ciphertext: ciphertext.toString("base64"), iv: iv.toString("base64"), tag: tag.toString("base64") };
}

function decryptSecret(masterKey: Buffer, userId: string, connectionId: string, ciphertext: string, iv: string, tag: string): string {
  const key = deriveKey(masterKey, userId, connectionId);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]);
  return plaintext.toString("utf8");
}

function makeClient(endpoint: string, region: string, accessKeyId: string, secretAccessKey: string): S3Client {
  return new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey }
  });
}

async function listAllObjects(client: S3Client, bucket: string, prefix: string): Promise<Array<{ key: string; size: number }>> {
  const items: Array<{ key: string; size: number }> = [];
  let continuationToken: string | undefined;

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    );

    for (const item of response.Contents ?? []) {
      if (!item.Key || item.Key.endsWith("/")) {
        continue;
      }
      items.push({
        key: item.Key,
        size: Number(item.Size ?? 0)
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items;
}

async function getGraphQlBucketUsage(accountId: string, bucketName: string): Promise<{ objectCount: number; totalSizeBytes: number } | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
  if (!token) {
    return null;
  }

  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const query = `
    query R2StorageUsage($accountTag: string!, $bucketName: string!, $startDate: Time, $endDate: Time) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2StorageAdaptiveGroups(
            limit: 1
            filter: {
              datetime_geq: $startDate
              datetime_leq: $endDate
              bucketName: $bucketName
            }
            orderBy: [datetime_DESC]
          ) {
            max {
              objectCount
              payloadSize
              metadataSize
            }
          }
        }
      }
    }
  `;

  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: {
        accountTag: accountId,
        bucketName,
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json() as {
    data?: {
      viewer?: {
        accounts?: Array<{
          r2StorageAdaptiveGroups?: Array<{
            max?: { objectCount?: number; payloadSize?: number; metadataSize?: number };
          }>;
        }>;
      };
    };
  };

  const group = data.data?.viewer?.accounts?.[0]?.r2StorageAdaptiveGroups?.[0];
  if (!group?.max) {
    return null;
  }
  const objectCount = Number(group.max.objectCount ?? 0);
  const payloadSize = Number(group.max.payloadSize ?? 0);
  const metadataSize = Number(group.max.metadataSize ?? 0);
  return {
    objectCount,
    totalSizeBytes: payloadSize + metadataSize
  };
}

async function currentUserId(): Promise<string> {
  const session = readSession();
  if (!session?.userId) throw new Error("user session required");
  return session.userId;
}

async function ensureTables(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS r2_connections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      account_id TEXT,
      bucket_name TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      public_url TEXT,
      region TEXT NOT NULL DEFAULT 'auto',
      encrypted_access_key_id TEXT NOT NULL,
      encrypted_secret_access_key TEXT NOT NULL,
      encrypted_access_key_iv TEXT NOT NULL DEFAULT '',
      encrypted_access_key_tag TEXT NOT NULL DEFAULT '',
      encrypted_secret_access_key_iv TEXT NOT NULL DEFAULT '',
      encrypted_secret_access_key_tag TEXT NOT NULL DEFAULT '',
      encryption_iv TEXT NOT NULL,
      encryption_tag TEXT NOT NULL,
      encryption_version INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      last_connected_at TEXT,
      last_selected_path TEXT NOT NULL DEFAULT '/',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS app_settings (
      user_id TEXT PRIMARY KEY,
      active_connection_id TEXT,
      start_minimized_to_tray INTEGER NOT NULL DEFAULT 1,
      close_to_tray INTEGER NOT NULL DEFAULT 1,
      launch_at_startup INTEGER NOT NULL DEFAULT 0,
      theme TEXT NOT NULL DEFAULT 'dark',
      accent_color TEXT NOT NULL DEFAULT '#2488ff',
      sidebar_width INTEGER NOT NULL DEFAULT 284,
      details_panel_visible INTEGER NOT NULL DEFAULT 1,
      upload_panel_visible INTEGER NOT NULL DEFAULT 1,
      window_width INTEGER,
      window_height INTEGER,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS upload_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      bucket_name TEXT NOT NULL,
      source_path TEXT NOT NULL,
      object_key TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT,
      size_bytes INTEGER NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      public_url TEXT,
      started_at TEXT,
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function run(action: string, payload: Json): Promise<unknown> {
  await ensureTables();
  switch (action) {
    case "sign_up_with_password": {
      const username = normalizeUsername(String(payload.username ?? ""));
      const password = String(payload.password ?? "");
      if (!username) throw new Error("Username is required.");
      if (password.trim().length < 6) throw new Error("Password must have at least 6 characters.");
      const existing = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
        "SELECT COUNT(1) AS c FROM auth_users WHERE username = ?",
        username
      );
      if ((existing[0]?.c ?? 0) > 0) throw new Error("Username already exists.");
      const userId = `user-${Date.now()}`;
      const saltHex = crypto.randomBytes(16).toString("hex");
      const passwordHash = hashPassword(password, saltHex);
      await prisma.$executeRawUnsafe(
        "INSERT INTO auth_users (id, username, password_hash, password_salt) VALUES (?, ?, ?, ?)",
        userId,
        username,
        passwordHash,
        saltHex
      );
      await prisma.$executeRawUnsafe(
        "INSERT OR IGNORE INTO \"User\" (id, name, createdAt, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        userId,
        username
      );
      writeSession(userId);
      return { user: { id: userId, username }, expiresAt: nowPlusDaysIso(30) };
    }
    case "sign_in_with_password": {
      const username = normalizeUsername(String(payload.username ?? ""));
      const password = String(payload.password ?? "");
      const rows = await prisma.$queryRawUnsafe<Array<{ id: string; username: string; password_hash: string; password_salt: string }>>(
        "SELECT id, username, password_hash, password_salt FROM auth_users WHERE username = ?",
        username
      );
      const row = rows[0];
      if (!row) throw new Error("Invalid username or password.");
      if (hashPassword(password, row.password_salt) !== row.password_hash) throw new Error("Invalid username or password.");
      writeSession(row.id);
      return { user: { id: row.id, username: row.username }, expiresAt: nowPlusDaysIso(30) };
    }
    case "get_session": {
      const session = readSession();
      if (!session?.userId) return null;
      const rows = await prisma.$queryRawUnsafe<Array<{ username: string }>>(
        "SELECT username FROM auth_users WHERE id = ?",
        session.userId
      );
      if (!rows[0]) return null;
      return { user: { id: session.userId, username: rows[0].username }, expiresAt: nowPlusDaysIso(30) };
    }
    case "clear_session": {
      clearSessionFile();
      return null;
    }
    case "delete_account": {
      const userId = await currentUserId();
      await prisma.$executeRawUnsafe("DELETE FROM upload_history WHERE user_id = ?", userId);
      await prisma.$executeRawUnsafe("DELETE FROM r2_connections WHERE user_id = ?", userId);
      await prisma.$executeRawUnsafe("DELETE FROM app_settings WHERE user_id = ?", userId);
      await prisma.$executeRawUnsafe("DELETE FROM auth_users WHERE id = ?", userId);
      await prisma.$executeRawUnsafe("DELETE FROM \"User\" WHERE id = ?", userId);
      deleteMasterKey(userId);
      clearSessionFile();
      return null;
    }
    case "list_connections": {
      const userId = await currentUserId();
      return prisma.$queryRawUnsafe(
        `SELECT id, name, bucket_name as bucketName, endpoint, public_url as publicUrl, region, status, last_connected_at as lastConnectedAt, last_selected_path as lastSelectedPath
         FROM r2_connections WHERE user_id = ? ORDER BY created_at ASC`,
        userId
      );
    }
    case "set_active_connection": {
      const userId = await currentUserId();
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_settings (user_id, active_connection_id) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET active_connection_id = excluded.active_connection_id, updated_at = CURRENT_TIMESTAMP`,
        userId,
        String(payload.connectionId)
      );
      return null;
    }
    case "create_connection": {
      const userId = await currentUserId();
      const input = payload.input as Record<string, string | undefined>;
      const connectionId = `conn-${Date.now()}`;
      const endpointRaw = String(input.endpoint ?? "").trim().replace(/\/+$/, "");
      const endpoint = endpointRaw.startsWith("http://") || endpointRaw.startsWith("https://") ? endpointRaw : `https://${endpointRaw}`;
      const region = String(input.region ?? "auto").trim() || "auto";
      const bucketName = String(input.bucketName ?? "");
      const accessKeyId = String(input.accessKeyId ?? "");
      const secretAccessKey = String(input.secretAccessKey ?? "");

      const client = makeClient(endpoint, region, accessKeyId, secretAccessKey);
      await client.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));

      const masterKey = getOrCreateMasterKey(userId);
      const encryptedAccessKey = encryptSecret(masterKey, userId, connectionId, accessKeyId);
      const encryptedSecretKey = encryptSecret(masterKey, userId, connectionId, secretAccessKey);

      await prisma.$executeRawUnsafe(
        `INSERT INTO r2_connections (
          id, user_id, name, account_id, bucket_name, endpoint, public_url, region,
          encrypted_access_key_id, encrypted_secret_access_key,
          encrypted_access_key_iv, encrypted_access_key_tag,
          encrypted_secret_access_key_iv, encrypted_secret_access_key_tag,
          encryption_iv, encryption_tag, encryption_version, status, last_selected_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'ACTIVE', '/')`,
        connectionId,
        userId,
        String(input.name ?? ""),
        input.accountId ?? null,
        bucketName,
        endpoint,
        input.publicUrl ?? null,
        region,
        encryptedAccessKey.ciphertext,
        encryptedSecretKey.ciphertext,
        encryptedAccessKey.iv,
        encryptedAccessKey.tag,
        encryptedSecretKey.iv,
        encryptedSecretKey.tag,
        encryptedAccessKey.iv,
        encryptedAccessKey.tag
      );
      await prisma.$executeRawUnsafe(
        `INSERT INTO app_settings (user_id, active_connection_id) VALUES (?, ?)
         ON CONFLICT(user_id) DO UPDATE SET active_connection_id = excluded.active_connection_id, updated_at = CURRENT_TIMESTAMP`,
        userId,
        connectionId
      );

      return {
        id: connectionId,
        name: String(input.name ?? ""),
        bucketName,
        endpoint,
        publicUrl: input.publicUrl,
        region,
        status: "ACTIVE",
        lastConnectedAt: null,
        lastSelectedPath: "/"
      };
    }
    case "browse_folder":
    case "create_folder":
    case "delete_object":
    case "delete_prefix":
    case "list_prefix_objects":
    case "rename_object":
    case "rename_prefix":
    case "get_bucket_usage": {
      const userId = await currentUserId();
      const connectionId = String(payload.connectionId);
      const rows = await prisma.$queryRawUnsafe<
        Array<{
          account_id: string | null;
          endpoint: string;
          region: string;
          encrypted_access_key_id: string;
          encrypted_secret_access_key: string;
          encrypted_access_key_iv: string;
          encrypted_access_key_tag: string;
          encrypted_secret_access_key_iv: string;
          encrypted_secret_access_key_tag: string;
          encryption_iv: string;
          encryption_tag: string;
        }>
      >(
        `SELECT account_id, endpoint, region, encrypted_access_key_id, encrypted_secret_access_key,
                encrypted_access_key_iv, encrypted_access_key_tag,
                encrypted_secret_access_key_iv, encrypted_secret_access_key_tag,
                encryption_iv, encryption_tag
         FROM r2_connections WHERE id = ? AND user_id = ?`,
        connectionId,
        userId
      );
      const row = rows[0];
      if (!row) throw new Error("Connection not found.");
      const masterKey = getOrCreateMasterKey(userId);
      const accessKeyId = decryptSecret(
        masterKey,
        userId,
        connectionId,
        row.encrypted_access_key_id,
        row.encrypted_access_key_iv || row.encryption_iv,
        row.encrypted_access_key_tag || row.encryption_tag
      );
      const secretAccessKey = decryptSecret(
        masterKey,
        userId,
        connectionId,
        row.encrypted_secret_access_key,
        row.encrypted_secret_access_key_iv || row.encryption_iv,
        row.encrypted_secret_access_key_tag || row.encryption_tag
      );
      const client = makeClient(row.endpoint, row.region, accessKeyId, secretAccessKey);

      if (action === "create_folder") {
        const pathValue = String(payload.path ?? "").replace(/^\/+|\/+$/g, "");
        const folderName = String(payload.folderName ?? "").trim().replace(/^\/+|\/+$/g, "");
        const objectKey = `${pathValue ? `${pathValue}/` : ""}${folderName}/`;
        await client.send(new PutObjectCommand({ Bucket: String(payload.bucketName), Key: objectKey, Body: "" }));
        return null;
      }

      if (action === "delete_object") {
        const objectKey = String(payload.objectKey ?? "");
        if (!objectKey.trim()) {
          throw new Error("Object key is required.");
        }
        await client.send(new DeleteObjectCommand({ Bucket: String(payload.bucketName), Key: objectKey }));
        return null;
      }

      if (action === "delete_prefix") {
        const prefix = String(payload.prefix ?? "").replace(/^\/+/, "");
        if (!prefix.trim()) {
          throw new Error("Folder prefix is required.");
        }
        const objects = await listAllObjects(client, String(payload.bucketName), prefix.endsWith("/") ? prefix : `${prefix}/`);
        for (const object of objects) {
          await client.send(new DeleteObjectCommand({ Bucket: String(payload.bucketName), Key: object.key }));
        }
        await client.send(
          new DeleteObjectCommand({
            Bucket: String(payload.bucketName),
            Key: prefix.endsWith("/") ? prefix : `${prefix}/`
          })
        );
        return { deleted: objects.length };
      }

      if (action === "list_prefix_objects") {
        const prefix = String(payload.prefix ?? "").replace(/^\/+/, "");
        const normalizedPrefix = prefix.endsWith("/") ? prefix : `${prefix}/`;
        const objects = await listAllObjects(client, String(payload.bucketName), normalizedPrefix);
        return { keys: objects.map((object) => object.key) };
      }

      if (action === "rename_object") {
        const oldKey = String(payload.oldKey ?? "").replace(/^\/+/, "");
        const newKey = String(payload.newKey ?? "").replace(/^\/+/, "");
        if (!oldKey || !newKey) {
          throw new Error("Both old and new key are required.");
        }
        await client.send(
          new CopyObjectCommand({
            Bucket: String(payload.bucketName),
            Key: newKey,
            CopySource: `${String(payload.bucketName)}/${oldKey}`
          })
        );
        await client.send(new DeleteObjectCommand({ Bucket: String(payload.bucketName), Key: oldKey }));
        return null;
      }

      if (action === "rename_prefix") {
        const oldPrefixRaw = String(payload.oldPrefix ?? "").replace(/^\/+/, "");
        const newPrefixRaw = String(payload.newPrefix ?? "").replace(/^\/+/, "");
        const oldPrefix = oldPrefixRaw.endsWith("/") ? oldPrefixRaw : `${oldPrefixRaw}/`;
        const newPrefix = newPrefixRaw.endsWith("/") ? newPrefixRaw : `${newPrefixRaw}/`;
        if (!oldPrefixRaw || !newPrefixRaw) {
          throw new Error("Both old and new folder names are required.");
        }
        const objects = await listAllObjects(client, String(payload.bucketName), oldPrefix);
        for (const object of objects) {
          const suffix = object.key.slice(oldPrefix.length);
          const newKey = `${newPrefix}${suffix}`;
          await client.send(
            new CopyObjectCommand({
              Bucket: String(payload.bucketName),
              Key: newKey,
              CopySource: `${String(payload.bucketName)}/${object.key}`
            })
          );
          await client.send(new DeleteObjectCommand({ Bucket: String(payload.bucketName), Key: object.key }));
        }
        await client.send(new PutObjectCommand({ Bucket: String(payload.bucketName), Key: newPrefix, Body: "" }));
        await client.send(new DeleteObjectCommand({ Bucket: String(payload.bucketName), Key: oldPrefix }));
        return null;
      }

      if (action === "get_bucket_usage") {
        if (row.account_id) {
          const usage = await getGraphQlBucketUsage(row.account_id, String(payload.bucketName));
          if (usage) {
            return { ...usage, source: "graphql" };
          }
        }
        const objects = await listAllObjects(client, String(payload.bucketName), "");
        const totalSizeBytes = objects.reduce((sum, item) => sum + item.size, 0);
        return {
          objectCount: objects.length,
          totalSizeBytes,
          source: "scan"
        };
      }

      const pathValue = String(payload.path ?? "").replace(/^\/+|\/+$/g, "");
      const prefix = pathValue ? `${pathValue}/` : "";
      const response = await client.send(
        new ListObjectsV2Command({ Bucket: String(payload.bucketName), Prefix: prefix, Delimiter: "/" })
      );
      const folders = (response.CommonPrefixes ?? [])
        .map((item) => item.Prefix)
        .filter((value): value is string => Boolean(value))
        .map(async (key) => {
          const items = await listAllObjects(client, String(payload.bucketName), key);
          const totalSizeBytes = items.reduce((sum, item) => sum + item.size, 0);
          return { key, name: key.replace(/\/$/, "").split("/").pop() ?? key, childCount: undefined, totalSizeBytes };
        });
      const resolvedFolders = await Promise.all(folders);
      const files = (response.Contents ?? [])
        .filter((item) => item.Key && !item.Key.endsWith("/"))
        .map((item) => ({
          key: item.Key as string,
          name: (item.Key as string).split("/").pop() ?? item.Key,
          sizeBytes: Number(item.Size ?? 0),
          mimeType: undefined,
          lastModified: item.LastModified?.toISOString(),
          etag: item.ETag,
          storageClass: item.StorageClass
        }));
      return { folders: resolvedFolders, files };
    }
    case "enqueue_uploads": {
      const userId = await currentUserId();
      const files = (payload.files as Array<Record<string, unknown>>) ?? [];
      const connectionId = String(payload.connectionId);
      const connectionRows = await prisma.$queryRawUnsafe<
        Array<{
          endpoint: string;
          region: string;
          encrypted_access_key_id: string;
          encrypted_secret_access_key: string;
          encrypted_access_key_iv: string;
          encrypted_access_key_tag: string;
          encrypted_secret_access_key_iv: string;
          encrypted_secret_access_key_tag: string;
          encryption_iv: string;
          encryption_tag: string;
        }>
      >(
        `SELECT endpoint, region, encrypted_access_key_id, encrypted_secret_access_key,
                encrypted_access_key_iv, encrypted_access_key_tag,
                encrypted_secret_access_key_iv, encrypted_secret_access_key_tag,
                encryption_iv, encryption_tag
         FROM r2_connections WHERE id = ? AND user_id = ?`,
        connectionId,
        userId
      );
      const connection = connectionRows[0];
      if (!connection) {
        throw new Error("Connection not found.");
      }
      const masterKey = getOrCreateMasterKey(userId);
      const accessKeyId = decryptSecret(
        masterKey,
        userId,
        connectionId,
        connection.encrypted_access_key_id,
        connection.encrypted_access_key_iv || connection.encryption_iv,
        connection.encrypted_access_key_tag || connection.encryption_tag
      );
      const secretAccessKey = decryptSecret(
        masterKey,
        userId,
        connectionId,
        connection.encrypted_secret_access_key,
        connection.encrypted_secret_access_key_iv || connection.encryption_iv,
        connection.encrypted_secret_access_key_tag || connection.encryption_tag
      );
      const client = makeClient(connection.endpoint, connection.region, accessKeyId, secretAccessKey);

      for (const item of files) {
        const sourcePath = String(item.sourcePath);
        const objectKey = String(item.targetPath).replace(/^\/+/, "");
        const fileName = String(item.fileName);
        const sizeBytes = Number(item.sizeBytes);
        const uploadId = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO upload_history (
            id, user_id, connection_id, bucket_name, source_path, object_key,
            file_name, size_bytes, status, progress
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'UPLOADING', 0)`,
          uploadId,
          userId,
          connectionId,
          String(payload.bucketName),
          sourcePath,
          objectKey,
          fileName,
          sizeBytes
        );

        try {
          const fileBuffer = fs.readFileSync(sourcePath);
          await client.send(
            new PutObjectCommand({
              Bucket: String(payload.bucketName),
              Key: objectKey,
              Body: fileBuffer
            })
          );
          await prisma.$executeRawUnsafe(
            `UPDATE upload_history SET status = 'COMPLETED', progress = 100, completed_at = CURRENT_TIMESTAMP WHERE id = ?`,
            uploadId
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          await prisma.$executeRawUnsafe(
            `UPDATE upload_history SET status = 'FAILED', error_message = ? WHERE id = ?`,
            message,
            uploadId
          );
          throw new Error(message);
        }
      }
      return null;
    }
    default:
      throw new Error(`Unsupported action: ${action}`);
  }
}

async function main() {
  const action = process.argv[2];
  const inputRaw = fs.readFileSync(0, "utf8");
  const payload = inputRaw.trim() ? (JSON.parse(inputRaw) as Json) : {};
  if (!action) fail("Missing action.");
  try {
    const data = await run(action, payload);
    out(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    fail(message);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
