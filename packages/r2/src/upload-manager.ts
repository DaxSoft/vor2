import type { UploadPolicy } from "./r2-types";

export const defaultUploadPolicy: UploadPolicy = {
  maxConcurrentUploads: 3,
  retryAttempts: 3,
  retryBackoffMs: [800, 1600, 3200]
};

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  policy: UploadPolicy = defaultUploadPolicy
): Promise<T> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < policy.retryAttempts) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const delay = policy.retryBackoffMs[attempt] ?? policy.retryBackoffMs.at(-1) ?? 3200;
      await new Promise((resolve) => {
        setTimeout(resolve, delay);
      });
      attempt += 1;
    }
  }

  throw lastError;
}
