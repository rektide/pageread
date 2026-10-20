/**
 * Indexer contracts: an index is a named, persisted, reactive view over
 * content-store entries. Shapes define how entries fold into a snapshot
 * and how the snapshot answers find() queries.
 */
import type { Unsubscribe } from "@pageread/signals";
import type { ReadableSignal } from "@pageread/signals";
import type { ContentStore, StoredEntry, StoreFilter } from "@pageread/store";

export interface FindMatch {
	uri: string;
	field: string;
	start: number;
	end: number;
	excerpt: string;
}

export interface IndexerConfig<S> {
	name: string;
	/** which store entries feed this index */
	filter?: StoreFilter;
	/** fold entries (+ previous snapshot) into a new snapshot */
	build(entries: StoredEntry[], prev: S | undefined, ctx: { changedUris: string[] }): S;
	/**
	 * Build a queryable finder from the entries + fresh snapshot. Called
	 * after every rebuild; snapshots stay lean, finders stay warm.
	 */
	makeFinder?(entries: StoredEntry[], snapshot: S): (query: string) => FindMatch[];
}

export interface Indexer<S> {
	readonly name: string;
	readonly ready: Promise<S>;
	/** full rebuild from the store, persisted as a snapshot document */
	refresh(): Promise<S>;
	/** current snapshot, if built */
	view(): S | undefined;
	/** reactive view of the snapshot */
	signal(): ReadableSignal<S | undefined>;
	/** reactive event stream: fires with each refreshed snapshot */
	subscribe(listener: (snapshot: S) => void): Unsubscribe;
	find(query: string): FindMatch[];
}

export function snapshotUri(name: string): string {
	return `urn:pageread:index:${name}`;
}
