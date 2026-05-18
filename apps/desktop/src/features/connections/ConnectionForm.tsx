import { useState } from "react";
import { Cloud, Database, LogOut } from "lucide-react";
import { useAuthStore } from "@/features/auth/auth.store";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";
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

const r2EndpointFromAccountId = (accountId: string) =>
  accountId.trim()
    ? `https://${accountId.trim()}.r2.cloudflarestorage.com`
    : "";

const isAutoR2Endpoint = (endpoint: string, accountId: string) => {
  if (!endpoint.trim()) {
    return true;
  }
  return endpoint.trim() === r2EndpointFromAccountId(accountId);
};

export function ConnectionForm({ onCreated }: { onCreated: () => void }) {
  const createConnection = useConnectionStore(
    (state) => state.createConnection,
  );
  const error = useConnectionStore((state) => state.error);
  const isLoading = useConnectionStore((state) => state.isLoading);
  const signOut = useAuthStore((state) => state.signOut);
  const authLoading = useAuthStore((state) => state.isLoading);
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
              : "Optional, e.g. https://s3.us-east-1.amazonaws.com",
        }
      : field,
  );

  return (
    <form
      className="min-w-0 space-y-3 overflow-x-hidden max-h-[80vh] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void createConnection(value).then(() => {
          onCreated();
        });
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-app-text">
          Add storage connection
        </h2>
        <button
          type="button"
          disabled={authLoading}
          className="blue-focus inline-flex items-center gap-1.5 rounded-lg border border-app-border/20 bg-white/[0.04] px-2.5 py-1.5 text-xs text-app-muted hover:text-app-text disabled:opacity-60"
          onClick={() => {
            void signOut();
          }}
        >
          {authLoading ? (
            <LoadingIndicator text="Signing out..." />
          ) : (
            <>
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </>
          )}
        </button>
      </div>
      <div className="grid min-w-0 grid-cols-2 gap-2">
        {(["r2", "s3"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={`blue-focus min-w-0 rounded-lg border px-3 py-2 text-left text-xs ${
              provider === item
                ? "border-accent bg-accent-soft text-app-text"
                : "border-app-border/20 bg-white/[0.04] text-app-muted"
            }`}
            onClick={() =>
              setValue((prev) => ({
                ...prev,
                provider: item,
                region:
                  item === "r2"
                    ? "auto"
                    : prev.region === "auto"
                      ? "us-east-1"
                      : prev.region,
                endpoint:
                  item === "s3" &&
                  prev.endpoint.includes("r2.cloudflarestorage.com")
                    ? ""
                    : prev.endpoint,
              }))
            }
          >
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              {item === "r2" ? (
                <Cloud className="h-4 w-4 text-accent" />
              ) : (
                <Database className="h-4 w-4 text-amber-300" />
              )}
              <span className="truncate">
                {item === "r2" ? "Cloudflare R2" : "Amazon S3"}
              </span>
            </span>
            <span className="mt-1 block text-[11px] text-app-soft">
              {item === "r2"
                ? "Account endpoint + R2 API token."
                : "Region + IAM access keys."}
            </span>
          </button>
        ))}
      </div>
      <details className="max-w-full overflow-x-hidden rounded-lg border border-app-border/20 bg-white/[0.04] px-3 py-2 text-xs text-app-muted">
        <summary className="cursor-pointer text-app-text">
          Where to get the connection values
        </summary>
        {provider === "r2" ? (
          <div className="mt-2 min-w-0 space-y-1 break-words text-[11px] leading-5">
            <p>
              Cloudflare Dashboard: R2 Object Storage, then Manage R2 API
              Tokens.
            </p>
            <p>
              Use the account endpoint, bucket name, Access Key ID, Secret
              Access Key, and optional public bucket URL.
            </p>
            <p>
              Account ID enables Cloudflare R2 analytics when a Cloudflare API
              token is available.
            </p>
          </div>
        ) : (
          <div className="mt-2 min-w-0 space-y-1 break-words text-[11px] leading-5">
            <p>
              AWS Console: IAM, create an access key for a user/role with S3
              permissions.
            </p>
            <p>
              Use bucket name, region, Access Key ID, Secret Access Key, and
              optional custom endpoint for S3-compatible providers.
            </p>
            <p>
              Leave endpoint empty for standard AWS S3; vor2 will use the
              selected region endpoint.
            </p>
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
              const nextValue = event.target.value;
              setValue((prev) => ({
                ...prev,
                [field.key]: nextValue,
                endpoint:
                  provider === "r2" &&
                  field.key === "accountId" &&
                  isAutoR2Endpoint(prev.endpoint, prev.accountId ?? "")
                    ? r2EndpointFromAccountId(nextValue)
                    : prev.endpoint,
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
        {isLoading ? (
          <LoadingIndicator
            className="justify-center text-white"
            spinnerClassName="border-white/30 border-t-white"
            text="Saving connection..."
          />
        ) : (
          "Save connection"
        )}
      </button>
    </form>
  );
}
