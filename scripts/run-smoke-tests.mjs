import { build } from "esbuild";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const outFile = resolve(rootDir, ".tmp-smoke-tests.mjs");

try {
  await build({
    entryPoints: [resolve(rootDir, "smoke-tests.ts")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile: outFile,
  });

  await import(pathToFileURL(outFile).href);
} finally {
  await rm(outFile, { force: true });
}
