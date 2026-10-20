import { sha256, toHex } from "@pageread/schema";
import type { ContentStore } from "@pageread/store";
import type { Capture } from "./capture.ts";
import type { ReaderResult } from "./dsl.ts";

/** One committed aggregate preserves coverage with exact input bytes, before projections. */
export async function ingest(
  store: ContentStore,
  result: ReaderResult,
  source: { reader: string; version: string; provider: string; account: string },
  capture: Capture,
): Promise<{ observationUri: string; writtenUris: string[] }> {
  if (!result.observation?.scope) throw new Error("Reader result requires scoped observation");
  const puts = result.puts ?? [];
  const body = JSON.stringify({
    version: 1,
    source,
    capture,
    observation: result.observation,
    puts: puts.map((put) => ({
      ...put,
      body:
        typeof put.body === "string"
          ? { encoding: "utf8", data: put.body }
          : { encoding: "bytes", data: Array.from(put.body) },
    })),
  });
  const observationUri = `urn:pageread:observation:${toHex(sha256(body))}`;
  await store.put({
    uri: observationUri,
    mimeType: "application/vnd.pageread.observation+json",
    body,
  });
  // These are rebuildable projections, not an atomic pair or a resolver.
  for (const put of puts) await store.put(put);
  return { observationUri, writtenUris: puts.map((put) => put.uri) };
}
