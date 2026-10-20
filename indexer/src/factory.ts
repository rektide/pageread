/**
 * The indexer factory: builds and maintains a named index over the store.
 * Store events (put/delete) schedule coalesced refreshes; snapshots
 * persist as MIME-typed documents so indexes survive restarts and can be
 * exported; signals expose the snapshot as a reactive stream.
 */
import { state, type ReadableSignal } from "@pageread/signals";
import type { ContentStore, StoredEntry } from "@pageread/store";
import { snapshotUri, type FindMatch, type Indexer, type IndexerConfig } from "./types.ts";

const REFRESH_DEBOUNCE_MS = 150;

export function createIndexer<S>(store: ContentStore, config: IndexerConfig<S>): Indexer<S> {
	const view = state<S | undefined>(undefined, { equals: false });
	let finder: ((query: string) => FindMatch[]) | undefined;

	async function readPrev(): Promise<S | undefined> {
		const entry = await store.match(snapshotUri(config.name));
		if (!entry) return undefined;
		try {
			return JSON.parse(typeof entry.body === "string" ? entry.body : "{}") as S;
		} catch {
			return undefined;
		}
	}

	async function refresh(): Promise<S> {
		// skip our own snapshot document so refreshes don't feed themselves
		const entries = (await store.matchAll(config.filter)).filter(
			(e) => e.uri !== snapshotUri(config.name),
		);
		const prev = await readPrev();
		// knownUris (not changedUris): full rebuilds see every surviving
		// entry; incremental maintenance needs the change journal first
		const next = config.build(entries, prev, { knownUris: entries.map((e) => e.uri) });
		await store.put({
			uri: snapshotUri(config.name),
			mimeType: "application/vnd.pageread.index+json",
			body: JSON.stringify(next),
			meta: { indexer: config.name },
		});
		finder = config.makeFinder?.(entries, next);
		view.set(next);
		return next;
	}

	const ready = refresh();

	let timer: ReturnType<typeof setTimeout> | undefined;
	store.events.subscribe((event) => {
		if (event.type === "noop") return;
		if (event.uri === snapshotUri(config.name)) return;
		if (
			config.filter?.uriPrefix !== undefined &&
			!event.uri.startsWith(config.filter.uriPrefix)
		)
			return;
		if (
			config.filter?.mimeType !== undefined &&
			event.type === "put" &&
			event.entry.mimeType !== config.filter.mimeType
		)
			return;
		if (timer !== undefined) clearTimeout(timer);
		timer = setTimeout(() => {
			timer = undefined;
			refresh().catch((err) => {
				console.error(`[pageread:indexer:${config.name}] refresh failed`, err);
			});
		}, REFRESH_DEBOUNCE_MS);
	});

	ready.catch(() => {}); // callers await `ready` for errors; don't double-unhandle

	return {
		name: config.name,
		ready,
		refresh,
		view: () => view(),
		signal: (): ReadableSignal<S | undefined> => view,
		subscribe(listener: (snapshot: S) => void) {
			return view.subscribe((s) => {
				if (s !== undefined) listener(s);
			});
		},
		find(query: string): FindMatch[] {
			return finder ? finder(query) : [];
		},
	};
}
