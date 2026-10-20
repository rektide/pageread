/**
 * The generic microdata item model: JSON that mirrors HTML microdata.
 * An item is a `@type` IRI plus itemprops. Values are JSON primitives,
 * nested items, or arrays of either.
 */

export type JsonPrimitive = string | number | boolean | null;
export type ItemValue = JsonPrimitive | Item | ItemValue[];
export type JsonValue = JsonPrimitive | Item | JsonValue[] | { [k: string]: JsonValue };

export interface Item {
	readonly "@type": string;
	readonly [prop: string]: ItemValue;
}

export function isItem(v: unknown): v is Item {
	return (
		typeof v === "object" &&
		v !== null &&
		!Array.isArray(v) &&
		typeof (v as { "@type"?: unknown })["@type"] === "string"
	);
}

/** Structural attributes bag — OTel semconv names as keys. */
export type Attributes = { [semconvName: string]: JsonValue };
