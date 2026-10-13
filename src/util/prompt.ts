import { cuss } from "cuss";

const CENSORED = cuss as Record<string, unknown>;

/**
 * Own-property check only: `word in cuss` also matches Object.prototype keys
 * ("constructor", "toString", ...) and silently deletes them from prompts.
 */
export const isCensored = (word: string) =>
  Object.prototype.hasOwnProperty.call(CENSORED, word.toLowerCase());

/** Drop censored words and characters the model cannot use. */
export const sanitizePrompt = (prompt: string) =>
  prompt
    .split(" ")
    .filter((word) => word !== "" && !isCensored(word))
    .join(" ")
    .replace(/[^a-zA-Z,.!? ]/g, "");
