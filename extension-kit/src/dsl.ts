/**
 * The extension-building DSL: a declarative ExtensionSpec that the
 * codegen (@pageread/extension-build) compiles into WXT entrypoints and
 * the kit runtime executes. Readers turn captures into store puts,
 * content-index entries, and — per the astra-medium review — explicit
 * observation envelopes: capture completeness is first-class data, and a
 * partial observation never implies deletion.
 */
import type { ContentIndexEntry, PutInput } from "@pageread/store";
import type { Capture } from "./capture.ts";

export type Coverage = "complete" | "partial" | "unknown";

/**
 * Semantic assertion by the reader about what a capture observed. The
 * resolver (a later stage) uses these to merge observations; nothing
 * downstream may treat absence-in-a-partial-capture as deletion.
 */
export interface ObservationEnvelope {
	coverage: Coverage;
	/** entity ids this observation actually saw (e.g. message node ids) */
	covers?: string[];
	/** upstream revision the source exposed, if any */
	observedRevision?: string;
	/** branch identity, if the source branches */
	branch?: string;
	/** raw capture provenance URI */
	captureUri?: string;
}

export interface NetworkSource {
	/** glob URL patterns: "https://chatgpt.com/backend-api/conversation/*" */
	include: string[];
	methods?: string[];
	captureBodies?: boolean;
	maxBodyBytes?: number;
}

export interface DomSource {
	/** entities to observe, e.g. "[data-message-author-role]" */
	selector: string;
	/** microdata itemtype filter, when entities carry embedded items */
	itemTypes?: string[];
}

export interface ReaderContext {
	captureUri(capture: Capture): string;
	nowMs(): number;
}

export interface ReaderResult {
	puts?: PutInput[];
	contentIndex?: ContentIndexEntry[];
	/** what this observation actually saw — see ObservationEnvelope */
	observation?: ObservationEnvelope;
}

export interface ReaderSpec {
	name: string;
	match(capture: Capture): boolean;
	read(capture: Capture, ctx: ReaderContext): Promise<ReaderResult> | ReaderResult;
}

export interface ExtensionSpec {
	/** kebab-case; names generated entrypoints */
	name: string;
	/** manifest match patterns for the content scripts */
	matches: string[];
	network?: NetworkSource;
	dom?: DomSource;
	readers: ReaderSpec[];
	/** index shape names to maintain in the SW */
	indexes?: string[];
	runAt?: "document_start" | "document_end" | "document_idle";
}

export function defineExtension(spec: ExtensionSpec): ExtensionSpec {
	const issues: string[] = [];
	if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(spec.name)) issues.push(`name must be kebab-case: ${spec.name}`);
	if (spec.matches.length === 0) issues.push("matches must not be empty");
	if (spec.readers.length === 0) issues.push("at least one reader is required");
	const names = new Set<string>();
	for (const reader of spec.readers) {
		if (!reader.name) issues.push("every reader needs a name");
		else if (names.has(reader.name)) issues.push(`duplicate reader name: ${reader.name}`);
		else names.add(reader.name);
	}
	if (spec.network && spec.network.include.length === 0) issues.push("network.include must not be empty");
	if (spec.dom && !spec.dom.selector) issues.push("dom.selector is required when dom is set");
	if (issues.length > 0) throw new Error(`defineExtension: invalid spec\n  ${issues.join("\n  ")}`);
	return spec;
}
