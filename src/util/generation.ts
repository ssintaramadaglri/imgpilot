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

/** Strip the data-URL prefix; photon expects bare base64. */
export const stripDataUrl = (value: string) =>
  value.replace(/^data:image\/(png|jpeg);base64,/, "");

export const buildGenerationPayload = (
  inputImage: string,
  prompt: string,
  size: number,
): GenerationParams => ({
  input_image: stripDataUrl(inputImage),
  prompt,
  ...DEFAULT_GENERATION,
  width: size,
  height: size,
});
