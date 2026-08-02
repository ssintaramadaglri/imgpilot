import { blobToBase64 } from "@/lib/utils";
import { buildGenerationPayload } from "@/util/generation";

export const fetchImage = async (
  input_image: string,
  prompt: string,
  size: number,
  signal?: AbortSignal,
) => {
  const response = await fetch("/api/run", {
    headers: {
      accept: "image/jpeg",
      "content-type": "application/json",
    },
    body: JSON.stringify(buildGenerationPayload(input_image, prompt, size)),
    method: "POST",
    signal,
  });
  if (response.status !== 200) throw new Error("Failed to fetch image");
  const blob = await response.blob();
  return await blobToBase64(blob);
};
