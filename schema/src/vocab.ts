/**
 * The pageread vocabulary: item-type IRIs adapted from OpenTelemetry
 * semantic conventions, media types for content-store entries, and the
 * semconv attribute-name constants readers use to stay consistent.
 *
 * Design: structural fields (trace_id, span_id, name, events, ...) live as
 * direct itemprops on items; semantic-convention *attributes* live in an
 * `attributes` bag keyed by OTEL semconv names (gen_ai.*, http.*, ...),
 * exactly like OTel JSON payloads. `toOtelJson()` maps between the two
 * with near-trivial code because the shapes rhyme.
 */

export const SEMCONV_BASE = "https://opentelemetry.io/semconv/";

export const ITEM_TYPES = {
	trace: `${SEMCONV_BASE}trace`,
	span: `${SEMCONV_BASE}span`,
	event: `${SEMCONV_BASE}event`,
	resource: `${SEMCONV_BASE}resource`,
	scope: `${SEMCONV_BASE}scope`,
	logRecord: `${SEMCONV_BASE}log-record`,
} as const;

export type ItemType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES];

/** Media types for content-store entries. */
export const MEDIA_TYPES = {
	trace: "application/vnd.pageread.trace+json",
	span: "application/vnd.pageread.span+json",
	event: "application/vnd.pageread.event+json",
	item: "application/vnd.pageread.item+json",
	/** thin conversation metadata (titles, branches, edits) joined with
	 * traces by the resolver — the hybrid model */
	conversation: "application/vnd.pageread.conversation+json",
	index: "application/vnd.pageread.index+json",
	directory: "application/vnd.pageread.directory+json",
	capture: "application/vnd.pageread.capture+json",
} as const;

/** Well-known URN stems for content-store keys. */
export const URN_STEMS = {
	trace: "urn:pageread:trace:",
	conversation: "urn:pageread:conversation:",
	raw: "urn:pageread:raw:",
	index: "urn:pageread:index:",
	directory: "urn:pageread:content-index",
} as const;

/**
 * Semantic-convention attribute names (the adaptation surface). Names we
 * adopt verbatim from OTEL semconv; `pageread.*` is our namespace for
 * concepts semconv does not cover (conversation ids, projects, sources).
 */
export const SEMCONV = {
	service: {
		name: "service.name",
		instanceId: "service.instance.id",
		version: "service.version",
	},
	genAi: {
		system: "gen_ai.system",
		operationName: "gen_ai.operation.name",
		requestModel: "gen_ai.request.model",
		responseModel: "gen_ai.response.model",
		prompt: "gen_ai.prompt",
		completion: "gen_ai.completion",
		messageRole: "gen_ai.message.role",
		usageInputTokens: "gen_ai.usage.input_tokens",
		usageOutputTokens: "gen_ai.usage.output_tokens",
	},
	http: {
		requestMethod: "http.request.method",
		responseStatusCode: "http.response.status_code",
		requestBodySize: "http.request.body.size",
		responseBodySize: "http.response.body.size",
	},
	url: {
		full: "url.full",
	},
	userAgent: {
		original: "user_agent.original",
	},
	/** pageread adaptation namespace. */
	pageread: {
		conversationId: "pageread.conversation.id",
		projectId: "pageread.project.id",
		account: "pageread.account.id",
		nodeId: "pageread.node.id",
		messageId: "pageread.message.id",
		/** where the item's evidence came from: "network" | "dom" | ... */
		source: "pageread.source",
		/** content-store URI of the raw capture this item was parsed from */
		captureUri: "pageread.capture.uri",
		title: "pageread.title",
		updatedAt: "pageread.updated_at",
	},
} as const;

export const GEN_AI = SEMCONV.genAi;
export const SPAN_KINDS = [
	"unspecified",
	"internal",
	"server",
	"client",
	"producer",
	"consumer",
] as const;
export type SpanKindName = (typeof SPAN_KINDS)[number];

const SPAN_KIND_TO_INT: Record<SpanKindName, number> = {
	unspecified: 0,
	internal: 1,
	server: 2,
	client: 3,
	producer: 4,
	consumer: 5,
};

export function spanKindToInt(kind: SpanKindName): number {
	return SPAN_KIND_TO_INT[kind] ?? 0;
}
