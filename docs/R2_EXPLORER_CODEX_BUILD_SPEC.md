# R2 Explorer — AI Codex Build Specification

> Build a production-ready Windows desktop app for exploring and managing Cloudflare R2 buckets, with a premium dark translucent UI inspired by modern desktop tools like Codex, but as an original R2 file explorer.

---

## 1. Product Summary

**App name:** `R2 Explorer`

**Core idea:**  
A Windows tray-accessible desktop app that works like a polished Windows Explorer client for Cloudflare R2. The user can authenticate, save multiple R2 connections, switch between them, browse buckets/folders/files, upload files via drag-and-drop, create folders, inspect file metadata, copy/share public URLs, and manage upload queues.

**Target visual direction:**

- Windows 11 native-feeling desktop app.
- Dark mode only for v1.
- Primary accent: electric blue.
- Glass/acrylic/translucent panels.
- Blurred/vibrant sidebar and window background.
- Explorer-like UX, but more premium.
- Rounded panels, subtle borders, soft shadows.
- Clean typography, high contrast, no muddy low-contrast gray.
- Smooth but restrained animations.

---

## 2. Tech Stack

Use this stack exactly:

```txt
Runtime/Desktop:
- Tauri v2
- Rust for native commands/window/tray/security operations
- React + TypeScript for UI

Frontend:
- React
- TypeScript
- Tailwind CSS v3
- lucide-react
- motion/react

Storage/R2:
- @aws-sdk/client-s3
- @aws-sdk/lib-storage for multipart uploads/progress if needed

Database:
- SQLite
- Prisma ORM
- @prisma/client

Authentication:
- better-auth
- GitHub provider
- local desktop session persistence

Encryption:
- OS-backed key derivation/session key after login
- AES-256-GCM for encrypted R2 secrets
- Never store raw access keys or secret keys in SQLite

Package manager:
- Yarn

Code rules:
- Strict TypeScript.
- No `any`.
- No type casting unless absolutely unavoidable and isolated behind a typed boundary.
- Modular package-first architecture.
```

---

## 3. Non-Negotiable Requirements

### 3.1 App Behavior

The app must:

1. Start minimized to the Windows tray after login, unless launched manually.
2. Show a tray icon.
3. Open the main window when the tray icon is clicked.
4. Show a tray context menu with:
   - `Open App`
   - `Recent Uploads`
   - `Connections`
   - `Pause Upload Queue`
   - `Quit`
5. Let users sign in/sign up first.
6. Use Better Auth with GitHub login.
7. Store user session locally.
8. Let logged-in users create multiple R2 connections.
9. Encrypt R2 credentials before saving.
10. Decrypt credentials only after the user is authenticated.
11. Let users switch active R2 connections.
12. Browse R2 objects like folders/files.
13. Upload multiple files.
14. Upload via drag-and-drop.
15. Show upload progress per file.
16. Create folders.
17. Show file size, type, modified date, key/path, ETag, storage class, and public/private status when available.
18. Copy public URL.
19. Share/copy URL from the details panel.
20. Refresh current folder.
21. Search files/folders inside the current bucket/path.
22. Persist UI state such as last selected connection, last path, sidebar width, and window size.

### 3.2 Visual Requirements

The final UI must match the generated mockup direction 1:1:

- Main app window: dark translucent acrylic panel.
- Left navigation sidebar: blurred glass panel.
- File table: dark panel with thin dividers.
- Right details panel: file metadata panel.
- Bottom upload queue: persistent panel with progress rows.
- Blue accent:
  - selected folder row
  - primary buttons
  - active connection
  - progress bars
  - focused input outlines
  - tray icon glow
- All panels must have subtle borders using low-opacity white/blue.
- Window background must feel like Windows 11 acrylic/mica.
- Do not use flat black everywhere.
- Use layered translucent surfaces.

---

## 4. Repository Architecture

Use a Turborepo-style monorepo.

