import { readFile, readdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
for (const name of ["schema", "signals", "store", "indexer", "extension-kit"]) {
  const files = await readdir(new URL(`${name}/dist/`, root), { recursive: true });
  assert(files.filter((file) => file.endsWith(".js")).length >= 3, `${name}: module tree missing`);
  const pkg = JSON.parse(await readFile(new URL(`${name}/package.json`, root), "utf8"));
  assert.equal(pkg.exports["."].import, "./dist/index.js");
  await import(fileURLToPath(new URL(`${name}/dist/index.js`, root)));
  console.log(`${name}: ${files.length} distribution files, ESM import successful`);
}
const manifest = JSON.parse(
  await readFile(new URL("extensions/fixture/.output/chrome-mv3/manifest.json", root), "utf8"),
);
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.background.type, "module");
const packaged = await readdir(new URL("extensions/fixture/.output/chrome-mv3/modules/", root), {
  recursive: true,
});
assert(packaged.includes("store/dist/idb.js"));
assert(packaged.includes("indexer/dist/factory.js"));
assert(manifest.content_scripts.some((entry: { world?: string }) => entry.world === "MAIN"));
assert(manifest.content_scripts.some((entry: { world?: string }) => entry.world === "ISOLATED"));
console.log("WXT artifact: MV3 MAIN + ISOLATED entrypoints, preserved background module tree");
