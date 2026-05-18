import { useState } from "react";
import { Cloud, Database } from "lucide-react";
import { useConnectionStore } from "./connection.store";
import type { R2ConnectionCreateInput } from "./connection.types";

interface ConnectionField {
  label: string;
  key: keyof R2ConnectionCreateInput;
  required: boolean;
  type?: "text" | "password";
  placeholder?: string;
}

const connectionFields: ConnectionField[] = [
  { label: "Connection name", key: "name", required: true },
  { label: "Bucket name", key: "bucketName", required: true },
  { label: "Public URL", key: "publicUrl", required: false },
  { label: "Account ID", key: "accountId", required: false },
  {
    label: "Endpoint",
    key: "endpoint",
    required: true,
    placeholder: "https://<account-id>.r2.cloudflarestorage.com",
  },
  { label: "Access Key ID", key: "accessKeyId", required: true },
  {
    label: "Secret Access Key",
    key: "secretAccessKey",
    required: true,
    type: "password",
  },
  { label: "Region", key: "region", required: false },
];

const initialValue: R2ConnectionCreateInput = {
  provider: "r2",
  name: "",
  bucketName: "",
  publicUrl: "",
  accountId: "",
  endpoint: "",
  accessKeyId: "",
  secretAccessKey: "",
  region: "auto",
};

export function ConnectionForm({ onCreated }: { onCreated: () => void }) {
  const createConnection = useConnectionStore(
    (state) => state.createConnection,
  );
  const error = useConnectionStore((state) => state.error);
  const isLoading = useConnectionStore((state) => state.isLoading);
  const [value, setValue] = useState<R2ConnectionCreateInput>(initialValue);
  const provider = value.provider;
  const fields = connectionFields.map((field) =>
    field.key === "endpoint"
      ? {
          ...field,
          required: provider === "r2",
          placeholder:
            provider === "r2"
              ? "https://<account-id>.r2.cloudflarestorage.com"
              : "Optional, e.g. https://s3.us-east-1.amazonaws.com"
        }
      : field
  );

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void createConnection(value).then(() => {
          onCreated();
        });
      }}
    >
      <h2 className="text-sm font-semibold text-app-text">
        Add storage connection
      </h2>
      <div className="grid grid-cols-2 gap-2">
        {(["r2", "s3"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`blue-focus rounded-lg border px-3 py-2 text-left text-xs ${
              provider === item
                ? "border-accent bg-accent-soft text-app-text"
                : "border-app-border/20 bg-white/[0.04] text-app-muted"
            }`}
            onClick={() =>
              setValue((prev) => ({
                ...prev,
                provider: item,
                region: item === "r2" ? "auto" : prev.region === "auto" ? "us-east-1" : prev.region,
                endpoint: item === "s3" && prev.endpoint.includes("r2.cloudflarestorage.com") ? "" : prev.endpoint
              }))
            }
          >
            <span className="flex items-center gap-2 font-semibold">
              {item === "r2" ? <Cloud className="h-4 w-4 text-accent" /> : <Database className="h-4 w-4 text-amber-300" />}
              {item === "r2" ? "Cloudflare R2" : "Amazon S3"}
            </span>
            <span className="mt-1 block text-[11px] text-app-soft">
              {item === "r2" ? "Account endpoint + R2 API token." : "Region + IAM access keys."}
            </span>
          </button>
        ))}
      </div>
      <details className="rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-2 text-xs text-app-muted">
        <summary className="cursor-pointer text-app-text">Where to get the connection values</summary>
        {provider === "r2" ? (
          <div className="mt-2 space-y-1 text-[11px] leading-5">
            <p>Cloudflare Dashboard: R2 Object Storage, then Manage R2 API Tokens.</p>
            <p>Use the account endpoint, bucket name, Access Key ID, Secret Access Key, and optional public bucket URL.</p>
            <p>Account ID enables Cloudflare R2 analytics when a Cloudflare API token is available.</p>
          </div>
        ) : (
          <div className="mt-2 space-y-1 text-[11px] leading-5">
            <p>AWS Console: IAM, create an access key for a user/role with S3 permissions.</p>
            <p>Use bucket name, region, Access Key ID, Secret Access Key, and optional custom endpoint for S3-compatible providers.</p>
            <p>Leave endpoint empty for standard AWS S3; vor2 will use the selected region endpoint.</p>
          </div>
        )}
      </details>
      {fields.map((field) => (
        <label key={field.key} className="block text-xs text-app-muted">
          {field.label}
          <input
            required={field.required}
            type={field.type ?? "text"}
            value={value[field.key] ?? ""}
            onChange={(event) => {
              setValue((prev) => ({
                ...prev,
                [field.key]: event.target.value,
              }));
            }}
            className="blue-focus mt-1 block w-full rounded-lg border border-app-border bg-white/5 px-3 py-2 text-sm text-app-text"
            placeholder={field.placeholder}
          />
        </label>
      ))}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className="blue-focus w-full rounded-lg border border-white/20 bg-accent-strong px-3 py-2 text-xs font-semibold text-white"
      >
        Save connection
      </button>
    </form>
  );
}
