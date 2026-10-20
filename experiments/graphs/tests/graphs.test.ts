import "fake-indexeddb/auto";
import { describe, it, expect } from "vitest";
import { freshStore, exportBundle, restoreBundle, queryResult } from "../src/engine.ts";
import { documents, prefix, queries } from "../src/fixture.ts";
import { saveCheckpoint, loadCheckpoint } from "../src/checkpoint.ts";

describe("scoped observations", () => {
  it("overlays only newer covered messages without deleting baseline or importing another branch", () => {
    expect(queryResult(freshStore(), queries["Resolved main branch"])).toEqual([
      { message: "<urn:pageread:conversation:fixture/account-a/c1/message/m1>", text: '"Updated hello"', revision: '"11"^^<http://www.w3.org/2001/XMLSchema#integer>', graph: "<urn:graph:overlay>" },
      { message: "<urn:pageread:conversation:fixture/account-a/c1/message/m2>", text: '"Preserved second message 🌍"', revision: '"10"^^<http://www.w3.org/2001/XMLSchema#integer>', graph: "<urn:graph:baseline>" },
    ]);
  });
  it("keeps named graphs out of default queries unless union is requested", () => {
    const store = freshStore();
    const query = `${prefix}ASK { ?s pr:text ?text }`;
    expect(queryResult(store, query)).toBe(false);
    expect(queryResult(store, query, true)).toBe(true);
  });
  it("retains language, datatype and blank-node semantics across serialization", () => {
    const restored = restoreBundle(exportBundle(freshStore()));
    expect(queryResult(restored, `${prefix}ASK { GRAPH <urn:graph:caveats> { ?s pr:label ?l; pr:count ?c FILTER(isBlank(?s) && lang(?l) = "fr" && datatype(?c) = xsd:integer && ?c = 7) } }`)).toBe(true);
    expect(queryResult(restored, `${prefix}ASK { GRAPH <urn:graph:metadata> { ?s pr:title ?title FILTER(lang(?title) = "en") } }`)).toBe(true);
  });
});
describe("checkpoint iteration", () => {
  it("reopens IDB and rebuilds a new store with identical answers and exact document strings", async () => {
    const source = freshStore();
    const expected = queryResult(source, queries["Resolved main branch"]);
    await saveCheckpoint(exportBundle(source), "roundtrip");
    source.update("DROP ALL");
    expect(source.size).toBe(0);
    const saved = await loadCheckpoint("roundtrip");
    expect(saved?.documents).toEqual(documents);
    expect(queryResult(restoreBundle(saved!), queries["Resolved main branch"])).toEqual(expected);
    expect(restoreBundle(saved!).size).toBe(freshStore().size);
  });
  it("distinguishes absent checkpoints and rejects unsupported versions", async () => {
    expect(await loadCheckpoint("never-saved")).toBeUndefined();
    expect(() => restoreBundle({ ...exportBundle(freshStore()), mapping: "future" } as never)).toThrow("Unsupported");
  });
});
