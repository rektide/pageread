/**
 * The content store contract: a web-Cache-shaped API over URI-keyed,
 * MIME-typed content, plus event outputs so persistence backends can act
 * as reactive streams. Every backend implements the same interface.
 */
import type { JsonValue } from "@pageread/schema";
import type { Subscribable } from "@pageread/signals";

export type Body = string | Uint8Array;

export interface StoredEntry {
	uri: string;
	mimeType: string;
	body: Body;
	meta?: Record<string, JsonValue>;
	/** sha-256 of the body — idempotent re-puts are detected with this */
	etag: string;
	/** epoch ms of the last actual write */
	storedAt: number;
}

export interface PutInput {
	uri: string;
	mimeType: string;
	body: Body;
	meta?: Record<string, JsonValue>;
}

export type StoreEvent =
	| { type: "put"; uri: string; entry: StoredEntry }
	| { type: "delete"; uri: string; mimeType: string }
	| { type: "noop"; uri: string; etag: string };

export interface StoreFilter {
	uriPrefix?: string;
	mimeType?: string;
}

export interface ContentStore {
	put(input: PutInput): Promise<StoredEntry>;
	match(uri: string): Promise<StoredEntry | undefined>;
	matchAll(filter?: StoreFilter): Promise<StoredEntry[]>;
	keys(filter?: StoreFilter): Promise<string[]>;
	delete(uri: string): Promise<boolean>;
	/** reactive output: every put/delete/noop on this store instance */
	readonly events: Subscribable<StoreEvent>;
}

export function bodyToBytes(body: Body): Uint8Array {
	return typeof body === "string" ? new TextEncoder().encode(body) : body;
}

export function bodyToString(body: Body): string {
	return typeof body === "string"
		? body
		: new TextDecoder("utf-8", { fatal: false }).decode(body);
}

export function matchesFilter(entry: { uri: string; mimeType: string }, filter?: StoreFilter): boolean {
	if (!filter) return true;
	if (filter.uriPrefix !== undefined && !entry.uri.startsWith(filter.uriPrefix)) return false;
	if (filter.mimeType !== undefined && entry.mimeType !== filter.mimeType) return false;
	return true;
}

/**
 * Entry equality: body hash AND semantic headers (mimeType, meta). A
 * rename or reclassification with identical bytes is still a change.
 */
export function canonicalMeta(meta: PutInput["meta"]): string {
	if (!meta) return "";
	return JSON.stringify(
		Object.keys(meta)
			.sort()
			.map((k) => [k, meta[k]]),
	);
}

export function entriesEqual(
	a: { etag: string; mimeType: string; meta?: PutInput["meta"] },
	b: { etag: string; mimeType: string; meta?: PutInput["meta"] },
): boolean {
	return (
		a.etag === b.etag &&
		a.mimeType === b.mimeType &&
		canonicalMeta(a.meta) === canonicalMeta(b.meta)
	);
}
