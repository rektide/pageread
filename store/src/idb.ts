/**
 * IndexedDB-backed content store: the primary backend. Works in window
 * contexts, extension service workers, and node (via fake-indexeddb).
 */
import { Emitter, type Subscribable } from "@pageread/signals";
import { etagOf } from "./etag.ts";
import type { ContentStore, PutInput, StoreEvent, StoredEntry } from "./types.ts";
import { matchesFilter } from "./types.ts";

const DB_VERSION = 1;
const STORE = "contents";

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export async function openIdbContentStore(dbName = "pageread-content"): Promise<ContentStore> {
	const indexedDB_ = globalThis.indexedDB;
	if (!indexedDB_) throw new Error("openIdbContentStore: indexedDB unavailable");
	const db = await new Promise<IDBDatabase>((resolve, reject) => {
		const req = indexedDB_.open(dbName, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) {
				const os = db.createObjectStore(STORE, { keyPath: "uri" });
				os.createIndex("mimeType", "mimeType");
			}
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});

	const events = new Emitter<StoreEvent>();
	const tx = (mode: IDBTransactionMode) => db.transaction(STORE, mode).objectStore(STORE);

	return {
		events: events as Subscribable<StoreEvent>,
		async put(input: PutInput): Promise<StoredEntry> {
			const etag = etagOf(input.body);
			const existing = await reqToPromise(tx("readonly").get(input.uri)) as
				| StoredEntry
				| undefined;
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
			await reqToPromise(tx("readwrite").put(entry));
			events.emit({ type: "put", entry });
			return entry;
		},
		async match(uri) {
			return (await reqToPromise(tx("readonly").get(uri))) as StoredEntry | undefined;
		},
		async matchAll(filter) {
			const all = (await reqToPromise(tx("readonly").getAll())) as StoredEntry[];
			return all.filter((e) => matchesFilter(e, filter)).sort((a, b) =>
				a.uri < b.uri ? -1 : a.uri > b.uri ? 1 : 0,
			);
		},
		async keys(filter) {
			const all = (await reqToPromise(tx("readonly").getAll())) as StoredEntry[];
			return all
				.filter((e) => matchesFilter(e, filter))
				.map((e) => e.uri)
				.sort();
		},
		async delete(uri) {
			const existing = await reqToPromise(tx("readonly").get(uri)) as
				| StoredEntry
				| undefined;
			if (!existing) return false;
			await reqToPromise(tx("readwrite").delete(uri));
			events.emit({ type: "delete", uri, mimeType: existing.mimeType });
			return true;
		},
	};
}
