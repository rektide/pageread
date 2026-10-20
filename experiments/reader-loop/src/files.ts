import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Operation, ReaderArtifact, Registry } from "./index.ts";

/** One writer per operation. Atomic file replacement, not an atomic multi-record transaction. */
export async function fileRegistry(directory: string): Promise<Registry> {
  await Promise.all(["operations", "artifacts"].map((kind) => mkdir(join(directory, kind), { recursive: true })));
  function path(kind: string, id: string): string {
    if (!/^[a-zA-Z0-9-]+$/.test(id)) throw new Error("Invalid registry ID");
    return join(directory, kind, `${id}.json`);
  }
  async function put(kind: string, value: { id: string }): Promise<void> {
    const destination = path(kind, value.id);
    const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
    await writeFile(temporary, JSON.stringify(value, null, 2));
    await rename(temporary, destination);
  }
  return {
    putOperation: (operation) => put("operations", operation),
    putArtifact: (artifact) => put("artifacts", artifact),
    async getArtifact(id) {
      try {
        return JSON.parse(await readFile(path("artifacts", id), "utf8")) as ReaderArtifact;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
      }
    },
    async operations() {
      const files = (await readdir(join(directory, "operations"))).filter((name) => name.endsWith(".json")).sort();
      return Promise.all(files.map(async (name) => JSON.parse(await readFile(join(directory, "operations", name), "utf8")) as Operation));
    },
  };
}
