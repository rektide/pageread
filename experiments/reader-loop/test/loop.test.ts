import { strict as assert } from "node:assert";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import { JSDOM } from "jsdom";
import { chromeUserScripts, httpAgent, memoryRegistry, readWithAgent } from "../src/index.ts";
import type { ReaderArtifact, ReadRequest, UserScriptsApi } from "../src/index.ts";
import { fileRegistry } from "../src/files.ts";

const request: ReadRequest = {
  instruction: "Read messages", matches: ["https://chat.example/*"],
  page: { url: "https://chat.example/c/1", mimeType: "text/html", body: '<p data-id="a">Hello</p>', coverage: "partial" },
};

test("HTTP dispatch carries evidence; generated reader executes against fixture and survives registry reopen", async () => {
  const directory = await mkdtemp(join("/tmp/opencode", "pageread-loop-"));
  const server = setupServer(http.post("https://agent.example/generate", async ({ request: incoming }) => {
    const payload = await incoming.json() as { page: { coverage: string }; prompt: string };
    assert.equal(payload.page.coverage, "partial");
    assert.ok(payload.prompt.includes(request.page.body.replaceAll('"', '\\"')));
    return HttpResponse.json({ code: "Array.from(document.querySelectorAll('[data-id]'), el => el.textContent)" });
  }));
  server.listen({ onUnhandledFrame: "error" });
  const dom = new JSDOM(request.page.body, { runScripts: "outside-only" });
  try {
    const registry = await fileRegistry(directory);
    const output = await readWithAgent(request, {
      registry, agent: httpAgent("https://agent.example/generate"),
      runtime: { async register() {}, async execute(reader) { return dom.window.eval(reader.code) as unknown; } },
    }, 1);
    assert.equal(JSON.stringify(output.result), '["Hello"]');
    const reopened = await fileRegistry(directory);
    assert.equal((await reopened.operations())[0]?.phase, "completed");
    assert.deepEqual(await reopened.getArtifact(output.artifact.id), output.artifact);
  } finally {
    dom.window.close(); server.close(); await rm(directory, { recursive: true });
  }
});

test("inflight is inspectable while generation is pending; failures retain the reader", async () => {
  const registry = memoryRegistry();
  let release!: (value: unknown) => void;
  const pending = new Promise<unknown>((resolve) => { release = resolve; });
  const attempt = readWithAgent(request, {
    registry, agent: { name: "deferred-fixture", generate: () => pending },
    runtime: { async register() { throw new Error("registration failed"); }, async execute() { assert.fail("must not execute"); } },
  }, 2);
  assert.equal((await registry.operations())[0]?.phase, "awaiting-agent");
  release({ code: "[]" });
  await assert.rejects(attempt, /registration failed/);
  const operation = (await registry.operations())[0]!;
  assert.equal(operation.phase, "failed");
  assert.equal((await registry.getArtifact(operation.artifactId!))?.code, "[]");
});

test("malformed agent result cannot reach the runtime", async () => {
  const registry = memoryRegistry();
  await assert.rejects(readWithAgent(request, {
    registry, agent: { name: "bad-fixture", async generate() { return { code: "" }; } },
    runtime: { async register() { assert.fail(); }, async execute() { assert.fail(); } },
  }, 2), /empty/);
  assert.equal((await registry.operations())[0]?.artifactId, undefined);
});

test("Chrome adapter updates known readers and surfaces asynchronous API denial and execution errors", async () => {
  const reader: ReaderArtifact = { id: "reader-test", code: "[]", matches: request.matches, runtime: "chrome-user-script", mimeType: "text/javascript", generatedBy: "fixture", operationId: "test" };
  let updated = false;
  const api: UserScriptsApi = {
    async getScripts() { return [{ id: reader.id }]; },
    async register() { assert.fail("existing reader must be updated"); },
    async update(scripts) { assert.equal(scripts[0]?.world, "USER_SCRIPT"); updated = true; },
    async execute() { return [{ frameId: 0, documentId: "d", error: "bad reader" }]; },
  };
  const runtime = chromeUserScripts(api);
  await runtime.register(reader);
  assert.equal(updated, true);
  await assert.rejects(runtime.execute(reader, 1), /bad reader/);
  api.getScripts = async () => { throw new Error("API disabled"); };
  await assert.rejects(runtime.register(reader), /API disabled/);
  await assert.rejects(chromeUserScripts(undefined).register(reader), /unavailable/);
});
