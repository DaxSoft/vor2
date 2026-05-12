# R2 Explorer

Desktop app built with Tauri + Rust + React + Tailwind to browse and manage Cloudflare R2.

## Stack

- Tauri v2
- Rust (`aws-sdk-s3`) for R2 operations
- React + TypeScript + Tailwind CSS
- Lucide icons

## Environment

Create `.env` in project root:

```env
R2_ACCOUNT_ID=
R2_SECRET_ACCESS_KEY=
R2_ACCESS_KEY_ID=
R2_BUCKET=
R2_REGION=auto
R2_PUBLIC_BASE=
```

## Run

```bash
pnpm install
pnpm tauri:dev
```

## Build

```bash
pnpm tauri:build
```
