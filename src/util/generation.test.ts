import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ALLOWED_SIZES,
  InvalidGenerationParams,
  buildGenerationPayload,
  sanitizeSampler,
  validateGenerationParams,
} from "./generation";

const img = "aGVsbG8=";

describe("validateGenerationParams", () => {
  it("rejects empty and non-base64 images", () => {
    assert.throws(() =>
      validateGenerationParams({ input_image: "", prompt: "chrome", width: 512, height: 512 }),
      InvalidGenerationParams,
    );
    assert.throws(() =>
      validateGenerationParams({ input_image: "not base64!!", prompt: "chrome", width: 512, height: 512 }),
      InvalidGenerationParams,
    );
  });

  it("rejects empty prompts", () => {
    assert.throws(
      () => validateGenerationParams({ input_image: img, prompt: "   ", width: 512, height: 512 }),
      InvalidGenerationParams,
    );
  });

  it("rejects non-finite sizes", () => {
    assert.throws(
      () => validateGenerationParams({ input_image: img, prompt: "chrome", width: NaN, height: 512 }),
      InvalidGenerationParams,
    );
    assert.throws(
      () => validateGenerationParams({ input_image: img, prompt: "chrome", width: Infinity, height: 512 }),
      InvalidGenerationParams,
    );
  });

  it("snaps unsupported sizes to a supported resolution", () => {
    const out = validateGenerationParams({ input_image: img, prompt: " chrome ", width: 600, height: 400 });
    assert.ok(ALLOWED_SIZES.includes(out.width as (typeof ALLOWED_SIZES)[number]));
    assert.equal(out.width, 512);
    assert.equal(out.height, 512);
    assert.equal(out.prompt, "chrome");
  });
});

describe("sanitizeSampler", () => {
  const base = {
    input_image: img, prompt: "chrome", guidance_scale: 8, lcm_steps: 50,
    seed: 1, steps: 4, strength: 0.7, width: 512, height: 512,
  };

  it("clamps out-of-range sampler values", () => {
    const out = sanitizeSampler({ ...base, guidance_scale: 900, lcm_steps: -3, steps: 0, strength: 4 });
    assert.equal(out.guidance_scale, 20);
    assert.equal(out.lcm_steps, 1);
    assert.equal(out.steps, 1);
    assert.equal(out.strength, 1);
  });

  it("replaces a non-finite seed with the default", () => {
    assert.equal(sanitizeSampler({ ...base, seed: NaN }).seed, 2159232);
  });
});

describe("buildGenerationPayload", () => {
  it("strips the data-url prefix", () => {
    const out = buildGenerationPayload(`data:image/png;base64,${img}`, "chrome", 512);
    assert.equal(out.input_image, img);
    assert.equal(out.width, 512);
    assert.equal(out.height, 512);
  });
});
