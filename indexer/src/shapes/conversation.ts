/**
 * The per-conversation message index: one named index per conversation,
 * holding message summaries (role, model, timing, text) with a text
 * token-AND finder over each message in a single chat.
 */
import { SEMCONV, type SpanItem } from "@pageread/schema";
import { TextIndex } from "../text-index.ts";
import type { FindMatch, IndexerConfig } from "../types.ts";
import { nanoToMs, parseTraces, resourceAttrs } from "./shared.ts";

export interface MessageSummary {
	spanId: string;
	role: string;
	model?: string;
	startedAtMs?: number;
	text: string;
}

export interface ConversationSnapshot {
	conversationId: string;
	title?: string;
	messages: MessageSummary[];
}

function spanText(s: SpanItem): string {
	const parts: string[] = [];
	for (const e of s.events ?? []) {
		const content =
			e.attributes?.[SEMCONV.genAi.prompt] ?? e.attributes?.[SEMCONV.genAi.completion];
		if (typeof content === "string") parts.push(content);
	}
	const inline = s.attributes?.[SEMCONV.genAi.prompt] ?? s.attributes?.[SEMCONV.genAi.completion];
	if (typeof inline === "string" && parts.length === 0) parts.push(inline);
	return parts.join("\n");
}

function spanRole(s: SpanItem): string {
	const role = s.attributes?.[SEMCONV.genAi.messageRole];
	if (typeof role === "string") return role;
	const hasPrompt = (s.events ?? []).some(
		(e) => e.name === "gen_ai.content.prompt" || e.attributes?.[SEMCONV.genAi.prompt] !== undefined,
	);
	const hasCompletion = (s.events ?? []).some(
		(e) =>
			e.name === "gen_ai.content.completion" ||
			e.attributes?.[SEMCONV.genAi.completion] !== undefined,
	);
	if (hasPrompt && !hasCompletion) return "user";
	if (hasCompletion) return "assistant";
	return "system";
}

function isMessageSpan(s: SpanItem): boolean {
	return (
		s.attributes?.[SEMCONV.pageread.messageId] !== undefined ||
		s.attributes?.[SEMCONV.genAi.system] !== undefined ||
		s.attributes?.[SEMCONV.genAi.messageRole] !== undefined ||
		(s.events ?? []).some((e) => e.name.startsWith("gen_ai.content."))
	);
}

export function conversationIndex(conversationId: string): IndexerConfig<ConversationSnapshot> {
	return {
		name: `conversation:${conversationId}`,
		filter: { mimeType: "application/vnd.pageread.trace+json" },
		build(entries) {
			const messages = new Map<string, MessageSummary>();
			let title: string | undefined;
			for (const { trace } of parseTraces(entries)) {
				const attrs = resourceAttrs(trace);
				if (String(attrs[SEMCONV.pageread.conversationId] ?? "") !== conversationId) continue;
				if (title === undefined && attrs[SEMCONV.pageread.title] !== undefined) {
					title = String(attrs[SEMCONV.pageread.title]);
				}
				for (const s of trace.spans ?? []) {
					if (!isMessageSpan(s)) continue;
					const model = s.attributes?.[SEMCONV.genAi.requestModel];
					const next: MessageSummary = {
						spanId: s.span_id,
						role: spanRole(s),
						model: typeof model === "string" ? model : undefined,
						startedAtMs: nanoToMs(s.start_time_unix_nano),
						text: spanText(s),
					};
					const prev = messages.get(s.span_id);
					// richer text wins on re-capture
					messages.set(s.span_id, prev && prev.text.length > next.text.length ? prev : next);
				}
			}
			return {
				conversationId,
				title,
				messages: [...messages.values()].sort(
					(a, b) => (a.startedAtMs ?? 0) - (b.startedAtMs ?? 0),
				),
			};
		},
		makeFinder(entries) {
			const index = new TextIndex();
			for (const { entry, trace } of parseTraces(entries)) {
				const attrs = resourceAttrs(trace);
				if (String(attrs[SEMCONV.pageread.conversationId] ?? "") !== conversationId) continue;
				for (const s of trace.spans ?? []) {
					if (!isMessageSpan(s)) continue;
					const text = spanText(s);
					if (text) index.addField(entry.uri, `message:${s.span_id}`, text);
				}
			}
			return (query) => index.find(query);
		},
	};
}

export type { FindMatch };
