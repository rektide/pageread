/**
 * The global DOM event router: exactly one MutationObserver per observed
 * root (normally the document), batching records into microtask-aligned
 * mutation batches that any number of consumers subscribe to. This is the
 * piece that keeps "signals have many consumers" from becoming "every
 * live query installs its own MutationObserver".
 */
import { Emitter, type Subscribable } from "./subscribable.ts";

export interface MutationBatch {
	root: ParentNode;
	records: MutationRecord[];
}

export interface RouterOptions {
	/** observe characterData changes too (default: false — element queries do not need it) */
	characterData?: boolean;
}

interface RouterEntry {
	observer: MutationObserver;
	records: MutationRecord[];
	scheduled: boolean;
	emitter: Emitter<MutationBatch>;
}

/** Exposed for tests and diagnostics: how many observers the router has created. */
export const routerStats = { observersCreated: 0, activeRoots: 0 };

const entries = new WeakMap<ParentNode, RouterEntry>();

function entryFor(root: ParentNode, opts: RouterOptions = {}): RouterEntry {
	let entry = entries.get(root);
	if (entry) return entry;
	const emitter = new Emitter<MutationBatch>();
	const record: RouterEntry = {
		emitter,
		records: [],
		scheduled: false,
		observer: new MutationObserver((records) => {
			record.records.push(...records);
			if (!record.scheduled) {
				record.scheduled = true;
				queueMicrotask(() => {
					record.scheduled = false;
					const batch = record.records;
					record.records = [];
					if (batch.length > 0) emitter.emit({ root, records: batch });
				});
			}
		}),
	};
	record.observer.observe(root, {
		subtree: true,
		childList: true,
		attributes: true,
		characterData: opts.characterData ?? false,
	});
	routerStats.observersCreated++;
	routerStats.activeRoots++;
	entries.set(root, record);
	return record;
}

/** Subscribe to batched mutations under `root` (default: the document). */
export function domEvents(root?: ParentNode, opts?: RouterOptions): Subscribable<MutationBatch> {
	const target = root ?? (typeof document !== "undefined" ? document : undefined);
	if (!target) throw new Error("domEvents: no root and no document available");
	return entryFor(target, opts).emitter;
}
