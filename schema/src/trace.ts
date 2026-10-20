/**
 * Trace-family items: the shapes a reader emits when it parses OTEL events
 * out of a page. Field names follow OTel JSON (`trace_id`, `start_time_unix_nano`,
 * `attributes`, ...) so `toOtelJson()` is a mechanical mapping.
 */
import type { Attributes, Item } from "./item.ts";
import { ITEM_TYPES, type SpanKindName, spanKindToInt } from "./vocab.ts";
import { isValidSpanId, isValidTraceId } from "./ids.ts";

export interface SpanStatus {
	code: "unset" | "ok" | "error";
	message?: string;
}

export interface SpanEventItem extends Item {
	readonly "@type": typeof ITEM_TYPES.event;
	name: string;
	time_unix_nano: string;
	attributes?: Attributes;
}

export interface SpanLink {
	trace_id: string;
	span_id: string;
	attributes?: Attributes;
}

export interface SpanItem extends Item {
	readonly "@type": typeof ITEM_TYPES.span;
	trace_id: string;
	span_id: string;
	parent_span_id?: string;
	name: string;
	kind?: SpanKindName;
	start_time_unix_nano: string;
	end_time_unix_nano?: string;
	attributes?: Attributes;
	events?: SpanEventItem[];
	links?: SpanLink[];
	status?: SpanStatus;
}

export interface ResourceItem extends Item {
	readonly "@type": typeof ITEM_TYPES.resource;
	attributes: Attributes;
}

export interface ScopeItem extends Item {
	readonly "@type": typeof ITEM_TYPES.scope;
	name: string;
	version?: string;
}

export interface TraceItem extends Item {
	readonly "@type": typeof ITEM_TYPES.trace;
	resource: ResourceItem;
	scope?: ScopeItem;
	spans: SpanItem[];
}

// ---------------------------------------------------------------------------
// builders

/** Milliseconds since epoch → OTel nanosecond timestamp string. */
export function toUnixNano(ms: number): string {
	return `${Math.round(ms * 1_000_000)}`;
}

export function nowUnixNano(): string {
	return toUnixNano(Date.now());
}

export function resource(attributes: Attributes): ResourceItem {
	return { "@type": ITEM_TYPES.resource, attributes };
}

export function spanEvent(
	name: string,
	timeUnixNano: string,
	attributes?: Attributes,
): SpanEventItem {
	const ev: SpanEventItem = { "@type": ITEM_TYPES.event, name, time_unix_nano: timeUnixNano };
	if (attributes) ev.attributes = attributes;
	return ev;
}

export function span(init: {
	traceId: string;
	spanId: string;
	name: string;
	parentSpanId?: string;
	kind?: SpanKindName;
	startUnixNano: string;
	endUnixNano?: string;
	attributes?: Attributes;
	events?: SpanEventItem[];
	links?: SpanLink[];
	status?: SpanStatus;
}): SpanItem {
	const s: SpanItem = {
		"@type": ITEM_TYPES.span,
		trace_id: init.traceId,
		span_id: init.spanId,
		name: init.name,
		start_time_unix_nano: init.startUnixNano,
	};
	if (init.parentSpanId !== undefined) s.parent_span_id = init.parentSpanId;
	if (init.kind) s.kind = init.kind;
	if (init.endUnixNano !== undefined) s.end_time_unix_nano = init.endUnixNano;
	if (init.attributes) s.attributes = init.attributes;
	if (init.events) s.events = init.events;
	if (init.links) s.links = init.links;
	if (init.status) s.status = init.status;
	return s;
}

export function trace(resourceItem: ResourceItem, spans: SpanItem[], scope?: ScopeItem): TraceItem {
	const t: TraceItem = { "@type": ITEM_TYPES.trace, resource: resourceItem, spans };
	if (scope) t.scope = scope;
	return t;
}

// ---------------------------------------------------------------------------
// validation

export interface ValidationIssue {
	path: string;
	message: string;
}

const DIGITS_RE = /^[0-9]+$/;

