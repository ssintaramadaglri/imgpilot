import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { getBase64 } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import { sanitizePrompt } from "@/util/prompt";
import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { useCallback, useRef } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

const isAbort = (e: unknown) =>
  (e instanceof DOMException && e.name === "AbortError") ||
  (e instanceof Error && e.name === "AbortError");

export const useExcalidrawResponse = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
  elements: readonly NonDeletedExcalidrawElement[],
  prompt: string,
  version: string,
) => {
  const safePrompt = sanitizePrompt(prompt);
  const errorCountRef = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const { toast } = useToast();

  const [debouncedSafePrompt] = useDebounce(safePrompt, 600);
  const popupToast = useCallback(() => {
    toast({
      title: "Service Discontinued",
      description:
        "To continue using this service, please set it up using the open-source project.",
      action: (
        <ToastAction asChild altText="Try again">
          <a href="https://github.com/leptonai/imgpilot" target="_blank" rel="noreferrer">
            Github
          </a>
        </ToastAction>
      ),
    });
  }, [toast]);

  const { data, isLoading } = useSWR(
    [elements, debouncedSafePrompt, version],
    async ([params, debouncedSafePrompt]: [readonly NonDeletedExcalidrawElement[], string]) => {
      if (!excalidrawAPI) {
        return "";
      }

      // Every revalidation supersedes the previous one: cancel the in-flight
      // request so the backend is not asked to finish work nobody will see.
      abortController.current?.abort();
      const controller = new AbortController();
      abortController.current = controller;
      const requestId = ++requestIdRef.current;

      try {
        const size = 512;
        const input_image = await getBase64(params, excalidrawAPI, size);
        const image = await fetchImage(
          input_image,
          debouncedSafePrompt,
          size,
          controller.signal,
        );
        // A late response from a superseded request must never overwrite the
        // newer canvas state.
        return requestId === requestIdRef.current ? image : "";
      } catch (e) {
        if (isAbort(e)) {
          return "";
        }
        errorCountRef.current += 1;
        if (errorCountRef.current > 1) {
          popupToast();
          errorCountRef.current = 0;
        }
        return "";
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshInterval: 0,
    },
  );

  return { base64: data as string, loading: isLoading };
};
