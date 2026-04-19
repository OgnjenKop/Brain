import esbuild from "esbuild";
import { promises as fs } from "fs";

const isWatch = process.argv.includes("--watch");

const stripNodePrefixPlugin = {
  name: "strip-node-prefix",
  setup(build) {
    build.onEnd(async (result) => {
      if (result.errors.length > 0) {
        return;
      }

      const outputPath = build.initialOptions.outfile;
      if (!outputPath) {
        return;
      }

      const bundle = await fs.readFile(outputPath, "utf8");
      const normalized = bundle.replaceAll('"node:', '"');
      if (normalized !== bundle) {
        await fs.writeFile(outputPath, normalized, "utf8");
      }
    });
  },
};

const shared = {
  entryPoints: ["main.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2018",
  external: ["obsidian", "electron"],
  outfile: "main.js",
  sourcemap: "inline",
  plugins: [stripNodePrefixPlugin],
};

async function buildOnce() {
  if (!isWatch) {
    await esbuild.build(shared);
    return;
  }

  const context = await esbuild.context(shared);
  await context.watch();
  console.log("[brain] watching for changes");
}

buildOnce().catch((error) => {
  console.error(error);
  process.exit(1);
});
