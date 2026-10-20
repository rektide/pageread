import { defineExtension, type ReaderSpec } from "@pageread/extension-kit";
import { resource, trace, span, spanEvent, deriveTraceId as traceIdFrom, deriveSpanId as spanIdFrom } from "@pageread/schema";

export const reader: ReaderSpec = {
	name: "fixture-conversation", version: "1",
	match: (capture) => capture.kind === "http" && new URL(capture.url).pathname === "/api/conversation" && capture.status === 200,
	read(capture) {
		if (capture.kind !== "http" || !capture.responseBody) throw new Error("Expected complete HTTP body");
		const value: unknown = JSON.parse(capture.responseBody);
		if (!value || typeof value !== "object" || !("title" in value) || typeof value.title !== "string" || !("text" in value) || typeof value.text !== "string") throw new Error("Malformed fixture response");
		const conversationUri = "urn:pageread:conversation:fixture/local/c1";
		const traceUri = "urn:pageread:trace:fixture/local/c1";
		return {
			observation: { coverage: "complete", covers: ["fixture/local/c1/m1"], scope: { conversationUri, domain: "conversation" } },
			puts: [
				{ uri: traceUri, mimeType: "application/vnd.pageread.trace+json", body: JSON.stringify(trace(resource({ "pageread.conversation.id": conversationUri, "pageread.title": value.title }), [span({ traceId: traceIdFrom(conversationUri), spanId: spanIdFrom(`${conversationUri}/m1`), name: "fixture message", startUnixNano: "1000000000", attributes: { "pageread.message.id": "fixture/local/c1/m1", "gen_ai.message.role": "assistant" }, events: [spanEvent("gen_ai.content.completion", "1000000000", { "gen_ai.completion": value.text })] })])) },
				{ uri: conversationUri, mimeType: "application/vnd.pageread.conversation+json", body: JSON.stringify({ conversationUri, title: { op: "set", value: value.title }, traceUri }) },
			],
		};
	},
};

export const spec = defineExtension({ name: "fixture", matches: ["http://127.0.0.1/*"], network: { include: ["http://127.0.0.1:*/api/conversation"], methods: ["GET"] }, readers: [reader], indexes: ["transcripts"], runAt: "document_start" });
