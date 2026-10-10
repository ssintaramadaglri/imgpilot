import { artStyles, paintingTypes, presets } from "@/util/presets";
import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";

export const getNonDeletedElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (element) => !element.isDeleted,
  ) as readonly NonDeletedExcalidrawElement[];

export type LocalState = {
  style: string;
  prompt: string;
  image: string;
  elements: readonly ExcalidrawElement[];
};

export const STORAGE_KEYS = {
  LOCAL_STORAGE_ELEMENTS: "imgpilot_elements",
  LOCAL_STORAGE_IMAGE: "imgpilot_image",
  LOCAL_STORAGE_APP_STATE: "imgpilot_app_state",
  LOCAL_STORAGE_LOCAL_STATE: "imgpilot_local_state",
} as const;

const getLocalStorage = () => {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  } else {
    return null;
  }
};

const firstPreset = presets[0];

export const defaultLocalState = (): LocalState => ({
  style: `${paintingTypes[0]} ${artStyles[0]}`,
  prompt: firstPreset?.prompt ?? "",
  image: firstPreset?.base64 ?? "",
  elements: firstPreset?.elements ?? [],
});

const asString = (value: unknown, fallback: string) =>
  typeof value === "string" ? value : fallback;

const isQuotaError = (error: unknown) =>
  error instanceof DOMException &&
  (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");

/**
 * Repairs partially corrupt saved state field by field instead of throwing the
 * whole session away: a single bad entry used to discard the user's sketch.
 */
export const normalizeLocalState = (raw: unknown): LocalState => {
  const fallback = defaultLocalState();
  if (typeof raw !== "object" || raw === null) {
    return fallback;
  }
  const parsed = raw as Partial<Record<keyof LocalState, unknown>>;

  return {
    style: asString(parsed.style, fallback.style),
    prompt: asString(parsed.prompt, fallback.prompt),
    image: asString(parsed.image, fallback.image),
    elements: Array.isArray(parsed.elements)
      ? clearElementsForLocalStorage(parsed.elements as ExcalidrawElement[])
      : fallback.elements,
  };
};

export const getLocalState = (): LocalState => {
  const storage = getLocalStorage();
  const raw = storage?.getItem(STORAGE_KEYS.LOCAL_STORAGE_LOCAL_STATE);
  if (!raw) {
    return defaultLocalState();
  }

  try {
    return normalizeLocalState(JSON.parse(raw));
  } catch (error) {
    // Corrupt JSON: drop the bad entry so the next save starts clean.
    console.error("imgpilot: discarding unreadable local state", error);
    storage?.removeItem(STORAGE_KEYS.LOCAL_STORAGE_LOCAL_STATE);
    return defaultLocalState();
  }
};

export const saveToLocalState = (state: LocalState) => {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(STORAGE_KEYS.LOCAL_STORAGE_LOCAL_STATE, JSON.stringify(state));
    return true;
  } catch (error) {
    if (!isQuotaError(error)) {
      throw error;
    }
    // The base64 preview is the bulk of the payload; drop it and keep the
    // drawing rather than losing both.
    try {
      storage.setItem(
        STORAGE_KEYS.LOCAL_STORAGE_LOCAL_STATE,
        JSON.stringify({ ...state, image: "" }),
      );
      return true;
    } catch {
      storage.removeItem(STORAGE_KEYS.LOCAL_STORAGE_LOCAL_STATE);
      return false;
    }
  }
};

export const isLinearElementType = (
  elementType: AppState["activeTool"]["type"],
): boolean => {
  return (
    elementType === "arrow" || elementType === "line" // || elementType === "freedraw"
  );
};

const _clearElements = (
  elements: readonly ExcalidrawElement[],
): ExcalidrawElement[] =>
  getNonDeletedElements(elements).map((element) =>
    isLinearElementType(element.type)
      ? { ...element, lastCommittedPoint: null }
      : element,
  );
export const clearElementsForLocalStorage = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);
