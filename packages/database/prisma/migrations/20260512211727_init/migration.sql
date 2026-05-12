-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT,
    "name" TEXT,
    "image" TEXT,
    "githubId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "R2Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountId" TEXT,
    "bucketName" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "publicUrl" TEXT,
    "region" TEXT NOT NULL DEFAULT 'auto',
    "encryptedAccessKeyId" TEXT NOT NULL,
    "encryptedSecretAccessKey" TEXT NOT NULL,
    "encryptionIv" TEXT NOT NULL,
    "encryptionTag" TEXT NOT NULL,
    "encryptionVersion" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastConnectedAt" DATETIME,
    "lastSelectedPath" TEXT NOT NULL DEFAULT '/',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "R2Connection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "activeConnectionId" TEXT,
    "startMinimizedToTray" BOOLEAN NOT NULL DEFAULT true,
    "closeToTray" BOOLEAN NOT NULL DEFAULT true,
    "launchAtStartup" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "accentColor" TEXT NOT NULL DEFAULT '#2488ff',
    "sidebarWidth" INTEGER NOT NULL DEFAULT 284,
    "detailsPanelVisible" BOOLEAN NOT NULL DEFAULT true,
    "uploadPanelVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AppSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "publicUrl" TEXT,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UploadHistory_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "R2Connection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecentPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "bucketName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SecretAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "connectionId" TEXT,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "R2Connection_userId_idx" ON "R2Connection"("userId");

-- CreateIndex
CREATE INDEX "R2Connection_bucketName_idx" ON "R2Connection"("bucketName");

-- CreateIndex
CREATE UNIQUE INDEX "AppSettings_userId_key" ON "AppSettings"("userId");

-- CreateIndex
CREATE INDEX "UploadHistory_userId_idx" ON "UploadHistory"("userId");

-- CreateIndex
CREATE INDEX "UploadHistory_connectionId_idx" ON "UploadHistory"("connectionId");

-- CreateIndex
CREATE INDEX "UploadHistory_status_idx" ON "UploadHistory"("status");

-- CreateIndex
CREATE INDEX "RecentPath_userId_idx" ON "RecentPath"("userId");

-- CreateIndex
CREATE INDEX "RecentPath_connectionId_idx" ON "RecentPath"("connectionId");

-- CreateIndex
CREATE INDEX "SecretAuditLog_userId_idx" ON "SecretAuditLog"("userId");

-- CreateIndex
CREATE INDEX "SecretAuditLog_connectionId_idx" ON "SecretAuditLog"("connectionId");