```txt
vor2/
├─ apps/
│  └─ desktop/
│     ├─ src/
│     │  ├─ app/
│     │  │  ├─ App.tsx
│     │  │  ├─ routes.tsx
│     │  │  └─ providers.tsx
│     │  ├─ features/
│     │  │  ├─ auth/
│     │  │  ├─ connections/
│     │  │  ├─ explorer/
│     │  │  ├─ uploads/
│     │  │  ├─ tray/
│     │  │  └─ settings/
│     │  ├─ components/
│     │  │  ├─ ui/
│     │  │  ├─ layout/
│     │  │  └─ feedback/
│     │  ├─ lib/
│     │  │  ├─ cn.ts
│     │  │  ├─ format.ts
│     │  │  ├─ icons.ts
│     │  │  └─ constants.ts
│     │  ├─ styles/
│     │  │  └─ globals.css
│     │  └─ main.tsx
│     ├─ src-tauri/
│     │  ├─ src/
│     │  │  ├─ main.rs
│     │  │  ├─ commands/
│     │  │  │  ├─ auth.rs
│     │  │  │  ├─ crypto.rs
│     │  │  │  ├─ database.rs
│     │  │  │  ├─ file_dialog.rs
│     │  │  │  ├─ tray.rs
│     │  │  │  └─ window.rs
│     │  │  ├─ state/
│     │  │  │  └─ app_state.rs
│     │  │  └─ security/
│     │  │     ├─ keyring.rs
│     │  │     └─ encryption.rs
│     │  ├─ icons/
│     │  ├─ capabilities/
│     │  ├─ tauri.conf.json
│     │  └─ Cargo.toml
│     ├─ prisma/
│     │  ├─ schema.prisma
│     │  └─ migrations/
│     ├─ package.json
│     ├─ tailwind.config.ts
│     ├─ postcss.config.js
│     ├─ tsconfig.json
│     └─ vite.config.ts
├─ packages/
│  ├─ config/
│  │  ├─ eslint/
│  │  ├─ tsconfig/
│  │  └─ tailwind/
│  ├─ database/
│  │  ├─ src/
│  │  │  ├─ client.ts
│  │  │  ├─ repositories/
│  │  │  └─ types.ts
│  │  └─ package.json
│  ├─ r2/
│  │  ├─ src/
│  │  │  ├─ r2-client.ts
│  │  │  ├─ r2-service.ts
│  │  │  ├─ r2-types.ts
│  │  │  ├─ path-utils.ts
│  │  │  └─ upload-manager.ts
│  │  └─ package.json
│  ├─ auth/
│  │  ├─ src/
│  │  │  ├─ auth.ts
│  │  │  ├─ auth-client.ts
│  │  │  └─ session.ts
│  │  └─ package.json
│  ├─ crypto/
│  │  ├─ src/
│  │  │  ├─ encryption.ts
│  │  │  ├─ key-derivation.ts
│  │  │  └─ crypto-types.ts
│  │  └─ package.json
│  └─ ui/
│     ├─ src/
│     │  ├─ primitives/
│     │  ├─ tokens/
│     │  └─ animations/
│     └─ package.json
├─ package.json
├─ turbo.json
└─ README.md
```

---

## 5. Package Responsibilities

### 5.1 `apps/desktop`

Owns:

- Tauri desktop shell.
- React routes.
- Feature composition.
- Window layout.
- Tauri command integration.
- App state hydration.
- Tray interaction.

Must not directly contain low-level R2 logic or encryption logic. Use packages.

### 5.2 `packages/r2`

Owns all Cloudflare R2/S3-compatible object storage behavior.

Responsibilities:

- Create S3 client with custom R2 endpoint.
- List buckets if credentials support it.
- List objects by prefix.
- Convert object keys into folder/file tree nodes.
- Upload files.
- Upload folders recursively.
- Create empty folder markers.
- Delete object.
- Rename object by copy + delete.
- Download object.
- Generate public URL from configured `publicUrl`.
- Normalize path separators.

### 5.3 `packages/database`

Owns Prisma client, repositories, and persistence types.

Responsibilities:

- User profile persistence.
- Better Auth tables if app owns the auth DB.
- R2 connection records.
- Upload history.
- App settings.
- Recent paths.
- Recent uploads.

### 5.4 `packages/auth`

Owns Better Auth configuration and session client.

Responsibilities:

- Better Auth server config.
- GitHub provider setup.
- Auth route handler for local desktop callback.
- Session hydration.
- User identity normalization.

### 5.5 `packages/crypto`

Owns encryption/decryption utilities.

Responsibilities:

- AES-256-GCM encryption.
- IV generation.
- Auth tag handling.
- Envelope format.
- Session key derivation.
- Secret serialization/deserialization.

### 5.6 `packages/ui`

Owns reusable UI primitives and design tokens.

Responsibilities:

- Button.
- Input.
- Panel.
- Sidebar.
- Table.
- Progress.
- Badge.
- Dropdown.
- Tooltip.
- Context menu.
- Motion presets.
- Glass/acrylic CSS tokens.

---

## 6. Database Schema

Create this Prisma schema.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

enum ConnectionStatus {
  ACTIVE
  DISABLED
  NEEDS_REAUTH
  ERROR
}

enum UploadStatus {
  QUEUED
  UPLOADING
  PAUSED
  COMPLETED
  FAILED
  CANCELED
}

model User {
  id              String         @id @default(cuid())
  email           String?        @unique
  name            String?
  image           String?
  githubId        String?        @unique
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  connections     R2Connection[]
  settings        AppSettings?
  uploads         UploadHistory[]
}

