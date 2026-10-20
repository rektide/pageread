import { Emitter, type Subscribable } from "@pageread/signals";
import { etagOf } from "./etag.ts";
import type { ContentStore, PutInput, StoreEvent, StoredEntry } from "./types.ts";
import { matchesFilter } from "./types.ts";

/** In-memory content store — tests, node, and ephemeral sessions. */
export function memoryContentStore(): ContentStore {
	const entries = new Map<string, StoredEntry>();
	const events = new Emitter<StoreEvent>();
	return {
		events: events as Subscribable<StoreEvent>,
		async put(input: PutInput): Promise<StoredEntry> {
			const etag = etagOf(input.body);
			const existing = entries.get(input.uri);
			if (existing && existing.etag === etag) {
				events.emit({ type: "noop", uri: input.uri, etag });
				return existing;
			}
			const entry: StoredEntry = {
				uri: input.uri,
				mimeType: input.mimeType,
				body: input.body,
				meta: input.meta,
				etag,
				storedAt: Date.now(),
			};
			entries.set(input.uri, entry);
			events.emit({ type: "put", entry });
			return entry;
		},
		async match(uri) {
			return entries.get(uri);
		},
		async matchAll(filter) {
			return [...entries.values()].filter((e) => matchesFilter(e, filter));
		},
		async keys(filter) {
			return [...entries.values()]
				.filter((e) => matchesFilter(e, filter))
				.map((e) => e.uri);
		},
		async delete(uri) {
			const existing = entries.get(uri);
			if (!existing) return false;
			entries.delete(uri);
			events.emit({ type: "delete", uri, mimeType: existing.mimeType });
			return true;
		},
	};
}
