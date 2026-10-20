/**
 * DOM microdata extraction: read items out of a page that embeds them.
 * Implements the HTML microdata property algorithm (subset): itemscope,
 * itemtype, itemprop (multi-token), itemid, itemref, and the
 * element-specific value rules.
 */
import type { Item, ItemValue } from "./item.ts";

/** Does an itemtype IRI match a wanted type? Exact, or trailing segment. */
export function itemTypeMatches(actual: string, want: string): boolean {
	if (actual === want) return true;
	const last = (iri: string) => {
		const noHash = iri.split("#");
		const seg = noHash.length > 1 ? noHash[noHash.length - 1]! : iri.split("/").pop() ?? "";
		return seg;
	};
	return last(actual) === last(want) && last(want) !== "";
}

function propValue(el: Element): ItemValue {
	if (el.hasAttribute("itemscope")) return buildItem(el);
	const tag = el.tagName.toLowerCase();
	switch (tag) {
		case "meta":
			return el.getAttribute("content") ?? "";
		case "audio":
		case "video":
		case "embed":
		case "iframe":
		case "source":
		case "track":
			return el.getAttribute("src") ?? "";
		case "a":
		case "area":
		case "link":
			return el.getAttribute("href") ?? "";
		case "img":
			return el.getAttribute("src") ?? "";
		case "object":
			return el.getAttribute("data") ?? "";
		case "data":
		case "meter":
			return el.getAttribute("value") ?? "";
		case "time":
			return el.getAttribute("datetime") ?? el.textContent?.trim() ?? "";
		default:
			return el.textContent?.trim() ?? "";
	}
}

function buildItem(el: Element): Item {
	const item: Record<string, ItemValue> = {
		"@type": el.getAttribute("itemtype") ?? "",
	};
	const itemid = el.getAttribute("itemid");
	if (itemid) item["@id"] = itemid;

	const add = (propEl: Element) => {
		const names = (propEl.getAttribute("itemprop") ?? "").trim().split(/\s+/);
		if (names[0] === "") return;
		const value = propValue(propEl);
		for (const name of names) {
			const existing = item[name];
			if (existing === undefined) item[name] = value;
			else if (Array.isArray(existing)) (existing as ItemValue[]).push(value);
			else item[name] = [existing, value];
		}
	};

	const visitChildren = (node: Element) => {
		for (const child of Array.from(node.children)) {
			if (child.hasAttribute("itemscope") && !child.hasAttribute("itemprop")) continue;
			if (child.hasAttribute("itemprop")) add(child);
			if (!child.hasAttribute("itemscope")) visitChildren(child);
		}
	};
	visitChildren(el);

	const itemref = el.getAttribute("itemref");
	if (itemref) {
		const doc = el.ownerDocument;
		for (const id of itemref.trim().split(/\s+/)) {
			const ref = doc.getElementById(id);
			if (ref) {
				if (ref.hasAttribute("itemprop")) add(ref);
				if (!ref.hasAttribute("itemscope")) visitChildren(ref);
			}
		}
	}
	return item as Item;
}

/**
 * All items in `root` matching an optional itemtype. Elements carrying
 * itemscope but no itemtype are skipped unless `includeUntyped`.
 */
export function itemsFromDom(
	root: ParentNode,
	opts?: { type?: string | string[]; includeUntyped?: boolean },
): Item[] {
	const candidates = [
		...(root as Element).matches?.("[itemscope]") ? [root as Element] : [],
		...Array.from(root.querySelectorAll("[itemscope]")),
	];
	const types = opts?.type === undefined ? [] : Array.isArray(opts.type) ? opts.type : [opts.type];
	const items: Item[] = [];
	for (const el of candidates) {
		const type = el.getAttribute("itemtype");
		if (!type && !opts?.includeUntyped) continue;
		if (types.length > 0 && !types.some((t) => type && itemTypeMatches(type, t))) continue;
		items.push(buildItem(el));
	}
	return items;
}
