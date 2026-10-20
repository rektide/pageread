/**
 * A tiny inverted index with positions: the ctrl+F engine. Fields are
 * named texts (e.g. "title", "message:spanId"); queries tokenize to terms
 * and intersect postings, returning per-field matches with offsets and
 * excerpts.
 */
import { normalizeQuery, tokenize } from "./tokenize.ts";
import type { FindMatch } from "./types.ts";

interface Posting {
	uri: string;
	field: string;
	start: number;
	end: number;
}

export class TextIndex {
	#postings = new Map<string, Posting[]>();
	#texts = new Map<string, Map<string, string>>(); // uri → field → text

	addField(uri: string, field: string, text: string): void {
		let fields = this.#texts.get(uri);
		if (!fields) {
			fields = new Map();
			this.#texts.set(uri, fields);
		}
		fields.set(field, text);
		for (const tok of tokenize(text)) {
			let list = this.#postings.get(tok.term);
			if (!list) {
				list = [];
				this.#postings.set(tok.term, list);
			}
			list.push({ uri, field, start: tok.start, end: tok.end });
		}
	}

	remove(uri: string): void {
		if (!this.#texts.has(uri)) return;
		this.#texts.delete(uri);
		for (const [term, list] of this.#postings) {
			const kept = list.filter((p) => p.uri !== uri);
			if (kept.length === list.length) continue;
			if (kept.length === 0) this.#postings.delete(term);
			else this.#postings.set(term, kept);
		}
	}

	clear(): void {
		this.#postings.clear();
		this.#texts.clear();
	}

	find(query: string, opts?: { excerptRadius?: number }): FindMatch[] {
		const terms = normalizeQuery(query);
		if (terms.length === 0) return [];
		const radius = opts?.excerptRadius ?? 32;
		const lists = terms.map((t) => this.#postings.get(t) ?? []);
		// single-term: direct postings; multi-term: intersect on (uri, field)
		if (lists.length === 1) {
			return lists[0]!.map((p) => this.toMatch(p, radius));
		}
		const first = lists[0]!;
		const results: FindMatch[] = [];
		for (const p of first) {
			const allPresent = lists.every(
				(list) => list.some((q) => q.uri === p.uri && q.field === p.field),
			);
			if (allPresent) results.push(this.toMatch(p, radius));
		}
		return results;
	}

	private toMatch(p: Posting, radius: number): FindMatch {
		const text = this.#texts.get(p.uri)?.get(p.field) ?? "";
		const from = Math.max(0, p.start - radius);
		const to = Math.min(text.length, p.end + radius);
		return {
			uri: p.uri,
			field: p.field,
			start: p.start,
			end: p.end,
			excerpt: `${from > 0 ? "…" : ""}${text.slice(from, to)}${to < text.length ? "…" : ""}`,
		};
	}
}
