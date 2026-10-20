import { describe, expect, it } from "vitest";
import {
	MEDIA_TYPES,
	SEMCONV,
	URN_STEMS,
	deriveSpanId,
	type SpanItem,
	resource,
	span,
	spanEvent,
	trace,
} from "@pageread/schema";
import { memoryContentStore } from "@pageread/store";
import { conversationIndex, createIndexer, projectsIndex, transcriptsIndex, TextIndex } from "../src/index.ts";

const CONV = "c-1";
const TRACE_URI = `${URN_STEMS.trace}chatgpt/${CONV}`;

function messageSpan(id: string, role: "user" | "assistant", text: string, start: number): SpanItem {
	const s = span({
		traceId: "0123456789abcdef0123456789abcdef",
		spanId: deriveSpanId(`${CONV}/${id}`),
		name: `turn ${id}`,
		startUnixNano: `${start * 1_000_000_000}`,
		endUnixNano: `${(start + 1) * 1_000_000_000}`,
		attributes: {
			[SEMCONV.genAi.system]: "chatgpt",
			...(role === "assistant" ? { [SEMCONV.genAi.requestModel]: "gpt-5.2" } : {}),
		},
	});
	s.events = [
		role === "user"
			? spanEvent("gen_ai.content.prompt", `${start * 1_000_000_000}001`, {
					[SEMCONV.genAi.prompt]: text,
				})
			: spanEvent("gen_ai.content.completion", `${(start + 1) * 1_000_000_000}000`, {
					[SEMCONV.genAi.completion]: text,
				}),
	];
	return s;
}

function sampleTrace(...spans: SpanItem[]) {
	return trace(
		resource({
			"service.name": "chatgpt.com",
			[SEMCONV.pageread.conversationId]: CONV,
			[SEMCONV.pageread.title]: "Traces and horizons",
			...(spans.length > 0 ? { [SEMCONV.pageread.projectId]: "fleet-rekon" } : {}),
		}),
		spans,
	);
}

async function putTrace(store: ReturnType<typeof memoryContentStore>, body: unknown, uri = TRACE_URI) {
	await store.put({
		uri,
		mimeType: MEDIA_TYPES.trace,
		body: JSON.stringify(body),
	});
}

describe("transcripts index", () => {
	it("summarizes conversations and finds across titles and messages", async () => {
		const store = memoryContentStore();
		await putTrace(store, sampleTrace(messageSpan("a", "user", "hello signals", 1), messageSpan("b", "assistant", "the router batches mutations", 2)));
		const indexer = createIndexer(store, transcriptsIndex());
		await indexer.ready;

		const snap = indexer.view()!;
		expect(snap.conversations).toHaveLength(1);
		const conv = snap.conversations[0]!;
		expect(conv.conversationId).toBe(CONV);
		expect(conv.title).toBe("Traces and horizons");
		expect(conv.models).toEqual(["gpt-5.2"]);
		expect(conv.messageCount).toBe(2);
		expect(conv.traceUri).toBe(TRACE_URI);

		const titleHits = indexer.find("horizons");
		expect(titleHits[0]?.field).toBe("title");
		expect(titleHits[0]?.uri).toBe(TRACE_URI);

		const msgHits = indexer.find("router");
		expect(msgHits[0]?.field.startsWith("message:")).toBe(true);
		expect(msgHits[0]?.excerpt).toContain("router");

		// multi-term: both terms present in the same field
		expect(indexer.find("hello signals")).toHaveLength(1);
		expect(indexer.find("zzz-unmatchable")).toEqual([]);
	});

	it("refreshes reactively on store writes (debounced)", async () => {
		const store = memoryContentStore();
		await putTrace(store, sampleTrace(messageSpan("a", "user", "first capture", 1)));
		const indexer = createIndexer(store, transcriptsIndex());
		await indexer.ready;
		expect(indexer.view()!.conversations[0]!.messageCount).toBe(1);

		await putTrace(
			store,
			sampleTrace(messageSpan("a", "user", "first capture", 1), messageSpan("b", "assistant", "second", 2)),
		);
		await new Promise((r) => setTimeout(r, 300));
		expect(indexer.view()!.conversations[0]!.messageCount).toBe(2);
	});

	it("persists a MIME-typed snapshot document", async () => {
		const store = memoryContentStore();
		await putTrace(store, sampleTrace(messageSpan("a", "user", "x", 1)));
		const indexer = createIndexer(store, transcriptsIndex());
		await indexer.ready;
		const snap = await store.match("urn:pageread:index:transcripts");
		expect(snap?.mimeType).toBe(MEDIA_TYPES.index);
	});
});

