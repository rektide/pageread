---
type: ResearchDesign
title: "Independent wave 0 — evidence-backed content and reactive indexes"
description: "Fresh design alternatives for conversation semantics, microdata, MIME content, independent indexes, replay, and agent-facing capabilities."
resource: /design/tabula-rasa/research0-content.gpt61s.md
status: draft
generated:
  at: 2026-10-20
  by: "model:openai/gpt-6.1-sol#medium"
sources:
  - resource: "opencode://ses_ea50ff0acffevf3FXaD3OV4buy"
    title: "Independent wave 0 research, interface design, alternatives, and authorized persistence without inspecting existing pageread material"
  - resource: "https://github.com/open-telemetry/semantic-conventions-genai/tree/547934afa90a34298441caf80c43b27255c3a292"
    title: "Current developmental GenAI conventions: client inference, spans, events, content capture, and message schemas"
  - resource: "https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/logs/data-model.md"
    title: "Logs Data Model, inspected in third-party archive: occurrence and observation timestamps, optional trace context"
  - resource: "https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/overview.md"
    title: "Tracing signal and semantic-convention boundaries, inspected in third-party archive"
  - resource: "https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/api.md"
    title: "Span parentage and links, inspected in third-party archive"
  - resource: "https://w3c.github.io/ServiceWorker/"
    title: "Service Workers editor's draft dated 2026-09-17: Cache, CacheStorage, lifetime, and request matching"
  - resource: "https://wicg.github.io/content-index/spec/"
    title: "Content Index editor's draft dated 2021-04-13: discovery descriptions and add/delete/getAll"
  - resource: "https://html.spec.whatwg.org/multipage/microdata.html"
    title: "HTML microdata, fetched 2026-10-20: property names, values, scopes, identifiers, and itemref"
  - resource: "https://github.com/agentclientprotocol/agent-client-protocol/tree/b48be59c5c4697ba3becfb6afa91372a85ca9f00/docs/protocol/v1"
    title: "ACP v1 overview, content, filesystem, and extensibility, inspected in third-party archive"
  - resource: "https://github.com/a2aproject/A2A/blob/main/docs/llms.txt"
    title: "Third-party archive reading map; claims checked against the specification where used"
  - resource: "https://github.com/a2aproject/A2A/blob/main/docs/specification.md"
    title: "A2A task, content, listing, and subscription boundaries, inspected in third-party archive"
extensions:
  commission_context:
    - resource: /design/tabula-rasa/brief0.gpt6a.md
      relation: "Parent-provided commission context; not read"
    - resource: /design/tabula-rasa/design0.gpt6a.md
      relation: "Forthcoming parent synthesis; not read"
  verification: "Primary-source research only; proposed interfaces and falsification tests are not implemented or executed."
---

# Independent wave 0: evidence-first conversations, versioned content, named indexes

**Recommendation — design proposal:** make conversation content and its evidence
primary; offer OTel-compatible telemetry as a qualified projection. Combine a
MIME-bearing, Cache-shaped content interface with independently named reactive
indexes. Parsing, indexing, querying, and replay are transport-independent
capabilities; ACP and later A2A adapt them rather than define them.

## Commission and independence

This wave addresses historical/reconstructed ChatGPT conversations, microdata
adapting OTel conventions, reusable extension authoring, MIME-bearing content,
independent reactive indexes, and agent access. The parent points to the
[commission brief](./brief0.gpt6a.md) and [forthcoming synthesis](./design0.gpt6a.md).
Those documents are commission/navigation context, **not sources read**.

No existing pageread code, documentation, configuration, dependencies, history,
issues, or sibling agent outputs were inspected. No personal live ChatGPT access
occurred. Third-party archives were checked before primary-source web retrieval.
This document is the sole authorized file written by this wave. No implementation
or tests were performed. Broader repository doc-pass was intentionally excluded
by the anti-anchoring commission.

## 1. Primary-source findings

### OTel GenAI has moved and remains developmental

