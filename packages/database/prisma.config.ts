import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

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

function getVor2DatabaseUrl(): string {
  const dataDir = path.join(getOsDataDir(), "vor2");
  fs.mkdirSync(dataDir, { recursive: true });

  const databasePath = path.join(dataDir, "vor2.db").replace(/\\/g, "/");
  const databaseUrl = `file:${databasePath}`;

  process.env.DATABASE_URL = databaseUrl;
  return env("DATABASE_URL");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: getVor2DatabaseUrl()
  }
});
