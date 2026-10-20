import { expect, it } from "vitest";
import { consumeSseStream } from "../src/main-world/sse.ts";
import { ingest } from "../src/ingest.ts";
import { memoryContentStore } from "@pageread/store";

it("frames byte-split CRLF and UTF-8, dropping incomplete EOF", async () => {
  const bytes = new TextEncoder().encode(
    "event: turn\r\ndata: café\r\ndata: two\r\n\r\ndata: dropped",
  );
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      for (const byte of bytes) c.enqueue(Uint8Array.of(byte));
      c.close();
    },
  });
  const events: unknown[] = [];
  await consumeSseStream(stream, (event) => events.push(event));
  expect(events).toEqual([{ event: "turn", data: "café\ntwo" }]);
});

it("preserves exact binary inputs and scoped coverage in an idempotent aggregate", async () => {
  const store = memoryContentStore();
  const result = {
    puts: [{ uri: "urn:test", mimeType: "application/octet-stream", body: Uint8Array.of(0, 255) }],
    observation: {
      coverage: "partial" as const,
      scope: { conversationUri: "urn:conversation", domain: "messages" as const },
    },
  };
  const capture = { kind: "dom" as const, selector: "main", html: "<main/>", at: 1 };
  const source = { reader: "test", version: "1", provider: "fixture", account: "local" };
  const first = await ingest(store, result, source, capture);
  expect(await ingest(store, result, source, capture)).toEqual(first);
  const saved = JSON.parse((await store.match(first.observationUri))!.body as string);
  expect(saved.puts[0].body).toEqual({ encoding: "bytes", data: [0, 255] });
  expect(saved.observation).toEqual(result.observation);
});
