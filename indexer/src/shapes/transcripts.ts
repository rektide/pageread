/**
 * The transcripts index: every conversation the store holds a trace for —
 * id, title, last activity, models, message counts — plus a warm text
 * token-AND finder over titles and message content.
 */
import { SEMCONV, type TraceItem } from "@pageread/schema";
import { TextIndex } from "../text-index.ts";
import type { IndexerConfig } from "../types.ts";
import { lastActivityMs, parseTraces, resourceAttrs } from "./shared.ts";

export interface TranscriptSummary {
	conversationId: string;
	traceUri: string;
	title: string;
	updatedAt?: number;
	models: string[];
	messageCount: number;
}

export interface TranscriptsSnapshot {
	conversations: TranscriptSummary[];
}

function summarize(trace: TraceItem, uri: string): TranscriptSummary {
	const attrs = resourceAttrs(trace);
	const models = new Set<string>();
	let messageCount = 0;
	for (const s of trace.spans ?? []) {
		const model = s.attributes?.[SEMCONV.genAi.requestModel];
		if (typeof model === "string") models.add(model);
		const isMessage =
			s.attributes?.[SEMCONV.genAi.system] !== undefined ||
			s.attributes?.[SEMCONV.pageread.messageId] !== undefined ||
			(s.events ?? []).some((e) => e.name.startsWith("gen_ai.content."));
		if (isMessage) messageCount++;
	}
	return {
		conversationId: String(attrs[SEMCONV.pageread.conversationId] ?? uri),
		traceUri: uri,
		title: String(
			attrs[SEMCONV.pageread.title] ?? attrs[SEMCONV.pageread.conversationId] ?? uri,
		),
		updatedAt: lastActivityMs(trace),
		models: [...models].sort(),
		messageCount,
	};
}

function mergeSummary(prev: TranscriptSummary | undefined, next: TranscriptSummary): TranscriptSummary {
	if (prev === undefined) return next;
	return {
		...next,
		models: [...new Set([...prev.models, ...next.models])].sort(),
		messageCount: Math.max(prev.messageCount, next.messageCount),
		updatedAt:
			(next.updatedAt ?? 0) >= (prev.updatedAt ?? 0) ? next.updatedAt : prev.updatedAt,
	};
}

export function transcriptsIndex(): IndexerConfig<TranscriptsSnapshot> {
	return {
		name: "transcripts",
		filter: { mimeType: "application/vnd.pageread.trace+json" },
		build(entries) {
			const conversations = new Map<string, TranscriptSummary>();
			for (const { entry, trace } of parseTraces(entries)) {
				const summary = summarize(trace, entry.uri);
				const prev = conversations.get(summary.conversationId);
				// newest activity or richest content wins, but models/message
				// counts merge — re-captured partial traces never lose data
				if (
					prev === undefined ||
					(summary.updatedAt ?? 0) >= (prev.updatedAt ?? 0) ||
					summary.messageCount > prev.messageCount
				) {
					conversations.set(summary.conversationId, mergeSummary(prev, summary));
				} else {
					conversations.set(summary.conversationId, mergeSummary(summary, prev));
				}
			}
			return {
				conversations: [...conversations.values()].sort(
					(a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0),
				),
			};
		},
		makeFinder(entries, snapshot) {
			const index = new TextIndex();
			for (const conv of snapshot.conversations) {
				index.addField(conv.traceUri, "title", conv.title);
			}
			for (const { entry, trace } of parseTraces(entries)) {
				for (const s of trace.spans ?? []) {
					for (const e of s.events ?? []) {
						const content =
							e.attributes?.[SEMCONV.genAi.prompt] ?? e.attributes?.[SEMCONV.genAi.completion];
						if (typeof content === "string") {
							index.addField(entry.uri, `message:${s.span_id}`, content);
						}
					}
				}
			}
			return (query) => index.find(query);
		},
	};
}
