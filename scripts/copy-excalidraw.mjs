import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// The dev/build scripts previously shelled out to `cp -R`, which is not
// available on Windows shells. Resolve the assets with Node instead.
const src = path.resolve("node_modules/@excalidraw/excalidraw");
const dest = path.resolve("public/excalidraw");

if (!existsSync(src)) {
  console.error("[copy-excalidraw] missing %s - run npm install first", src);
  process.exit(1);
}

await mkdir(path.dirname(dest), { recursive: true });
await cp(src, dest, { recursive: true });
console.log("[copy-excalidraw] %s -> %s", src, dest);
