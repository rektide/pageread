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

function entryFromResponse(uri: string, res: Response): Promise<StoredEntry> {
	const metaRaw = res.headers.get(META_HEADER);
	let meta: StoredEntry["meta"];
	if (metaRaw) {
		try {
			meta = JSON.parse(metaRaw);
		} catch {
			meta = undefined;
		}
	}
	return res.text().then((body) => ({
		uri,
		mimeType: res.headers.get("content-type") ?? "application/octet-stream",
		body,
		meta,
		etag: etagOf(body),
		storedAt: Number(res.headers.get("x-pageread-stored-at") ?? "0"),
	}));
}

export function cacheApiAvailable(): boolean {
	return typeof globalThis.caches !== "undefined" && typeof globalThis.caches.open === "function";
}

export async function openCacheApiContentStore(cacheName = "pageread-content"): Promise<ContentStore> {
	if (!cacheApiAvailable()) throw new Error("openCacheApiContentStore: caches unavailable");
	const cache = await globalThis.caches.open(cacheName);
	const events = new Emitter<StoreEvent>();

	return {
		events: events as Subscribable<StoreEvent>,
		async put(input: PutInput): Promise<StoredEntry> {
			const headers = new Headers({
				"content-type": input.mimeType,
				"x-pageread-stored-at": String(Date.now()),
			});
			if (input.meta) headers.set(META_HEADER, JSON.stringify(input.meta));
			await cache.put(uriToKey(input.uri), new Response(input.body, { headers }));
			const entry = await (await cache.match(uriToKey(input.uri)))!.text().then((body) => ({
				uri: input.uri,
				mimeType: input.mimeType,
				body,
				meta: input.meta,
				etag: etagOf(body),
				storedAt: Date.now(),
			}));
			events.emit({ type: "put", entry });
			return entry;
		},
		async match(uri) {
			const res = await cache.match(uriToKey(uri));
			return res ? entryFromResponse(uri, res) : undefined;
		},
		async matchAll(filter) {
			const keys = await cache.keys();
			const out: StoredEntry[] = [];
			for (const key of keys) {
				const uri = keyToUri(key.url);
				if (uri === undefined) continue;
				if (!matchesFilter({ uri, mimeType: "" }, filter)) continue;
				const res = await cache.match(key);
				if (!res) continue;
				const entry = await entryFromResponse(uri, res);
				if (matchesFilter(entry, filter)) out.push(entry);
			}
			return out.sort((a, b) => (a.uri < b.uri ? -1 : 1));
		},
		async keys(filter) {
			const keys = await cache.keys();
			const uris = keys
				.map((k) => keyToUri(k.url))
				.filter((u): u is string => u !== undefined);
			return uris
				.filter((uri) => matchesFilter({ uri, mimeType: "" }, filter))
				.sort();
		},
		async delete(uri) {
			const existing = await cache.match(uriToKey(uri));
			if (!existing) return false;
			const mimeType = existing.headers.get("content-type") ?? "application/octet-stream";
			await cache.delete(uriToKey(uri));
			events.emit({ type: "delete", uri, mimeType });
			return true;
		},
	};
}