**Verified fact:** archived `open-telemetry/semantic-conventions` GenAI documents
redirect to `open-telemetry/semantic-conventions-genai`. The current documents
still mark the conventions **Development**. Research used revision
[`547934afa90a34298441caf80c43b27255c3a292`](https://github.com/open-telemetry/semantic-conventions-genai/tree/547934afa90a34298441caf80c43b27255c3a292).

Important current definitions:

- [GenAI spans — Spans](https://github.com/open-telemetry/semantic-conventions-genai/blob/547934afa90a34298441caf80c43b27255c3a292/docs/gen-ai/gen-ai-spans.md#spans):
  spans represent **logical operations observed by the caller**, normally covering
  initiation through full response, error, or cancellation.
- [Client inference](https://github.com/open-telemetry/semantic-conventions-genai/blob/547934afa90a34298441caf80c43b27255c3a292/docs/gen-ai/client-inference.md):
  current names include `gen_ai.client.inference` and event
  `gen_ai.client.inference.operation.details`. Older examples with different
  event names must not silently define the current contract.
- `gen_ai.conversation.id` uses an available conversation identifier; the
  convention rejects inventing a UUID, trace ID, or content hash as fallback.
- `gen_ai.input.messages` means messages **in the order sent to the model**, not
  necessarily everything displayed in a conversation. Output messages represent
  generation choices/candidates; a displayed assistant message is not
  automatically one API generation.
- `gen_ai.request.model` and `gen_ai.response.model` differ. A UI model label does
  not necessarily establish either exact identifier.
- Detailed token counts are often subsets, not additional totals: cached input
  belongs within total input; reasoning output belongs within total output.
- [Capturing content](https://github.com/open-telemetry/semantic-conventions-genai/blob/547934afa90a34298441caf80c43b27255c3a292/docs/gen-ai/gen-ai-spans.md#capturing-instructions-inputs-and-outputs):
  instrumentation content capture should be opt-in. External storage is supported,
  but standard external-reference encoding remains TODO. The streaming-chunks
  section is also TODO.

**Design consequence:** do not advertise invented external-reference attributes
or chunk-event vocabularies as OTel standards. Pin the adopted projection mapping
and keep it replaceable as the developmental conventions change.

### Occurrence is not observation; content graphs are not traces

**Verified fact:** the [Logs Data Model — Timestamp and ObservedTimestamp](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/logs/data-model.md#field-timestamp)
distinguishes source occurrence time from collection observation time. Source
timestamp may be missing; trace context is optional.

The [tracing model](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/overview.md#tracing-signal)
describes operations with start/finish timestamps and causal parentage. A span
has at most one parent; links express other span relationships.

**Design consequence:** conversation ancestry, project membership, message
revision, and execution causality need distinct relations. A content graph is not
a trace graph.

### Cache and ContentIndex are inspirations, not complete contracts

**Verified facts:**

- [Service Workers §5.4 Cache](https://w3c.github.io/ServiceWorker/#cache-interface)
  provides request/response storage: `match`, `matchAll`, `put`, `delete`, `keys`.
- [`Cache.put`](https://w3c.github.io/ServiceWorker/#cache-put) requires HTTP(S)
  GET keys, rejects status 206 and `Vary: *`, and reads the body. It is not an
  appendable live-body store.
- [Request matching](https://w3c.github.io/ServiceWorker/#request-matches-cached-item-algorithm)
  ignores fragments and normally considers query strings and `Vary`.
- [Cache lifetime](https://w3c.github.io/ServiceWorker/#cache-lifetimes) is
  author-managed, not ordinary HTTP-cache expiry.
- [Content Index §5.3](https://wicg.github.io/content-index/spec/#content-index)
  provides `add(description)`, `delete(id)`, and `getAll()`. Descriptions contain
  discovery metadata and launch URLs, separate from cached bodies.
- Content Index is an incubation draft for browser discovery of offline-enabled
  content. It does not define arbitrary independently created indexes, query
  subscriptions, or replay cursors.

**Design consequence:** call the proposed interfaces **Cache-shaped** and
**ContentIndex-like**, documenting extensions and departures rather than claiming
native API compatibility.

## 2. Three coherent models

| Model | Attraction | Liability |
| --- | --- | --- |
| Telemetry-first ledger: conversations become operations, spans, and events | Existing observability tools and execution analysis | Forces unknown execution boundaries, timing, and causality into a model implying knowledge |
| Document-first collections: MIME documents and mutable discovery indexes | Small API, natural exports, easy authoring | Revision, evidence, conflict, and replay semantics can become ad hoc |
| Evidence-backed resources with reactive projections | Historical uncertainty, multiple views, re-parsing | Requires explicit revision, coverage, conflict, and retention contracts |

**Proposal:** the third model, initially implemented with the restraint of the
second. Commit to observable guarantees, not a universal event-sourced database,
CRDT, graph engine, IPC arrangement, Rust workspace, or storage backend.

## 3. Five information boundaries

**Design proposal:**

| Kind | Examples | Rule |
| --- | --- | --- |
| Content and relations | Projects, conversations, messages, parts, branch ancestry | Describe what exists or was reported |
| Evidence | Captured response, DOM excerpt, source location, parser version | Explain why a value or relation is believed |
| Imported telemetry | Actual trace/span/event data embedded in a page | Preserve source semantics and identifiers |
| Derived telemetry | Qualified inference-operation reconstruction | Declare derivation and uncertainty |
| Runtime diagnostics | Capture latency, parser failures, index lag | Describe the collector, not historical model execution |

These can share machinery without sharing ambiguous types.

### Historical conversations and branches

- Retain native source IDs when available, scoped by provider and account/workspace.
- Separate message identity from revision, selected path from all discovered
  messages, and conversational parentage from span parentage.
- Preserve unresolved references. Do not require all source branch structures to
  be trees; later evidence may establish a more general graph.
- Do not equate a message ID with `gen_ai.response.id` without source evidence.
- “All transcripts” means all known to this collection unless completed collection
  evidence establishes broader coverage.

### Missing timing and usage

**Invariants:** unknown is not zero; retrieval time is not generation time;
message creation is not necessarily inference start; the next message timestamp
is not the preceding generation's end; visible-text tokenization is not
provider-reported usage. Re-reading historical content must not increment
production inference-usage counters.

An estimate can exist separately:

```ts
{
  value: 427,
  kind: "estimate",
  method: "tokenizer-name/version",
  inputRevision: "...",
}
```

Do not place that estimate in provider-usage fields by default. When execution
boundaries are unknown, retain content/evidence or a custom observation event;
do not fabricate a zero-duration inference span to satisfy an exporter.

### Streaming

Distinguish source protocol chunks, DOM observations, materialized revisions,
and generation completion. A DOM mutation is neither a token nor necessarily a
source chunk. Chunks may replace, patch, or retract content rather than append.

```ts
type Completion = "in-progress" | "complete" | "interrupted" | "unknown";
```

Observer disconnection means incomplete observation, not necessarily failed
generation. Preserve source cursors/sequence numbers where present. A local
observation sequence must not masquerade as provider sequence.

## 4. Microdata encoding

**Verified fact:** microdata consists of items and string/item-valued properties,
not typed JSON. Repeated values have order. Nested scopes stop ordinary property
traversal; `itemref` adds referenced elements. [HTML §5.2.3](https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute)
forbids dots in defined non-URL property names. Thus
`itemprop="gen_ai.request.model"` is not a conforming property definition.

**Proposal:** define a small application-owned vocabulary with absolute
`itemtype` URLs, documented `itemid` identity rules, dot-free property names, and
an explicit mapping to OTel keys. Alternatively use application-owned absolute
property URLs. Do not invent OTel-owned vocabulary URLs.

Illustrative only; the domain and syntax are not selected:

```html
<article itemscope
         itemtype="https://example.invalid/vocab/Message"
         itemid="https://example.invalid/resources/messages/m1">
  <meta itemprop="role" content="assistant">
  <div itemprop="content">Hello.</div>
  <a itemprop="parent"
     href="https://example.invalid/resources/messages/m0">Parent</a>
</article>
```

Parsing needs schema-directed conversion of booleans, numbers, timestamps,
arrays, and missing values. `textContent` is not lossless HTML or Markdown;
preserve rich representations as separately MIME-typed content.

**Security invariant:** markup is evidence, not authority. Pages and conversation
text can contain misleading microdata. Prefer adapter-selected trusted roots;
retain provenance and never execute page-supplied schema/parser references.

## 5. Minimal content interface

The following is a semantic sketch, not final API naming:

```ts
interface ContentStore {
  put(url: string, response: Response, options: {
    expectedRevision: string | null;
    operationId: string;
    evidence?: EvidenceRef[];
  }): Promise<ContentRef>;

  match(ref: ContentRef): Promise<Response | undefined>;
  head(url: string): Promise<ContentRef | undefined>;

  delete(url: string, options: {
    expectedRevision: string;
    operationId: string;
  }): Promise<void>;
}

interface ContentRef {
  url: string;
  revision: string;
  mediaType: string;
}
```

### Contract

- A reference identifies an immutable representation revision. A logical URL can
  gain a newer head without changing old references.
- `match(ref)` returns those bytes or reports unavailable, never silently current
  bytes. Returned bodies are independently consumable by different callers.
- MIME comes from validated representation metadata, normally `Content-Type`.
  Missing MIME is explicit rather than guessed into certainty; the final type may
  therefore need an unknown case beyond this illustrative sketch.
- Source URL, logical resource URL, and stored revision address are distinct.
  Source ETag/version, digest, and local revision token are also distinct.
- Do not use URL fragments as physical Cache keys for separate messages.
- Account identity partitions resources and authorization even at identical URLs.
- Conflicts are explicit; arrival time alone does not establish source freshness.

Direct CacheStorage use remains open. Another backend can preserve Response-shaped
access. Streaming observations produce bounded captures or materialized revisions,
not a requirement to durably store a never-ending Response through `Cache.put`.

## 6. Independently named indexes

Indexes are independently creatable and addressable, not hard-coded singleton
views. Examples include known transcripts, known projects, a conversation's
messages, and a user-created research subset.

```ts
interface IndexRegistry {
  create(name: string, definition: IndexDefinition): Promise<IndexHandle>;
  open(name: string): Promise<IndexHandle>;
  list(): Promise<IndexDescription[]>;
}

interface IndexHandle {
  add(entry: Entry, options: WriteOptions): Promise<Commit>;
  delete(id: string, options: WriteOptions): Promise<Commit>;
  getAll(options?: PageOptions): Promise<SnapshotPage>;
  observe(options?: { after?: Cursor }): AsyncIterable<IndexEvent>;
}

interface Entry {
  id: string;
  title?: string;
  description?: string;
  content?: ContentRef;
  sourceUrl?: string;
  relations?: Relation[];
}
```

Definitions distinguish explicit membership from maintained derived membership.
A derived index also needs a versioned definition and projection progress.

### Snapshot/change invariants

- An index has identity and generation/epoch. Changes carry opaque cursors.
- `getAll()` provides a coherent boundary; pagination stays bound to it.
- `observe()` starts with a coherent snapshot followed by changes, or resumes
  after a cursor. Snapshot-to-live handoff has no silent gap.
- Expired cursors explicitly require reset. Duplicate delivery is acceptable when
  detectable; silent loss is not.
- Slow consumers cause backpressure or an explicit gap/reset, not unbounded memory.
- Projection lag is observable. Independent indexes need not imply simultaneous
  freshness or a global cursor/order.

If consumers need aligned multi-index snapshots, add that guarantee deliberately;
do not compare unrelated cursor strings.

### Shared observation

Iterable, live, and signal interfaces adapt one shared observation facility:
one source observation per compatible root/options, reference-counted lifecycle,
independent cancellation, isolated published values, explicit errors/overflow,
and a defined current-state boundary for late subscribers. Signal adapters can
materialize state without selecting a signal library for the core.

## 7. Deletion, partial collection, restart, and competing writers

### Deletion is not one operation

Distinguish removing membership, recording source deletion, deleting a content
head, privacy-purging retained content/evidence, and temporary unavailability.
Removing a conversation from a project does not delete its content or its
membership in all transcripts.

**Critical invariant:** absence from partial pages, virtualized DOM, filtered
lists, or failed pagination is not deletion evidence. Track coverage explicitly:

```ts
{
  scope: "...",
  state: "partial" | "complete" | "unknown",
  collectionRun: "...",
  sourceBoundary: "...",
}
```

No automatic reconciliation/pruning is proposed. A future replacement operation
must be explicit, scoped, and grounded in an authoritative complete collection.

### Three different replay products

1. Change replay reproduces retained index changes.
2. Parser replay runs a named parser version over retained captures.
3. Source-stream replay reproduces captured source events.

None implies the others. Retention capabilities must be discoverable. A live
in-memory observer need not promise restart replay; a durable adapter may have a
retention floor. Parser replay should target an isolated index/output generation
by default, not silently overwrite accepted materializations.

### Multiple writers and crash boundaries

Start with optimistic concurrency and idempotency, not a CRDT mandate. Stable
operation IDs make retries safe; expected revisions prevent silent overwrites.
Preserve source ordering evidence and inspectable conflicts. DOM fallback must
not overwrite richer network evidence merely because it arrived later.

Store content before publishing a visible index reference. Acknowledged commits
must satisfy advertised durability. Separate stores require explicit crash
recovery; two unrelated successful calls do not establish atomicity. A body that
later becomes unavailable must not appear as an empty successful response.

## 8. Declarative orchestration and executable parsers

| Approach | Benefit | Cost |
| --- | --- | --- |
| Pure declarative extraction | Inspectable, portable, statically permissionable | Awkward for irregular protocols and streaming patches |
| Arbitrary executable adapters | Maximum expressiveness | Hidden effects, weak replayability, difficult permission review |
| Declarative orchestration with executable parsers | Inspectable sources/permissions and practical parsing | Needs a precise execution boundary |

**Recommendation:** the hybrid. Declarations describe allowed origins and
sources, network matching/MIME expectations, DOM fallback activation, selector
observations, parser version, output schemas/indexes, coverage/conflict policy,
and fixture expectations.

```ts
interface Parser {
  parse(capture: Capture, context: ParseContext): AsyncIterable<Proposal>;
}
```

A proposal is not a storage side effect: it can describe an entity observation,
relation, representation, source event, coverage statement, or diagnostic.
Equivalent capture + parser version + declared configuration should produce
equivalent proposals. Inject time, IDs, and dependencies rather than hiding them.

Network-primary is a declared precedence policy, not automatic authority for
anything matching JSON. A stale network response may be older than a DOM
observation. Do not freeze DSL punctuation, package decomposition, signal
implementation, Rust usage, or reducer language in this wave.

## 9. Agent-facing capabilities independent of transport

Expose discovery of schemas/parsers/indexes/retention; revision-bound MIME reads;
index creation and membership edits; consistent enumeration/query; observation
and supported resume; declaration validation; parser fixtures; isolated replay;
and inspection of evidence, conflicts, and lag.

Separate grants for content reads, raw evidence, index creation, membership
changes, parser execution, capture activation, export, and purge. Conversation
content itself never authorizes operations.

### ACP

**Verified fact:** ACP v1 supports content/resource blocks, capability-negotiated
client filesystem methods, and extensions. It does not define this content store
or index API. Inspected archived revision:
`b48be59c5c4697ba3becfb6afa91372a85ca9f00`.

- [Content](https://github.com/agentclientprotocol/agent-client-protocol/blob/b48be59c5c4697ba3becfb6afa91372a85ca9f00/docs/protocol/v1/content.mdx):
  resources can be supplied as context.
- [File System](https://github.com/agentclientprotocol/agent-client-protocol/blob/b48be59c5c4697ba3becfb6afa91372a85ca9f00/docs/protocol/v1/file-system.mdx):
  client text-file operations require negotiated support.
- [Extensibility](https://github.com/agentclientprotocol/agent-client-protocol/blob/b48be59c5c4697ba3becfb6afa91372a85ca9f00/docs/protocol/v1/extensibility.mdx):
  custom methods begin with `_`; custom capabilities use `_meta`.

**Design consequence:** an ACP authoring session can receive revision-bound
resources and invoke a negotiated adapter or separately supplied tools. Mentioning
a URI does not grant dereference access. ACP session updates are not the store's
change log.

### A2A

**Verified fact:** the inspected [A2A specification](https://github.com/a2aproject/A2A/blob/main/docs/specification.md)
defines tasks, messages, artifacts, task listing, and subscriptions. “Subscribe to
Task” starts with current task state, avoiding a get-then-subscribe gap. Its
archive revision was not pinned during this research; the link is navigational,
not an immutable evidence coordinate.

**Design consequence:** A2A can later wrap “build this index” or “replay this
capture set.” Task/artifact updates do not automatically define reusable index
changes; task history is not a substitute for the archive.

## 10. Falsification and adversarial verification

These are proposed tests, not executed results. Use synthetic fixtures and
Playwright/MSW; no personal live account is required.

1. Virtualized messages disappear: no source deletion inferred.
2. Old response follows new data: no blind overwrite.
3. Two tabs observe one stream: deduplication/retry does not duplicate content.
4. Restart between body storage and index publication: no acknowledged partial
   commit publishes a missing body.
5. Change during snapshot handoff: delivered once or detectably more than once,
   never zero times.
6. Expired resume cursor: explicit reset, not silent continuation.
7. Stalled consumer: bounded buffering and explicit overflow behavior.
8. Account changes at the same URL: no cross-account merge or leak.
9. Replacement/correction chunks: no append-only corruption.
10. New parser interpretation: isolated replay retains previous provenance.
11. Historical missing timing/usage: no fabricated durations or usage metrics.
12. Forged microdata/instructions in conversation: untrusted content, no execution.
13. Privacy purge followed by delayed retry: obsolete authorization/generation
    cannot resurrect content.
14. MIME variants at one logical resource: exact revisions stay unambiguous and
    Cache matching cannot accidentally return another representation.
15. Filtered list or failed pagination: partial coverage, existing members retained.

## 11. Decisions intentionally open

1. Raw capture retention versus privacy and storage.
2. Minimum first-adapter durability/replay guarantees.
3. Declarative selection versus executable projection for derived indexes.
4. Evidence sufficient to reconstruct an inference operation.
5. Resolution of richer-but-older versus poorer-but-newer observations.
6. Owned public microdata vocabulary URL and versioning policy.
7. ACP extensions, companion tools, or both for agent access.
8. Actual need for explicit multi-index consistency.

The strongest initial commitment is semantic honesty: content is not execution
telemetry, observation is not occurrence, absence is not deletion, live updates
are not necessarily replayable, and transport does not determine authority.

## Source binding limits

The GenAI and ACP sources above are revision-pinned. HTML, Service Workers, and
Content Index were fetched from their living/editor's drafts on 2026-10-20;
their publication/update dates are recorded, but these URLs remain mutable.
General OTel and A2A documents were inspected in third-party archives without
recording immutable checkout revisions. Their links identify the source and
sections, not exact immutable revisions. No implementation claim depends on a
test run, and no proposed interface is claimed to be a native standard.
