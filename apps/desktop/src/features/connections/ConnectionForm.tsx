import { useState } from "react";
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
        Add your R2 connection
      </h2>
      {connectionFields.map((field) => (
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
