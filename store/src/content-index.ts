/**
 * The ContentIndex facade: the Content-Indexing-API shape
 * (id/title/description/category/icons, add/delete/getAll) layered over a
 * content store. The directory persists as a MIME-typed store document,
 * and the facade is itself an event source.
 */
import { MEDIA_TYPES, URN_STEMS, type JsonValue } from "@pageread/schema";
import { Emitter, type Subscribable } from "@pageread/signals";
import type { ContentStore } from "./types.ts";

export interface ContentIndexIcon {
	src: string;
	sizes?: string;
	type?: string;
}

export interface ContentIndexEntry {
	id: string;
	/** content-store URI of the indexed content */
	url: string;
	title: string;
	description?: string;
	/** the spec's categories, extended with pageread kinds like "chat-transcript" */
	category: "article" | "homepage" | "video" | "audio" | (string & {});
	icons?: ContentIndexIcon[];
	updatedAt?: number;
}

export type ContentIndexEvent =
	| { type: "add"; entry: ContentIndexEntry }
	| { type: "delete"; id: string };

export interface ContentIndexFacade {
	add(entry: ContentIndexEntry): Promise<void>;
	get(id: string): Promise<ContentIndexEntry | undefined>;
	getAll(): Promise<ContentIndexEntry[]>;
	delete(id: string): Promise<boolean>;
	deleteAll(): Promise<void>;
	readonly events: Subscribable<ContentIndexEvent>;
}

interface DirectoryDoc {
	entries: ContentIndexEntry[];
}

export function contentIndexOver(
	store: ContentStore,
	opts?: { directoryUri?: string },
): ContentIndexFacade {
	const directoryUri = opts?.directoryUri ?? URN_STEMS.directory;
	const events = new Emitter<ContentIndexEvent>();

	async function readDirectory(): Promise<DirectoryDoc> {
		const entry = await store.match(directoryUri);
		if (!entry) return { entries: [] };
		try {
			const doc = JSON.parse(typeof entry.body === "string" ? entry.body : "") as DirectoryDoc;
			return Array.isArray(doc.entries) ? doc : { entries: [] };
		} catch {
			return { entries: [] };
		}
	}

	async function writeDirectory(entries: ContentIndexEntry[]): Promise<void> {
		entries.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
		await store.put({
			uri: directoryUri,
			mimeType: MEDIA_TYPES.directory,
			body: JSON.stringify({ entries } satisfies DirectoryDoc),
			meta: { count: entries.length } as Record<string, JsonValue>,
		});
	}

	return {
		events: events as Subscribable<ContentIndexEvent>,
		async add(entry) {
			const dir = await readDirectory();
			const idx = dir.entries.findIndex((e) => e.id === entry.id);
			const withTime = { ...entry, updatedAt: entry.updatedAt ?? Date.now() };
			if (idx >= 0) dir.entries[idx] = withTime;
			else dir.entries.push(withTime);
			await writeDirectory(dir.entries);
			events.emit({ type: "add", entry: withTime });
		},
		async get(id) {
			return (await readDirectory()).entries.find((e) => e.id === id);
		},
		async getAll() {
			return [...(await readDirectory()).entries];
		},
		async delete(id) {
			const dir = await readDirectory();
			const idx = dir.entries.findIndex((e) => e.id === id);
			if (idx < 0) return false;
			dir.entries.splice(idx, 1);
			await writeDirectory(dir.entries);
			events.emit({ type: "delete", id });
			return true;
		},
		async deleteAll() {
			await writeDirectory([]);
		},
	};
}
