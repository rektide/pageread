/**
 * Shared helpers for shapes that fold trace documents into snapshots.
 */
import type { Attributes, TraceItem } from "@pageread/schema";
import type { StoredEntry } from "@pageread/store";

export interface ParsedTrace {
	entry: StoredEntry;
	trace: TraceItem;
}

export function parseTraces(entries: StoredEntry[]): ParsedTrace[] {
	const out: ParsedTrace[] = [];
	for (const entry of entries) {
		try {
			const trace = JSON.parse(
				typeof entry.body === "string" ? entry.body : new TextDecoder().decode(entry.body),
			) as TraceItem;
			if (trace?.["@type"]?.includes("trace") && Array.isArray(trace.spans)) out.push({ entry, trace });
		} catch {
			// not a trace document; other shapes' filters should exclude it
		}
	}
	return out;
}

export function resourceAttrs(trace: TraceItem): Attributes {
	return trace.resource?.attributes ?? {};
}

/** nanoseconds → milliseconds (for updated-at style fields) */
export function nanoToMs(nano: string | undefined): number | undefined {
	if (nano === undefined || !/^[0-9]+$/.test(nano)) return undefined;
	return Number(BigInt(nano) / 1_000_000n);
}

/** latest end (or start) timestamp across spans, in epoch ms */
export function lastActivityMs(trace: TraceItem): number | undefined {
	let latest: bigint | undefined;
	for (const s of trace.spans ?? []) {
		const raw = s.end_time_unix_nano ?? s.start_time_unix_nano;
		if (raw === undefined || !/^[0-9]+$/.test(raw)) continue;
		const v = BigInt(raw);
		if (latest === undefined || v > latest) latest = v;
	}
	return latest === undefined ? undefined : Number(latest / 1_000_000n);
}
