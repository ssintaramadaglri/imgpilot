/**
 * Parameters accepted by the photon `/run` endpoint.
 *
 * Keeping them in one place means the defaults used by the UI and the tests
 * can never drift apart.
 */
export interface GenerationParams {
  input_image: string;
  prompt: string;
  guidance_scale: number;
  lcm_steps: number;
  seed: number;
  steps: number;
  strength: number;
  width: number;
  height: number;
}

export const DEFAULT_GENERATION: Omit<GenerationParams, "input_image" | "prompt"> = {
  guidance_scale: 8,
  lcm_steps: 50,
  seed: 2159232,
  steps: 4,
  strength: 0.7,
};

/** Sizes the LCM UNet can actually allocate; anything else OOMs the backend. */
export const ALLOWED_SIZES = [256, 512, 768] as const;

export class InvalidGenerationParams extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidGenerationParams";
  }
}

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Strip the data-URL prefix; photon expects bare base64. */
export const stripDataUrl = (value: string) =>
  value.replace(/^data:image\/(png|jpeg);base64,/, "");

/**
 * Reject or repair bad data before it reaches the inference backend.
 *
 * Bad input previously produced a 500 from photon (or, worse, an OOM on the
 * GPU) with nothing useful in the browser console: NaN sizes from a corrupted
 * localStorage value, a zero/negative strength, or a base64 blob that is not
 * actually an image.
 */
export const validateGenerationParams = (params: {
  input_image: string;
  prompt: string;
  width: number;
  height: number;
}): Pick<GenerationParams, "input_image" | "prompt" | "width" | "height"> => {
  if (typeof params.input_image !== "string" || params.input_image.length === 0) {
    throw new InvalidGenerationParams("input_image is empty");
  }
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(params.input_image)) {
    throw new InvalidGenerationParams("input_image is not valid base64");
  }
  if (typeof params.prompt !== "string" || params.prompt.trim().length === 0) {
    throw new InvalidGenerationParams("prompt is empty");
  }
  for (const key of ["width", "height"] as const) {
    if (!isFiniteNumber(params[key])) {
      throw new InvalidGenerationParams(`${key} is not a finite number`);
    }
  }

  // Snap to the nearest supported resolution instead of failing the request.
  const snap = (value: number) =>
    ALLOWED_SIZES.reduce((best, size) =>
      Math.abs(size - value) < Math.abs(best - value) ? size : best,
    );

  return {
    input_image: params.input_image,
    prompt: params.prompt.trim(),
    width: snap(params.width),
    height: snap(params.height),
  };
};

/** Clamp sampler settings that would make the backend fail or produce noise. */
export const sanitizeSampler = (params: GenerationParams): GenerationParams => ({
  ...params,
  guidance_scale: clamp(params.guidance_scale, 1, 20),
  lcm_steps: clamp(Math.trunc(params.lcm_steps), 1, 100),
  steps: clamp(Math.trunc(params.steps), 1, 150),
  strength: clamp(params.strength, 0, 1),
  seed: Number.isFinite(params.seed) ? Math.trunc(params.seed) : DEFAULT_GENERATION.seed,
});

export const buildGenerationPayload = (
  inputImage: string,
  prompt: string,
  size: number,
): GenerationParams => {
  const { input_image, prompt: cleanPrompt, width, height } = validateGenerationParams({
    input_image: stripDataUrl(inputImage),
    prompt,
    width: size,
    height: size,
  });

  return sanitizeSampler({
    input_image,
    prompt: cleanPrompt,
    ...DEFAULT_GENERATION,
    width,
    height,
  });
};
