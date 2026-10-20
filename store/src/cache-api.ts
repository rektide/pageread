/**
 * CacheStorage adapter: when a context has the real web `caches` API
 * (pages, service workers), the content store can live in it. URN keys
 * map onto synthetic https URLs (Cache API keys must be fetchable URLs);
 * MIME type and meta ride on Response headers.
 */
import { Emitter, type Subscribable } from "@pageread/signals";
import { etagOf } from "./etag.ts";
import type { ContentStore, PutInput, StoreEvent, StoredEntry } from "./types.ts";
import { matchesFilter } from "./types.ts";

const HOST = "https://pageread.invalid";
const META_HEADER = "x-pageread-meta";

function uriToKey(uri: string): string {
  return `${HOST}/${encodeURIComponent(uri)}`;
}

function keyToUri(key: string): string | undefined {
  if (!key.startsWith(`${HOST}/`)) return undefined;
  return decodeURIComponent(key.slice(HOST.length + 1));
}

async function entryFromResponse(uri: string, res: Response): Promise<StoredEntry> {
  const metaRaw = res.headers.get(META_HEADER);
  let meta: StoredEntry["meta"];
  if (metaRaw) {
    try {
      meta = JSON.parse(metaRaw);
    } catch {
      meta = undefined;
    }
  }
  const body = await res.text();
  return {
    uri,
    mimeType: res.headers.get("content-type") ?? "application/octet-stream",
    body,
    meta,
    etag: res.headers.get("x-pageread-etag") ?? etagOf(body),
    storedAt: Number(res.headers.get("x-pageread-stored-at") ?? "0"),
  };
}

export function cacheApiAvailable(): boolean {
  return typeof globalThis.caches !== "undefined" && typeof globalThis.caches.open === "function";
}

export async function openCacheApiContentStore(
  cacheName = "pageread-content",
): Promise<ContentStore> {
  if (!cacheApiAvailable()) throw new Error("openCacheApiContentStore: caches unavailable");
  const cache = await globalThis.caches.open(cacheName);
  const events = new Emitter<StoreEvent>();
  const key = (uri: string) => uriToKey(uri);

  async function readEntry(uri: string): Promise<StoredEntry | undefined> {
    const res = await cache.match(key(uri));
    return res ? entryFromResponse(uri, res) : undefined;
  }

  return {
    events: events as Subscribable<StoreEvent>,
    async put(input: PutInput): Promise<StoredEntry> {
      // parity with the other backends: detect noop before writing
      const existing = await readEntry(input.uri);
      const etag = etagOf(input.body);
      if (
        existing &&
        existing.etag === etag &&
        existing.mimeType === input.mimeType &&
        JSON.stringify(existing.meta ?? null) === JSON.stringify(input.meta ?? null)
      ) {
        events.emit({ type: "noop", uri: input.uri, etag });
        return existing;
      }
      const headers = new Headers({
        "content-type": input.mimeType,
        "x-pageread-etag": etag,
        "x-pageread-stored-at": String(Date.now()),
      });
      if (input.meta) headers.set(META_HEADER, JSON.stringify(input.meta));
      // text bodies only in this adapter — bytes pass through Response
      // text encoding; binary parity is documented as out of scope here
      const body =
        typeof input.body === "string" ? input.body : new TextDecoder().decode(input.body);
      await cache.put(key(input.uri), new Response(body, { headers }));
      const entry: StoredEntry = {
        uri: input.uri,
        mimeType: input.mimeType,
        body,
        meta: input.meta,
        etag,
        storedAt: Date.now(),
      };
      events.emit({ type: "put", uri: input.uri, entry });
      return entry;
    },
    async match(uri) {
      return readEntry(uri);
    },
    async matchAll(filter) {
      const keys = await cache.keys();
      const out: StoredEntry[] = [];
      for (const k of keys) {
        const uri = keyToUri(k.url);
        if (uri === undefined) continue;
        if (filter?.uriPrefix !== undefined && !uri.startsWith(filter.uriPrefix)) continue;
        const entry = await readEntry(uri);
        if (entry && matchesFilter(entry, filter)) out.push(entry);
      }
      return out.sort((a, b) => (a.uri < b.uri ? -1 : 1));
    },
    async keys(filter) {
      const keys = await cache.keys();
      return keys
        .map((k) => keyToUri(k.url))
        .filter((u): u is string => u !== undefined)
        .filter((uri) => filter?.uriPrefix === undefined || uri.startsWith(filter.uriPrefix))
        .sort();
    },
    async delete(uri) {
      const existing = await readEntry(uri);
      if (!existing) return false;
      await cache.delete(key(uri));
      events.emit({ type: "delete", uri, mimeType: existing.mimeType });
      return true;
    },
  };
}
