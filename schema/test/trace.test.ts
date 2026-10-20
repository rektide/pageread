import { describe, expect, it } from "vitest";
import {
	ITEM_TYPES,
	type SpanItem,
	type TraceItem,
	resource,
	span,
	spanEvent,
	toOtelJson,
	trace,
	validateTrace,
} from "../src/index.ts";

const T = "0123456789abcdef0123456789abcdef";
const S = "0123456789abcdef";

function sampleTrace(): TraceItem {
	return trace(resource({ "service.name": "chatgpt.com", "pageread.conversation.id": "c-1" }), [
		span({
			traceId: T,
			spanId: S,
			name: "GET /backend-api/conversation/c-1",
			kind: "internal",
			startUnixNano: "1000000000000",
			endUnixNano: "2000000000000",
			attributes: {
				"http.request.method": "GET",
				"http.response.status_code": 200,
				"url.full": "https://chatgpt.com/backend-api/conversation/c-1",
			},
		}),
		span({
			traceId: T,
			spanId: "fedcba9876543210",
			parentSpanId: S,
			name: "chatgpt turn node-1",
			kind: "client",
			startUnixNano: "2000000000000",
			endUnixNano: "3000000000000",
			attributes: {
				"gen_ai.system": "chatgpt",
				"gen_ai.operation.name": "chat",
				"gen_ai.request.model": "gpt-5.2",
				"gen_ai.usage.input_tokens": 120,
				"gen_ai.usage.output_tokens": 340,
			},
			events: [
				spanEvent("gen_ai.content.prompt", "2000000000001", { "gen_ai.prompt": "hello" }),
				spanEvent("gen_ai.content.completion", "2999999999999", { "gen_ai.completion": "hi" }),
			],
		}),
	]);
}

describe("trace items", () => {
	it("builds and validates a sample trace", () => {
		const t = sampleTrace();
		expect(validateTrace(t)).toEqual([]);
		expect(t.spans[1]?.parent_span_id).toBe(S);
	});

	it("flags invalid ids and timestamps", () => {
		const bad: SpanItem = {
			"@type": ITEM_TYPES.span,
			trace_id: "nothex",
			span_id: "0000000000000000",
			name: "",
			start_time_unix_nano: "1000000000000",
			end_time_unix_nano: "1",
		};
		const issues = validateTrace(trace(resource({}), [bad]));
		const paths = issues.map((i) => i.path);
		expect(paths).toContain("spans[0].trace_id");
		expect(paths).toContain("spans[0].span_id");
		expect(paths).toContain("spans[0].name");
		expect(paths).toContain("spans[0].end_time_unix_nano"); // ends before it starts
	});
});

describe("toOtelJson", () => {
	it("maps items into OTLP-JSON-shaped spans", () => {
		const o = toOtelJson(sampleTrace());
		const rs = o.resourceSpans[0];
		expect(rs?.resource.attributes).toEqual([
			{ key: "service.name", value: { stringValue: "chatgpt.com" } },
			{ key: "pageread.conversation.id", value: { stringValue: "c-1" } },
		]);
		const http = rs?.scopeSpans[0]?.spans[0];
		expect(http).toMatchObject({
			traceId: T,
			spanId: S,
			kind: 1,
			startTimeUnixNano: "1000000000000",
		});
		expect(http?.attributes).toEqual([
			{ key: "http.request.method", value: { stringValue: "GET" } },
			{ key: "http.response.status_code", value: { intValue: 200 } },
			{ key: "url.full", value: { stringValue: "https://chatgpt.com/backend-api/conversation/c-1" } },
		]);
		const genai = rs?.scopeSpans[0]?.spans[1];
		expect(genai?.parentSpanId).toBe(S);
		expect(genai?.kind).toBe(3);
		expect(genai?.events).toEqual(expect.arrayContaining([{
			name: "gen_ai.content.prompt",
			timeUnixNano: "2000000000001",
			attributes: [{ key: "gen_ai.prompt", value: { stringValue: "hello" } }],
		}]));
	});
});
