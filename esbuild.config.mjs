import esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const shared = {
  entryPoints: ["main.ts"],
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2018",
  external: ["obsidian", "electron"],
  outfile: "main.js",
  sourcemap: "inline",
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