export function validateTrace(t: TraceItem): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	const push = (path: string, message: string) => issues.push({ path, message });
	for (const key of Object.keys(t.resource?.attributes ?? {})) {
		if (key.includes(" ")) push(`resource.attributes.${key}`, "attribute name contains whitespace");
	}
	t.spans?.forEach((s, i) => {
		const p = `spans[${i}]`;
		if (!isValidTraceId(s.trace_id)) push(`${p}.trace_id`, "must be 32 lowercase hex chars");
		if (!isValidSpanId(s.span_id)) push(`${p}.span_id`, "must be 16 lowercase hex chars, nonzero");
		if (s.parent_span_id !== undefined && !isValidSpanId(s.parent_span_id))
			push(`${p}.parent_span_id`, "must be 16 lowercase hex chars");
		if (!s.name) push(`${p}.name`, "required");
		if (!DIGITS_RE.test(s.start_time_unix_nano ?? ""))
			push(`${p}.start_time_unix_nano`, "must be a digit string of nanoseconds");
		if (s.end_time_unix_nano !== undefined && !DIGITS_RE.test(s.end_time_unix_nano))
			push(`${p}.end_time_unix_nano`, "must be a digit string of nanoseconds");
		if (
			s.end_time_unix_nano !== undefined &&
			DIGITS_RE.test(s.end_time_unix_nano) &&
			DIGITS_RE.test(s.start_time_unix_nano ?? "") &&
			BigInt(s.end_time_unix_nano) < BigInt(s.start_time_unix_nano)
		)
			push(`${p}.end_time_unix_nano`, "ends before it starts");
		s.events?.forEach((e, j) => {
			if (!e.name) push(`${p}.events[${j}].name`, "required");
			if (!DIGITS_RE.test(e.time_unix_nano ?? ""))
				push(`${p}.events[${j}].time_unix_nano`, "must be a digit string of nanoseconds");
		});
	});
	return issues;
}

// ---------------------------------------------------------------------------
// OTel JSON (OTLP JSON-ish) mapping

type OtelValue =
	| { stringValue: string }
	| { intValue: number }
	| { doubleValue: number }
	| { boolValue: boolean }
	| { arrayValue: { values: OtelValue[] } }
	| { kvlistValue: { values: OtelKv[] } };

interface OtelKv {
	key: string;
	value: OtelValue;
}

function toOtelValue(v: unknown): OtelValue {
	if (typeof v === "string") return { stringValue: v };
	if (typeof v === "number")
		return Number.isInteger(v) ? { intValue: v } : { doubleValue: v };
	if (typeof v === "boolean") return { boolValue: v };
	if (Array.isArray(v)) return { arrayValue: { values: v.map(toOtelValue) } };
	if (v !== null && typeof v === "object")
		return {
			kvlistValue: {
				values: Object.entries(v as Record<string, unknown>).map(([k, inner]) => ({
					key: k,
					value: toOtelValue(inner),
				})),
			},
		};
	return { stringValue: String(v) };
}

function toOtelAttrs(attrs?: Attributes): OtelKv[] | undefined {
	if (!attrs) return undefined;
	return Object.entries(attrs).map(([key, value]) => ({ key, value: toOtelValue(value) }));
}

const STATUS_TO_INT: Record<SpanStatus["code"], number> = { unset: 0, ok: 1, error: 2 };

/** Map a trace item into an OTLP-JSON-shaped spans payload. */
export function toOtelJson(t: TraceItem): {
	resourceSpans: Array<{
		resource: { attributes: OtelKv[] };
		scopeSpans: Array<{
			scope?: { name: string; version?: string };
			spans: Array<Record<string, unknown>>;
		}>;
	}>;
} {
	const spans = (t.spans ?? []).map((s) => {
		const out: Record<string, unknown> = {
			traceId: s.trace_id,
			spanId: s.span_id,
			name: s.name,
			kind: spanKindToInt((s.kind ?? "internal") as SpanKindName),
			startTimeUnixNano: s.start_time_unix_nano,
		};
		if (s.parent_span_id !== undefined) out.parentSpanId = s.parent_span_id;
		if (s.end_time_unix_nano !== undefined) out.endTimeUnixNano = s.end_time_unix_nano;
		const attrs = toOtelAttrs(s.attributes);
		if (attrs) out.attributes = attrs;
		if (s.events?.length)
			out.events = s.events.map((e) => {
				const ev: Record<string, unknown> = { name: e.name, timeUnixNano: e.time_unix_nano };
				const evAttrs = toOtelAttrs(e.attributes);
				if (evAttrs) ev.attributes = evAttrs;
				return ev;
			});
		if (s.links?.length)
			out.links = s.links.map((l) => {
				const link: Record<string, unknown> = { traceId: l.trace_id, spanId: l.span_id };
				const lAttrs = toOtelAttrs(l.attributes);
				if (lAttrs) link.attributes = lAttrs;
				return link;
			});
		if (s.status) {
			out.status = {
				code: STATUS_TO_INT[s.status.code],
				...(s.status.message ? { description: s.status.message } : {}),
			};
		}
		return out;
	});
	return {
		resourceSpans: [
			{
				resource: { attributes: toOtelAttrs(t.resource?.attributes) ?? [] },
				scopeSpans: [
					{
						scope: t.scope ? { name: t.scope.name, version: t.scope.version } : undefined,
						spans,
					},
				],
			},
		],
	};
}
