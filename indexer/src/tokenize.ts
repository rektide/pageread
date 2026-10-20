/** Minimal tokenizer for the text index: unicode-aware, lowercase. */

const SEGMENTER = /\p{L}[\p{L}\p{M}\p{N}]*|\p{N}+/gu;

export interface Token {
  term: string;
  start: number;
  end: number;
}

export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(SEGMENTER)) {
    out.push({ term: m[0]!.toLowerCase(), start: m.index!, end: m.index! + m[0]!.length });
  }
  return out;
}

export function normalizeQuery(query: string): string[] {
  return tokenize(query).map((t) => t.term);
}