describe("conversation index", () => {
	it("indexes one conversation's messages with roles and find offsets", async () => {
		const store = memoryContentStore();
		// an unrelated conversation that must be excluded
		const other = sampleTrace(messageSpan("z", "user", "other chat text", 1));
		other.resource.attributes[SEMCONV.pageread.conversationId] = "c-other";
		await putTrace(store, other, `${URN_STEMS.trace}chatgpt/c-other`);
		await putTrace(
			store,
			sampleTrace(messageSpan("a", "user", "what is a signal query selector", 1), messageSpan("b", "assistant", "a live query joined into the change stream", 2)),
		);
		const indexer = createIndexer(store, conversationIndex(CONV));
		await indexer.ready;

		const snap = indexer.view()!;
		expect(snap.conversationId).toBe(CONV);
		expect(snap.title).toBe("Traces and horizons");
		expect(snap.messages.map((m) => m.role)).toEqual(["user", "assistant"]);
		expect(snap.messages[1]?.model).toBe("gpt-5.2");

		const hits = indexer.find("change stream");
		expect(hits).toHaveLength(1);
		expect(hits[0]!.end).toBeGreaterThan(hits[0]!.start);
	});
});

describe("projects index", () => {
	it("groups conversations by pageread.project.id", async () => {
		const store = memoryContentStore();
		await putTrace(store, sampleTrace(messageSpan("a", "user", "hello", 1)));
		const indexer = createIndexer(store, projectsIndex());
		await indexer.ready;
		const snap = indexer.view()!;
		expect(snap.projects).toHaveLength(1);
		expect(snap.projects[0]!.projectId).toBe("fleet-rekon");
		expect(snap.projects[0]!.conversations[0]!.conversationId).toBe(CONV);
		expect(indexer.find("fleet")).toEqual([]); // ids are not findable text
		expect(indexer.find("horizons")[0]?.field).toBe("title");
	});
});

describe("validateTrace integration", () => {
	it("shape helpers reject non-trace bodies without exploding", async () => {
		const store = memoryContentStore();
		await store.put({ uri: "urn:pageread:raw:junk", mimeType: MEDIA_TYPES.trace, body: "{not json" });
		const indexer = createIndexer(store, transcriptsIndex());
		await indexer.ready;
		expect(indexer.view()!.conversations).toEqual([]);
	});
});

describe("factory regressions", () => {
	it("survives put events on a uriPrefix-filtered index (event.uri on all variants)", async () => {
		const store = memoryContentStore();
		let builds = 0;
		const indexer = createIndexer(store, {
			name: "prefixed",
			filter: { uriPrefix: "urn:pageread:trace:" },
			build(entries, _prev, ctx) {
				builds++;
				return { known: ctx.knownUris };
			},
		});
		await indexer.ready;
		await store.put({ uri: "urn:pageread:trace:a", mimeType: MEDIA_TYPES.trace, body: "{}" });
		await new Promise((r) => setTimeout(r, 300));
		expect(builds).toBeGreaterThanOrEqual(2);
		expect(indexer.view()).toEqual({ known: ["urn:pageread:trace:a"] });
	});
});

describe("TextIndex", () => {
	it("addField replaces a field's postings instead of appending", () => {
		const index = new TextIndex();
		index.addField("urn:a", "message:1", "router batches mutations");
		index.addField("urn:a", "message:1", "signals join streams");
		expect(index.find("batches")).toEqual([]);
		expect(index.find("join")).toHaveLength(1);
		expect(index.find("router")).toEqual([]);
	});
});
