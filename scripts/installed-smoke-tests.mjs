import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vaultPath = process.env.OBSIDIAN_VAULT
  ?? "/Users/ognjen.koprivica/Documents/Obsidian_Vault";
const pluginDir = resolve(vaultPath, ".obsidian/plugins/brain");
const requiredFiles = ["main.js", "manifest.json", "styles.css"];

for (const file of requiredFiles) {
  const installedPath = resolve(pluginDir, file);
  const sourcePath = resolve(root, file);
  await stat(installedPath);
  const installed = await readFile(installedPath, "utf8");
  const source = await readFile(sourcePath, "utf8");
  assert.equal(installed, source, `${file} is not installed from the current build`);
}

const manifest = JSON.parse(await readFile(resolve(pluginDir, "manifest.json"), "utf8"));
assert.equal(manifest.id, "brain");
assert.equal(manifest.main, "main.js");
assert.equal(manifest.isDesktopOnly, true);

const bundle = await readFile(resolve(pluginDir, "main.js"), "utf8");
assert.match(bundle, /brain-sidebar-view/);
assert.match(bundle, /open-vault-chat/);
assert.match(bundle, /open-instructions/);

console.log(`installed plugin smoke test passed for ${pluginDir}`);
