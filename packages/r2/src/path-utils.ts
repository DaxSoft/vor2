export function normalizePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").trim();
  if (!normalized || normalized === "/") {
    return "/";
  }
  const compact = normalized.replace(/\/+/g, "/").replace(/^\//, "");
  return `/${compact}`.replace(/\/$/, "") || "/";
}

export function toPrefix(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return "";
  }
  return `${normalized.slice(1)}/`;
}

export function joinObjectKey(basePath: string, name: string): string {
  const prefix = toPrefix(basePath);
  const cleaned = name.replaceAll("\\", "/").replace(/^\/+/, "");
  return `${prefix}${cleaned}`;
}

export function buildPublicUrl(publicUrl: string | undefined, objectKey: string): string | undefined {
  if (!publicUrl) {
    return undefined;
  }
  const root = publicUrl.trim().replace(/\/$/, "");
  if (!root) {
    return undefined;
  }
  const encoded = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${root}/${encoded}`;
}
