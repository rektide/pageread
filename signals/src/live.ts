/**
 * Live (signal) queries: `liveQuery(selector)` is a querySelectorAll that
 * stays correct as the DOM changes, invalidating through the global
 * router. Flat selectors (no combinators, no :has) get precise
 * invalidation; everything else is conservative — correctness first, and
 * array equality means recomputes that change nothing notify nobody.
 */
import { computed, shallowArrayEquals, state, type ReadableSignal } from "./core.ts";
import { domEvents, type MutationBatch } from "./dom-router.ts";

function isFlatSelector(selector: string): boolean {
	// combinator- or structure-sensitive selectors get conservative treatment:
	// sibling insertion can change :nth-child() matches without any added
	// node itself matching the selector
	return !/[\s>+~]|:has\(|:nth|:first-|:last-|:only-/i.test(selector);
}

/**
 * Does the changed attribute participate in matching this selector? Used
 * in both directions: `matches()` post-change cannot see removals, but
 * the attribute name appearing in the selector can.
 */
function attributeParticipates(selector: string, name: string | null): boolean {
	if (!name) return true;
	if (selector.includes(`[${name}`)) return true;
	if (name === "class" && selector.includes(".")) return true;
	if (name === "id" && selector.includes("#")) return true;
	return false;
}

function nodeAffects(node: Node, selector: string): boolean {
	if (!(node instanceof Element)) return false;
	return node.matches(selector) || node.querySelector(selector) !== null;
}

function queryAffected(selector: string, flat: boolean, batch: MutationBatch): boolean {
	for (const record of batch.records) {
		if (record.type === "childList") {
			if (!flat) return true; // structure-sensitive: any insertion/removal can shift matches
			for (const node of record.addedNodes) if (nodeAffects(node, selector)) return true;
			for (const node of record.removedNodes) if (nodeAffects(node, selector)) return true;
		} else if (record.type === "attributes") {
			if (flat) {
				if (
					record.target.matches?.(selector) ||
					attributeParticipates(selector, record.attributeName)
				)
					return true;
			} else {
				// combinator selectors can be affected by ancestor attribute
				// changes; be conservative
				return true;
			}
		}
	}
	return false;
}

export interface LiveQueryOptions {
	root?: ParentNode;
}

export function liveQuery(selector: string, opts?: LiveQueryOptions): ReadableSignal<Element[]> {
	const root = opts?.root ?? document;
	const flat = isFlatSelector(selector);
	const version = state(0);
	const results = computed(
		() => {
			version();
			return Array.from(root.querySelectorAll(selector));
		},
		{ equals: shallowArrayEquals },
	);
	// invalidation flows through the global router: one observer for the
	// whole page, relevance-checked per query
	domEvents(root).subscribe((batch) => {
		if (queryAffected(selector, flat, batch)) version.update((v) => v + 1);
	});
	return results;
}

export interface LiveQueryWhereOptions extends LiveQueryOptions {
	/** prefilter candidates before the predicate runs */
	selector?: string;
}

/**
 * A live query with an arbitrary predicate. Predicates can depend on
 * anything, so invalidation is conservative: any structural or attribute
 * change re-evaluates. Keep the `selector` prefilter tight.
 */
export function liveQueryWhere(
	predicate: (el: Element) => boolean,
	opts?: LiveQueryWhereOptions,
): ReadableSignal<Element[]> {
	const root = opts?.root ?? document;
	const selector = opts?.selector ?? "*";
	const version = state(0);
	const results = computed(
		() => {
			version();
			return Array.from(root.querySelectorAll(selector)).filter(predicate);
		},
		{ equals: shallowArrayEquals },
	);
	domEvents(root).subscribe((batch) => {
		for (const record of batch.records) {
			// predicates may depend on anything, including text content
			if (
				record.type === "childList" ||
				record.type === "attributes" ||
				record.type === "characterData"
			) {
				version.update((v) => v + 1);
				return;
			}
		}
	});
	return results;
}
