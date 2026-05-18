import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

function getOsDataDir(): string {
  const home = os.homedir();

  if (process.platform === "win32") {
    return process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local");
  }
  if (process.platform === "darwin") {
    return path.join(home, "Library", "Application Support");
  }
  return process.env.XDG_DATA_HOME ?? path.join(home, ".local", "share");
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
    return process.env.DATABASE_URL;
  }

  const dataDir = path.join(getOsDataDir(), "vor2");
  fs.mkdirSync(dataDir, { recursive: true });
  const dbPath = path.join(dataDir, "vor2.db").replace(/\\/g, "/");
  const url = `file:${dbPath}`;
  process.env.DATABASE_URL = url;
  return url;
}

const connectionString = resolveDatabaseUrl();
const adapter = new PrismaBetterSQLite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
