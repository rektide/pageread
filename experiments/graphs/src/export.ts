#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { freshStore, exportBundle } from "./engine.ts";

const directory = new URL("../exports/", import.meta.url);
await mkdir(directory, { recursive: true });
const store = freshStore();
const bundle = exportBundle(store);
await Promise.all([
  writeFile(new URL("bundle.json", directory), JSON.stringify(bundle, null, 2)),
  writeFile(new URL("dataset.nq", directory), bundle.nquads),
  writeFile(new URL("dataset.trig", directory), store.dump({ format: "application/trig" })),
]);
console.log(`Exported ${store.size} quads and ${bundle.documents.length} exact documents to ${directory.pathname}`);
