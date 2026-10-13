import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCensored, sanitizePrompt } from "./prompt";

describe("isCensored", () => {
  it("matches only own properties of the word list", () => {
    assert.equal(isCensored("constructor"), false);
    assert.equal(isCensored("toString"), false);
    assert.equal(isCensored("hasOwnProperty"), false);
    assert.equal(isCensored("__proto__"), false);
  });

  it("is case insensitive", () => {
    assert.equal(isCensored("TOSTRING"), isCensored("tostring"));
  });
});

describe("sanitizePrompt", () => {
  it("keeps Object.prototype words", () => {
    assert.equal(sanitizePrompt("a toString texture"), "a toString texture");
  });

  it("strips characters the model cannot use", () => {
    assert.equal(sanitizePrompt("chrome #ff0000 <style>"), "chrome ff0000 style");
  });

  it("collapses empty segments", () => {
    assert.equal(sanitizePrompt("  chrome   metal "), "chrome   metal");
  });
});