model R2Connection {
  id                       String           @id @default(cuid())
  userId                   String
  name                     String
  accountId                String?
  bucketName               String
  endpoint                 String
  publicUrl                String?
  region                   String           @default("auto")

  encryptedAccessKeyId     String
  encryptedSecretAccessKey String
  encryptionIv             String
  encryptionTag            String
  encryptionVersion        Int              @default(1)

  status                   ConnectionStatus @default(ACTIVE)
  lastConnectedAt          DateTime?
  lastSelectedPath         String            @default("/")
  createdAt                DateTime          @default(now())
  updatedAt                DateTime          @updatedAt

  user                     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  uploads                  UploadHistory[]

  @@index([userId])
  @@index([bucketName])
}

model AppSettings {
  id                    String   @id @default(cuid())
  userId                String   @unique

  activeConnectionId    String?
  startMinimizedToTray  Boolean  @default(true)
  closeToTray           Boolean  @default(true)
  launchAtStartup       Boolean  @default(false)
  theme                 String   @default("dark")
  accentColor           String   @default("#2488ff")
  sidebarWidth          Int      @default(284)
  detailsPanelVisible   Boolean  @default(true)
  uploadPanelVisible    Boolean  @default(true)

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model UploadHistory {
  id              String       @id @default(cuid())
  userId          String
  connectionId    String
  bucketName      String
  sourcePath      String
  objectKey       String
  fileName        String
  mimeType        String?
  sizeBytes       BigInt
  status          UploadStatus
  progress        Int          @default(0)
  errorMessage    String?
  publicUrl       String?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime     @default(now())

  user            User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  connection      R2Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([connectionId])
  @@index([status])
}

model RecentPath {
  id             String   @id @default(cuid())
  userId         String
  connectionId   String
  bucketName     String
  path           String
  openedAt       DateTime @default(now())

  @@index([userId])
  @@index([connectionId])
}

model SecretAuditLog {
  id             String   @id @default(cuid())
  userId         String
  connectionId   String?
  action         String
  createdAt      DateTime @default(now())

  @@index([userId])
  @@index([connectionId])
}
```

---

## 7. Authentication Flow

### 7.1 Login Screen

Before showing the explorer, show a beautiful auth screen with:

- App logo.
- `R2 Explorer`
- Short headline: `Your Cloudflare R2 files, one click away.`
- Button: `Continue with GitHub`
- Small note: `Your R2 credentials are encrypted locally and unlocked only after sign-in.`

### 7.2 Better Auth Requirements

Use Better Auth with GitHub provider.

Expected flow:

1. User clicks `Continue with GitHub`.
2. App opens GitHub OAuth in the system browser or embedded local auth window.
3. Better Auth completes callback through local route.
4. Session is stored.
5. The app redirects to onboarding if there are no R2 connections.
6. Otherwise, open the explorer with the last active connection.

### 7.3 Local Desktop Callback

Preferred local callback for v1:

```txt
http://localhost:<auth-port>/api/auth/callback/github
```

Alternative deep link:

```txt
vor2://auth/callback
```

Use the preferred local callback for v1 because it is easier to wire with Better Auth.

### 7.4 Session Rules

- The user must be authenticated before secrets can be decrypted.
- On app start, check valid session.
- If session is invalid, show auth screen.
- If session exists, unlock local encryption context.
- If unlock fails, require login again.

---

## 8. R2 Connection Onboarding

### 8.1 First Connection Screen

After login, if no R2 connection exists, show `Create your first R2 connection`.

Form fields:

```txt
Connection name
Bucket name
Public URL
Account ID
Endpoint
Access Key ID
Secret Access Key
Region
```

Defaults:

```txt
Region: auto
Endpoint format: https://<account-id>.r2.cloudflarestorage.com
Public URL placeholder: https://pub-xxxx.r2.dev or custom domain
```

### 8.2 Validation

Before saving:

1. Build S3 client.
2. Call `HeadBucket` or `ListObjectsV2` with `MaxKeys: 1`.
3. If successful:
   - encrypt credentials
   - save connection
   - mark as active
4. If failed:
   - show inline error
   - do not save secret fields

### 8.3 Multiple Connections

User must be able to:

- Add connection.
- Edit connection name/public URL.
- Rotate credentials.
- Disable connection.
- Delete connection.
- Switch active connection.
- See connection status.

Connection switcher must be visible at the top of the sidebar.

---

## 9. Encryption Model

### 9.1 Goals

- Never store raw R2 access keys.
- Store only encrypted access key and encrypted secret key.
- Decrypt only after successful login.
- Keep decrypted credentials only in memory.
- Clear credentials when user logs out.
- Clear credentials when app locks.

### 9.2 Encryption Format

Store encrypted fields in SQLite like this:

```ts
export interface EncryptedSecretEnvelope {
  version: 1;
  algorithm: "AES-256-GCM";
  ciphertext: string;
  iv: string;
  tag: string;
}
```

### 9.3 Key Strategy

Use a local master key protected by the OS keyring where possible.

Recommended v1 model:

```txt
1. On first login:
   - Generate random 256-bit local master key.
   - Store it using OS keychain/keyring through Tauri/Rust.
   - Bind lookup to authenticated app user id.

2. For each R2 connection:
   - Derive per-user/per-connection encryption key:
     HKDF(localMasterKey, userId + connectionId)

3. Encrypt:
   - accessKeyId
   - secretAccessKey

4. Save:
   - encrypted payload
   - iv
   - auth tag
   - encryption version
```

### 9.4 Runtime Rules

- Decrypted credentials live only in memory.
- Do not log credentials.
- Do not send secrets to frontend unless strictly necessary.
- Prefer native/Rust-side commands for decrypting and returning scoped temporary connection handles.
- If using JS SDK in frontend, expose decrypted credentials only through a short-lived in-memory store and clear on logout/lock.

### 9.5 Recommended Safer Approach

Prefer keeping credentials and S3 operations in the backend/native/service layer instead of raw React state.

Flow:

```txt
React UI
  -> invokes Tauri command / local service action
  -> command requests active connection
  -> command decrypts credentials in memory
  -> command performs R2 operation
  -> command returns safe data to UI
```

---

## 10. R2/S3 Client

### 10.1 Client Factory

```ts
import { S3Client } from "@aws-sdk/client-s3";

export interface R2ClientConfig {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export function createR2Client(config: R2ClientConfig): S3Client {
  return new S3Client({
    region: config.region || "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}
```

### 10.2 Object Listing

Use `ListObjectsV2Command`.

Given current path:

```txt
/images/banners/
```

Call:

```ts
Prefix: "images/banners/";
Delimiter: "/";
```

Convert:

- `CommonPrefixes` into folders.
- `Contents` into files.

### 10.3 Folder Creation

R2/S3 does not have real folders. Create an empty marker object:

```txt
folder/path/
```

With zero-byte body.

### 10.4 Uploads

Support:

- Single file upload.
- Multiple file upload.
- Folder upload using recursive file entries from drag-drop.
- Pause/cancel where possible.
- Queue concurrency setting.

Upload queue defaults:

```txt
Max concurrent uploads: 3
Retry attempts: 3
Retry backoff: 800ms, 1600ms, 3200ms
```

### 10.5 Public URL Builder

Given:

```txt
publicUrl = https://pub-123.r2.dev
objectKey = images/banners/banner-home-hero.jpg
```

Return:

```txt
https://pub-123.r2.dev/images/banners/banner-home-hero.jpg
```

Rules:

- Trim trailing slash from public URL.
- Encode path segments.
- Do not double-encode `/`.
- If `publicUrl` is empty, disable `Copy URL` and show `No public URL configured`.

---

## 11. Main UI Layout

```txt
<AppShell>
  <TitleBar />
  <Sidebar />
  <MainExplorer />
  <DetailsPanel />
  <UploadQueue />
</AppShell>
```

Required visual layout:

```txt
┌──────────────────────────────────────────────────────────────┐
│ Titlebar: logo, search, actions, window controls             │
├───────────────┬────────────────────────────┬─────────────────┤
│ Sidebar       │ File Browser               │ Details Panel   │
│ Buckets       │ Breadcrumb                  │ Preview         │
│ Folders       │ Table/Grid                  │ Metadata        │
│ Usage         │ Upload Queue                │ Copy/Share      │
└───────────────┴────────────────────────────┴─────────────────┘
```

Use full-screen app container:

```tsx
<div className="h-screen w-screen overflow-hidden bg-[#05070d] text-[#f5f8ff]">
  <div className="app-acrylic-shell">...</div>
</div>
```

The background should include a subtle blue radial glow:

```css
.app-background {
  background:
    radial-gradient(
      circle at 75% 15%,
      rgba(36, 136, 255, 0.28),
      transparent 38%
    ),
    radial-gradient(
      circle at 10% 90%,
      rgba(36, 136, 255, 0.18),
      transparent 32%
    ),
    linear-gradient(135deg, #05070d 0%, #0a101c 50%, #05070d 100%);
}
```

---

## 12. Tauri Window / Acrylic / Transparency

### 12.1 Tauri Config

`src-tauri/tauri.conf.json`:

```json
{
  "productName": "R2 Explorer",
  "version": "0.1.0",
  "identifier": "com.daxsoft.r2explorer",
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "R2 Explorer",
        "width": 1440,
        "height": 860,
        "minWidth": 1120,
        "minHeight": 720,
        "decorations": false,
        "transparent": true,
        "shadow": true,
        "resizable": true,
        "center": true,
        "visible": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.ico"]
  }
}
```

### 12.2 Window Effects

Preferred effect order on Windows:

```txt
1. Mica / Tabbed Mica on Windows 11
2. Acrylic on Windows 10/11
3. Transparent CSS fallback
```

Rust pseudo-code:

```rust
use tauri::Manager;

pub fn apply_window_effects(app: &tauri::AppHandle) {
    let window = app.get_webview_window("main").expect("main window");

    #[cfg(target_os = "windows")]
    {
        // Apply acrylic/mica if available.
        // If using window-vibrancy crate, call apply_mica/apply_acrylic here.
    }
}
```

### 12.3 CSS Glass Fallback

Always implement the visual design in CSS too, because OS window effects vary by Windows version.

```css
:root {
  --accent: #2488ff;
  --accent-strong: #0f7bff;
  --bg-root: rgba(5, 7, 13, 0.68);
  --panel: rgba(12, 17, 27, 0.68);
  --panel-strong: rgba(15, 21, 34, 0.86);
  --panel-soft: rgba(255, 255, 255, 0.045);
  --border: rgba(255, 255, 255, 0.105);
  --border-blue: rgba(36, 136, 255, 0.42);
  --text: #f5f8ff;
  --text-muted: #aebbd1;
  --text-soft: #8090aa;
}

.glass-shell {
  background: rgba(8, 12, 20, 0.72);
  backdrop-filter: blur(34px) saturate(145%);
  -webkit-backdrop-filter: blur(34px) saturate(145%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.glass-panel {
  background:
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.055),
      rgba(255, 255, 255, 0.025)
    ),
    rgba(9, 14, 24, 0.68);
  backdrop-filter: blur(28px) saturate(140%);
  -webkit-backdrop-filter: blur(28px) saturate(140%);
  border: 1px solid var(--border);
}

.blue-focus {
  box-shadow:
    0 0 0 1px rgba(36, 136, 255, 0.55),
    0 0 22px rgba(36, 136, 255, 0.18);
}
```

---

## 13. Tailwind Theme

`tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: "#05070d",
          panel: "rgba(12, 17, 27, 0.72)",
          panelStrong: "rgba(15, 21, 34, 0.9)",
          border: "rgba(255, 255, 255, 0.105)",
          text: "#f5f8ff",
          muted: "#aebbd1",
          soft: "#8090aa",
        },
        accent: {
          DEFAULT: "#2488ff",
          strong: "#0f7bff",
          soft: "rgba(36, 136, 255, 0.14)",
        },
      },
      borderRadius: {
        app: "18px",
        panel: "14px",
      },
      boxShadow: {
        glass:
          "0 24px 80px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        blue: "0 0 0 1px rgba(36, 136, 255, 0.48), 0 0 24px rgba(36, 136, 255, 0.18)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Segoe UI Variable",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 14. UI Components

### 14.1 Title Bar

Features:

- Draggable region.
- App logo/name.
- Search input.
- New Folder button.
- Upload button.
- Refresh button.
- More menu.
- Native window controls recreated in React.

Icons from `lucide-react`:

```txt
Cloud
Search
FolderPlus
UploadCloud
RefreshCw
MoreHorizontal
Minus
Square
X
```

### 14.2 Sidebar

Contains:

- Connection switcher.
- Bucket list.
- Folder tree.
- Storage usage card.
- Settings icon.

Connection switcher behavior:

- Shows current connection name.
- Dropdown displays all saved connections.
- `Add connection` action.
- `Manage connections` action.
- Connection status indicator.

### 14.3 Explorer Table

Columns:

```txt
Name
Type
Size
Modified
Status
```

Behavior:

- Single click selects.
- Double click opens folder or preview.
- Right-click context menu.
- Keyboard navigation:
  - Enter opens.
  - Backspace goes parent.
  - F2 rename.
  - Delete asks confirmation.
  - Ctrl+C copies public URL if available.
  - Ctrl+F focuses search.

### 14.4 Details Panel

Shows selected item.

For file:

```txt
Preview / icon
Name
Public/Private badge
Size
Type
Last Modified
ETag
Storage Class
Object Key
Public URL
Copy URL
Share
Download
Make Public / Make Private if supported
Delete
```

For folder:

```txt
Folder icon
Name
Path
Object count if loaded
Create subfolder
Upload here
Copy folder path
```

### 14.5 Upload Queue

Required features:

- Drag-and-drop zone.
- Multiple file rows.
- Per-file progress bar.
- Upload speed.
- Size uploaded / total size.
- Pause/cancel controls.
- Completed check mark.
- Failed retry button.
- Clear completed.

States:

```txt
Queued
Uploading
Paused
Completed
Failed
Canceled
```

---

## 15. Motion / Animation Rules

Use `motion/react`.

### 15.1 Animation Principles

- Smooth but fast.
- No exaggerated bounce.
- Desktop utility app feeling.
- Respect reduced motion.

### 15.2 Motion Presets

```ts
export const motionPresets = {
  panelIn: {
    initial: { opacity: 0, y: 8, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: 8, filter: "blur(8px)" },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] },
  },
  rowIn: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.12 },
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.14 },
  },
};
```

Use motion for:

- Details panel transitions.
- Upload queue expand/collapse.
- Connection dropdown.
- Tray-like popover inside app UI.
- Row insertion on refresh/upload.
- Toast notifications.
- Dialogs.

Do not animate:

- Every table row on every refresh in a way that harms performance.
- Progress bars with heavy layout animations.
- Large blur effects during drag.

---

## 16. Feature Modules

### 16.1 Auth Module

```txt
features/auth/
├─ AuthScreen.tsx
├─ auth.store.ts
├─ auth.hooks.ts
├─ auth.types.ts
└─ auth.service.ts
```

Responsibilities:

- Sign in with GitHub.
- Sign out.
- Hydrate session.
- Lock/unlock app.
- Redirect to onboarding/explorer.

### 16.2 Connections Module

```txt
features/connections/
├─ ConnectionSwitcher.tsx
├─ ConnectionForm.tsx
├─ ConnectionList.tsx
├─ connection.store.ts
├─ connection.service.ts
├─ connection.types.ts
└─ connection.validation.ts
```

Responsibilities:

- CRUD for connections.
- Test connection.
- Encrypt credentials before save.
- Switch connection.
- Rotate credentials.

### 16.3 Explorer Module

```txt
features/explorer/
├─ ExplorerView.tsx
├─ ExplorerTable.tsx
├─ Breadcrumb.tsx
├─ FolderTree.tsx
├─ DetailsPanel.tsx
├─ explorer.store.ts
├─ explorer.service.ts
├─ explorer.types.ts
└─ object-mapper.ts
```

Responsibilities:

- Browse files/folders.
- Selection.
- Breadcrumb.
- Search.
- Refresh.
- Folder creation.
- Context menu.

### 16.4 Uploads Module

```txt
features/uploads/
├─ UploadQueue.tsx
├─ UploadDropzone.tsx
├─ UploadRow.tsx
├─ upload.store.ts
├─ upload.service.ts
├─ upload.types.ts
└─ upload-progress.ts
```

Responsibilities:

- Queue.
- Drag-drop.
- Multiple uploads.
- Progress tracking.
- Pause/cancel/retry.
- Upload history.

### 16.5 Tray Module

```txt
features/tray/
├─ tray.service.ts
├─ tray.types.ts
└─ tray.events.ts
```

Responsibilities:

- Listen to Tauri tray events.
- Open/hide window.
- Close to tray.
- Recent uploads shortcut.

---

## 17. Type Definitions

### 17.1 R2 Object Types

```ts
export type R2NodeKind = "folder" | "file";

export interface R2BaseNode {
  id: string;
  key: string;
  name: string;
  path: string;
  kind: R2NodeKind;
}

export interface R2FolderNode extends R2BaseNode {
  kind: "folder";
  childCount?: number;
}

export interface R2FileNode extends R2BaseNode {
  kind: "file";
  sizeBytes: number;
  mimeType?: string;
  lastModified?: Date;
  etag?: string;
  storageClass?: string;
  publicUrl?: string;
  isPublic: boolean;
}

export type R2ExplorerNode = R2FolderNode | R2FileNode;
```

### 17.2 Upload Types

```ts
export type UploadTaskStatus =
  | "queued"
  | "uploading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface UploadTask {
  id: string;
  connectionId: string;
  bucketName: string;
  sourcePath: string;
  objectKey: string;
  fileName: string;
  sizeBytes: number;
  uploadedBytes: number;
  progress: number;
  speedBytesPerSecond: number;
  status: UploadTaskStatus;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}
```

### 17.3 Connection Types

```ts
export interface R2ConnectionSafe {
  id: string;
  name: string;
  bucketName: string;
  endpoint: string;
  publicUrl?: string;
  region: string;
  status: "ACTIVE" | "DISABLED" | "NEEDS_REAUTH" | "ERROR";
  lastConnectedAt?: Date;
  lastSelectedPath: string;
}

export interface R2ConnectionCreateInput {
  name: string;
  bucketName: string;
  accountId?: string;
  endpoint: string;
  publicUrl?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}
```

---

## 18. State Management

Use a simple modular store. Zustand is allowed if installed, but keep stores feature-scoped.

Required stores:

```txt
auth.store
connection.store
explorer.store
upload.store
ui.store
```

### 18.1 Explorer Store

State:

```txt
activeConnectionId
bucketName
currentPath
nodes
selectedNodeId
expandedFolders
isLoading
error
searchQuery
sortBy
sortDirection
viewMode
```

Actions:

```txt
loadPath(path)
refresh()
selectNode(id)
openNode(id)
goBack()
goParent()
createFolder(name)
setSearchQuery(query)
setSort(sortBy, direction)
```

### 18.2 Upload Store

State:

```txt
tasks
isQueueVisible
isPaused
concurrency
```

Actions:

```txt
addFiles(files, targetPath)
startTask(taskId)
pauseTask(taskId)
cancelTask(taskId)
retryTask(taskId)
clearCompleted()
pauseAll()
resumeAll()
```

---

## 19. Commands / Native Boundary

Expose Tauri commands for OS/native functionality.

```rust
#[tauri::command]
async fn show_main_window() -> Result<(), String>;

#[tauri::command]
async fn hide_main_window() -> Result<(), String>;

#[tauri::command]
async fn set_startup_enabled(enabled: bool) -> Result<(), String>;

#[tauri::command]
async fn encrypt_secret(user_id: String, connection_id: String, value: String) -> Result<EncryptedSecretDto, String>;

#[tauri::command]
async fn decrypt_connection(connection_id: String) -> Result<DecryptedConnectionDto, String>;

#[tauri::command]
async fn open_file_dialog() -> Result<Vec<String>, String>;

#[tauri::command]
async fn reveal_in_explorer(path: String) -> Result<(), String>;
```

Security rule:

- Do not create a generic `decryptSecret(value)` command callable by any UI screen.
- Keep secret decryption tied to authenticated session and connection access control.

---

## 20. Tray Behavior

### 20.1 Startup

On app startup:

```txt
1. Initialize tray.
2. Initialize DB.
3. Check session.
4. If session exists and settings.startMinimizedToTray is true:
   - do not show main window
5. Else:
   - show main window
```

### 20.2 Close Behavior

When user clicks close:

- If `closeToTray = true`, hide window.
- Do not quit app.
- Show toast once: `R2 Explorer is still running in the tray.`
- If `closeToTray = false`, quit app.

### 20.3 Tray Click

- Single click: show and focus app.
- Right click: context menu.
- Menu items:
  - Open App
  - Recent Uploads
  - Active Connection
  - Pause/Resume Upload Queue
  - Settings
  - Quit

---

## 21. File Operations

### 21.1 Browse Folder

Input:

```txt
connectionId
bucketName
path
```

Process:

```txt
1. Resolve connection.
2. Decrypt credentials in memory.
3. Build S3 client.
4. List objects with Prefix + Delimiter.
5. Map response to folder/file nodes.
6. Return safe nodes to UI.
```

### 21.2 Create Folder

Input:

```txt
path
folderName
```

Rules:

- Folder name cannot be empty.
- Folder name cannot include `\`.
- Normalize to `/`.
- Create object key:

```txt
${currentPath}/${folderName}/
```

### 21.3 Upload Files

Input:

```txt
files
targetPath
```

Rules:

- Preserve file names.
- For folder upload, preserve relative folder paths.
- If object already exists, show conflict dialog:
  - Replace
  - Keep both
  - Skip

### 21.4 Copy URL

Rules:

- If public URL exists, copy to clipboard.
- If missing, show `No public URL configured.`
- Toast success:

```txt
Copied public URL
```

### 21.5 Delete Object

Rules:

- Show confirmation dialog.
- For folder delete, recursively delete all keys under prefix.
- Show progress for recursive delete.

---

## 22. Routing

Use simple route states, not necessarily browser routes.

```txt
/auth
/onboarding
/app
/settings
/settings/connections
```

`/app` layout:

```txt
R2ExplorerShell
```

---

## 23. Visual Implementation Details

### 23.1 Colors

```txt
Background base: #05070d
Panel base: rgba(12, 17, 27, 0.72)
Panel strong: rgba(15, 21, 34, 0.9)
Accent: #2488ff
Accent strong: #0f7bff
Success: #28d17c
Warning: #f5b84b
Danger: #ff5c7a
Text primary: #f5f8ff
Text secondary: #aebbd1
Text muted: #8090aa
Border: rgba(255,255,255,0.105)
Blue border: rgba(36,136,255,0.42)
```

### 23.2 Typography

Use:

```txt
Inter
Segoe UI Variable fallback
```

Font sizes:

```txt
Titlebar app name: 14px / 600
Sidebar items: 13px / 400
Table header: 12px / 600
Table row: 13px / 400
Details title: 14px / 600
Metadata label: 12px / 400
Metadata value: 12px / 500
Buttons: 13px / 600
```

### 23.3 Borders

Use thin borders:

```txt
1px rgba(255,255,255,0.10)
```

Selected item:

```txt
border: 1px solid rgba(36,136,255,0.65)
background: rgba(36,136,255,0.15)
box-shadow: 0 0 18px rgba(36,136,255,0.16)
```

### 23.4 Buttons

Primary button:

```txt
bg #0f7bff
border rgba(255,255,255,0.14)
text #ffffff
hover bg #2488ff
```

Secondary button:

```txt
bg rgba(255,255,255,0.045)
border rgba(255,255,255,0.10)
hover bg rgba(255,255,255,0.075)
```

### 23.5 Progress Bars

Track:

```txt
rgba(255,255,255,0.09)
```

Fill:

```txt
linear-gradient(90deg, #2488ff, #5aa7ff)
```

---

## 24. Accessibility

Requirements:

- All buttons need accessible labels.
- Keyboard navigation for table/folder tree.
- Visible focus rings using blue accent.
- Minimum text contrast must be readable on dark backgrounds.
- Support reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

---

## 25. Error Handling

### 25.1 Connection Errors

Show friendly messages:

```txt
Could not connect to this R2 bucket.
Check the endpoint, bucket name, and access key permissions.
```

### 25.2 Upload Errors

Each failed row must show:

- `Retry`
- `Cancel`
- error tooltip

### 25.3 Auth Errors

```txt
GitHub sign-in failed.
Try again or check your browser authorization window.
```

### 25.4 Encryption Errors

```txt
Could not unlock encrypted credentials.
Please sign in again.
```

---

## 26. Security Rules

Do:

- Encrypt secrets before SQLite write.
- Keep decrypted secrets in memory only.
- Clear secrets on logout.
- Clear secrets when app locks.
- Do not log credentials.
- Redact credentials in all errors.
- Use typed DTOs for safe UI data.
- Store only the minimum needed credential data.

Do not:

- Store raw access key.
- Store raw secret key.
- Put secrets in localStorage.
- Put secrets in React Query cache if using decrypted values.
- Expose generic decrypt commands.
- Log full S3 client config.

---

## 27. Implementation Order for Codex

Build in this exact order:

### Phase 1 — Project Setup

1. Create Tauri + React + TypeScript app.
2. Add Tailwind v3.
3. Add lucide-react.
4. Add motion/react.
5. Add Prisma + SQLite.
6. Add Better Auth.
7. Add AWS S3 SDK packages.
8. Configure strict TypeScript.

### Phase 2 — Shell + Visual System

1. Create acrylic Tauri window.
2. Implement custom titlebar.
3. Implement glass CSS tokens.
4. Implement app shell layout.
5. Implement sidebar/main/details/upload queue static UI.
6. Match the generated mockup visually before wiring data.

### Phase 3 — Auth

1. Configure Better Auth GitHub provider.
2. Create auth screen.
3. Create local callback.
4. Persist session.
5. Gate app behind auth.

### Phase 4 — Database

1. Add Prisma schema.
2. Run migrations.
3. Create repositories.
4. Add settings persistence.

### Phase 5 — Encryption

1. Implement OS-backed master key.
2. Implement AES-256-GCM envelope.
3. Implement connection secret encryption.
4. Implement safe secret unlock flow.

### Phase 6 — Connections

1. Add create connection form.
2. Validate R2 connection.
3. Save encrypted connection.
4. Switch active connection.
5. Manage multiple connections.

### Phase 7 — Explorer

1. List objects.
2. Map folders/files.
3. Breadcrumb navigation.
4. Folder tree.
5. File selection.
6. Details panel.
7. Refresh/search/sort.

### Phase 8 — Uploads

1. Drag-drop files.
2. Multi-file upload queue.
3. Progress tracking.
4. Cancel/retry.
5. Persist upload history.
6. Tray upload status.

### Phase 9 — Tray

1. Add tray icon.
2. Add menu.
3. Click-to-open behavior.
4. Close-to-tray behavior.
5. Recent uploads menu.

### Phase 10 — Polish

1. Keyboard shortcuts.
2. Empty states.
3. Error states.
4. Loading skeletons.
5. Toasts.
6. Animations.
7. Performance pass.
8. Accessibility pass.

---

## 28. Acceptance Criteria

The app is complete when:

- User can sign in with GitHub.
- User can create an R2 connection.
- Credentials are encrypted in SQLite.
- App can restart and reconnect after login without retyping credentials.
- User can create multiple R2 connections.
- User can switch connections.
- User can browse bucket contents.
- Folder tree and breadcrumb work.
- User can upload multiple files with progress.
- Drag-and-drop upload works.
- User can create folders.
- User can copy a file public URL.
- Details panel shows selected file metadata.
- Tray icon opens the app.
- Closing the app hides to tray.
- Visual design matches the target mockup: dark, acrylic, blue, premium, Windows-native feeling.

---

## 29. Suggested `package.json` Dependencies

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "latest",
    "@aws-sdk/lib-storage": "latest",
    "@prisma/client": "latest",
    "@tauri-apps/api": "latest",
    "better-auth": "latest",
    "clsx": "latest",
    "lucide-react": "latest",
    "motion": "latest",
    "tailwind-merge": "latest",
    "zustand": "latest"
  },
  "devDependencies": {
    "@tauri-apps/cli": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "prisma": "latest",
    "tailwindcss": "^3.4.0",
    "typescript": "latest",
    "vite": "latest"
  }
}
```

---

## 30. Codex Build Instruction

When implementing this project:

```txt
Do not simplify the UI.
Do not remove acrylic/translucency.
Do not replace the explorer layout with a generic dashboard.
Do not store unencrypted secrets.
Do not skip tray integration.
Do not make it single-connection only.
Do not use `any`.
Do not add unnecessary backend services unless required for Better Auth local callback.
```

Focus on:

```txt
1. Native-feeling Windows desktop experience.
2. Secure local credential storage.
3. Multiple R2 connections.
4. Fast file browsing.
5. Beautiful upload workflow.
6. Exact visual match to the target mockup.
```
