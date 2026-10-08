import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MAX_BLOB_BYTES = 8 * 1024 * 1024;

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (blob.size === 0) {
      reject(new Error("blobToBase64: received an empty blob"));
      return;
    }
    if (blob.size > MAX_BLOB_BYTES) {
      reject(
        new Error(
          `blobToBase64: blob is ${blob.size} bytes, limit is ${MAX_BLOB_BYTES}`,
        ),
      );
      return;
    }

    const reader = new FileReader();

    reader.onerror = () =>
      reject(reader.error ?? new Error("blobToBase64: FileReader failed"));
    reader.onabort = () => reject(new Error("blobToBase64: read aborted"));
    reader.onloadend = () => {
      const { result } = reader;
      if (typeof result !== "string" || !result.startsWith("data:")) {
        reject(new Error("blobToBase64: FileReader produced no data URL"));
        return;
      }
      resolve(result);
    };

    reader.readAsDataURL(blob);
  });
}

export function getRandomDifferent<T>(arr: T[], lastItem: T | null): T {
  if (arr.length === 0) {
    throw new RangeError("getRandomDifferent: array must not be empty");
  }
  if (arr.length === 1) {
    return arr[0];
  }

  const pool = lastItem === null ? arr : arr.filter((item) => item !== lastItem);
  if (pool.length === 0) {
    return arr[0];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
