---
type: DesignProposal
title: Pageread — addressable content, shared observation, programmable readers
description: An independent design for ChatGPT reading, microdata and OTel profiles, live queries, reactive content indexes, and extension-authoring interfaces.
resource: /design/tabula-rasa/design0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea512e94affeKEPqju0qHMPIrE"
    title: Independent architectural derivation, requirements reset, primary-source checks, and review-driven contract corrections
  - resource: /design/tabula-rasa/brief0.gpt6a.md
    title: User-grounded capabilities and deliberately reopened decisions
  - resource: "opencode://ses_ea5103182ffeZEKBEjHks2vnSJ"
    title: Independent browser, live-query, signals, WXT, and verification research
  - resource: "opencode://ses_ea50ff0acffevf3FXaD3OV4buy"
    title: Independent semantic content, OTel, storage, index, and agent-interface research
  - resource: /design/tabula-rasa/research0-browser.gpt61s.md
    title: Preserved browser research and alternative observation designs
  - resource: /design/tabula-rasa/research0-content.gpt61s.md
    title: Preserved semantic content research and alternative retained models
  - resource: /design/tabula-rasa/review1-browser.gpt61s.md
    title: Review identifying per-stream decoder ownership, query disposal, and synchronous snapshot gaps
  - resource: /design/tabula-rasa/review1-content.gpt61s.md
    title: Review identifying missing write tokens, batch references, replay algebra, following policy, and restart guarantees
  - resource: "https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute"
    title: Microdata property-name restrictions, ordered repeated values, and extraction rules
  - resource: "https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute"
    title: Hidden-until-found reveal algorithm and beforematch
  - resource: "https://github.com/open-telemetry/semantic-conventions-genai/blob/547934afa90a34298441caf80c43b27255c3a292/docs/gen-ai/client-inference.md"
    title: Development-status inference conventions and meanings of conversation, message, model, and usage attributes
---

# Pageread — addressable content, shared observation, programmable readers

## 1. Recommendation and standing

**Build a reader toolkit around addressable content and shared observation.**
A ChatGPT extension is its first reader. A reader describes its sources, interprets
their evidence, and publishes typed content into any number of named indexes.
Every maintained view can be walked now and followed as it changes. Microdata
provides a web-facing semantic encoding; OTel supplies applicable vocabulary and
real trace/event interoperability.

The important boundary is between **what was observed, what it means, and how a
consumer accesses it**. It lets the same reader operate in an extension or a
Playwright-controlled browser, and lets a storage host change without redesigning
the reader's meaning.

This is my proposed design, derived from the [fresh ask](./brief0.gpt6a.md), not
an account of the existing code. The scout inspected that code; I did not.
Two independent Sol-medium researchers used primary sources without reading
the repository or each other's output. Their reports are linked in
[research and alternatives](#research-and-alternatives). Earlier assistant
framing was present in inherited conversation; it is explicitly reconsidered.

All interfaces below are **semantic sketches**, not declarations of implemented
APIs. The recommendation is concrete enough to test, while package boundaries,
library selection, and an implementation migration remain separate decisions.

### What I would choose

- A **typed, declarative reader recipe plus packaged executable interpreters**.
- A **shared observation owner per document realm**, federated by a reading
  session; batched rescan-and-diff before incremental selector optimization.
- **Content and relations as the retained model**, with evidence and versioned
  OTel projections. A transcript is not forced into a trace tree.
- **Cache-shaped representation access and ContentIndex-like named collections**,
  augmented with revision, coverage, and snapshot-to-stream contracts.
- A **browser-local durable host first**, with IndexedDB as the reference-backend
  candidate because it can commit content, memberships, and change records
  together. That is my proposed implementation choice, not a user requirement.
- **WXT owns extension packaging**; Vite+ integration is a compatibility trial.
  Playwright is another observation/test host. Signal ecosystems are adapters.

## 2. Reopening premature commitments

The [bias audit](./bias-audit0.glm53fx.md) identifies excluded material. There was
no existing design-document corpus to rewrite. The new brief removes architectural
prescriptions from the commission rather than treating a scaffold as its spec.

| Earlier framing to reopen | Better question | Proposed answer here |
| --- | --- | --- |
| Build a new signals core | What must multiple subscribers share, and what does a late subscriber see? | Share observations and view evaluation; bridge existing signal graphs. |
| One global observer | What can actually share observation across roots, frames, and execution worlds? | Realm-local pooling, explicit root coverage, session-level federation. |
| A session becomes a trace | What evidence establishes an operation and its timing? | Keep a conversation graph; import real traces and derive only qualified telemetry. |
| Content Index is the find/store backend | Which browser affordance was intended? | Separate beforematch, content storage, discovery, and text search. |
| Network primary means a particular hook | Which capabilities does this host supply? | Capability negotiation and source-specific coverage; portable DOM fallback. |
| Rust crate skeletons now | Which host obligation requires Rust? | Name possible responsibilities; defer Rust until a host requires it. |
| Package names decide interfaces | What does an author or consumer need to call? | Stabilize the surfaces below before distributing them into packages. |

The user did choose the Cache-shaped and ContentIndex-like surfaces, network
preference, shared routing, multiple indexes, a DSL, and MSW. Reopening their
implementation is not reopening those capabilities.

## 3. Vocabulary and public surfaces

| Term | Meaning in this proposal |
| --- | --- |
| **Resource** | An addressable subject: project, conversation, message, content part, capture, or telemetry record. |
| **Representation** | Particular bytes and a MIME type describing a resource, at an immutable local revision. |
| **Observation** | A source-scoped account of something seen, with observation time, source location/version if known, and coverage. |
| **Semantic item** | A typed resource description using a versioned vocabulary; encodable as microdata. |
| **Index** | An independently named collection of entries pointing at resources/representations, with its own definition and progress. |
| **View** | A current query result with a revision and a subscription contract; it can be transient or durable. |
| **Feed** | A sequence of events; unlike a state view, intermediate events may matter individually. |
| **Reader recipe** | Inspectable orchestration of sources, interpreters, semantic profiles, publications, and verification cases. |
| **Reading session** | Ownership of a particular attachment to pages/sources, their capabilities, and cleanup. It is not a ChatGPT conversation. |

| Surface | Caller | Promise |
| --- | --- | --- |
| `attach` / `walk` / `live` | Reader or interactive author | Observe supported sources; enumerate now or join maintained views. |
| `interpret` / `preview` | Reader runtime or authoring agent | Convert selected evidence into inspectable proposals without hidden persistence. |
| `content` | Reader, UI, indexer, agent | Put and read MIME-bearing representations and exact revisions. |
| `indexes` | Reader, UI, indexer, agent | Create/open/list independent indexes; enumerate or follow membership. |
| `publish` | Reader runtime | Commit an accepted interpretation and related index changes coherently. |
| `watch` / `events` | Any consumer | Receive state transitions or events with explicit continuity guarantees. |
| `search` / `reveal` | Person or agent | Find retained content and navigate to an owned rendering or source anchor. |
| `validate` / `explain` / `fixture` / `build` | Extension author or agent | Understand, test, and package a reader. |

These are capabilities, not nine required packages or services.

## 4. The retained model: resources, representations, evidence

### Identity and content

Use native provider identities when available, scoped to the provider and the
account/workspace being observed. Keep source identity separate from a local
resource address. A local provisional identity is allowed when the page gives
none; mark it provisional and record later alias resolution explicitly.

An entity's identity does not change when its title or content changes. A
representation revision does. A message can have semantic JSON, Markdown, plain
text, and attachment representations without becoming four different messages.

```ts
type URI = string;
type Revision<Kind extends string> = string & { readonly revisionKind: Kind };
type ContentRevision = Revision<"representation">;
type MembershipRevision = Revision<"membership">;
type ViewRevision = Revision<"view">;
type PublicationId = string;
type Cursor = string; // opaque token scoped to a stream identity and generation

interface ContentKey {
  resource: URI;
  representation: string; // explicit variant, e.g. "semantic" or "markdown"
}

interface ContentRef extends ContentKey {
  revision: ContentRevision;
  mediaType: string | null; // null means not established
}

interface SemanticItem {
  id: URI;
  types: URI[];
  profile: URI; // vocabulary and interpretation version
  properties: Record<string, SemanticValue[]>;
}

type SemanticValue =
  | { kind: "literal"; value: string; datatype?: URI }
  | { kind: "reference"; resource: URI }
  | { kind: "item"; value: SemanticItem };
```

`properties` uses profile-defined names or absolute property URLs. The semantic
profile supplies conversions for numeric, boolean, and temporal literals; retain
the observed lexical value when conversion fails. Ordered repeated values stay
ordered. References are resolved by the vocabulary, not inferred from every
string that happens to look like a URL.

Use ordinary MIME types such as `application/json`, `text/markdown`, `text/plain`,
`text/html`, and actual attachment media types. Put schema/profile identity in
representation metadata or its document, rather than inventing an allegedly
standard OTel MIME type. HTML exports need a rendering policy; stored HTML is
not automatically safe to execute in an owned reader.

### Evidence without mandatory event sourcing

An observation carries an ID, source/epoch, observed time, optional source time
and version, capture reference if retained, and interpreter ID/version. A
proposal points back to observations supporting its changed properties and
relations. Raw response bodies are optional retained representations, not a
prerequisite for every write. Report whether parser replay remains possible.

Keeping current state plus bounded change history and evidence is enough for
the first host. An eternal ledger, CRDT, or general graph database is not needed
to honor these interfaces.

### Source reconciliation

The interpreter proposes updates; a named, versioned merge policy chooses the
materialization. It can compare source versions and evidence scope rather than
just arrival times. Network evidence is normally richer, but a late old response
does not outrank a later observed edit merely because it came from the network.

- Missing property: no claim. Explicit empty value: a claim about emptiness.
- Omitted list member: no deletion claim. Explicit source deletion: evidence.
- DOM node removed: withdraw its current page anchor, retain captured content.
- New selected branch: update selection, retain other known branches.
- Unresolved conflict: retain competing observations and surface the conflict;
  do not manufacture a winning timestamp.

A site-specific reducer must define replacement versus patch behavior, identity
matching, source-version comparison, and stale-observation handling. The toolkit
can reject a publication on revision conflict; it cannot universally decide
which private-site observation is true.

## 5. Microdata and OTel: one explicit mapping

### Microdata is a real encoding contract

The HTML specification forbids dots and colons in defined short property names.
`itemprop="gen_ai.request.model"` is therefore not a conforming vocabulary design.
Use dot-free vocabulary terms mapped to OTel attributes, or absolute property
URLs owned by this project. I prefer short readable terms with an explicit
mapping table.

The URL below is **illustrative**, not a deployed namespace:

```html
<article itemscope
         itemtype="https://example.invalid/pageread/v1/Message"
         itemid="https://example.invalid/content/messages/m42">
  <meta itemprop="role" content="assistant">
  <div itemprop="text">An observed answer.</div>
  <a itemprop="conversation"
     href="https://example.invalid/content/conversations/c7">Conversation</a>
</article>
```

Publish vocabulary definitions before freezing these URLs. The vocabulary has
content types such as Project, Conversation, Message, and Part, and telemetry
types such as Span and Event. Their distinct type contracts matter more than
their final spelling. A profile records exactly which semconv revision it maps.

Parsing must respect `itemscope`, nested items, repeated properties, `itemref`,
and element-specific value extraction. A descendant `[itemprop]` walk alone is
incorrect. The default generic microdata reader and a site-specific ChatGPT
reader can both emit the same semantic items. Site-specific extraction may use
a sidecar item graph; it need not modify ChatGPT's DOM to make the schema usable.

Do not interpret microdata found inside quoted message text as authoritative
application metadata. The recipe declares the extraction roots and profile;
page content does not select executable interpreters.

### Apply OTel meanings, not just field names

Current GenAI conventions are developmental and were researched at revision
`547934afa90a34298441caf80c43b27255c3a292`. Version the mapping independently from
both the reader and stored content.

| Profile term / source fact | Possible OTel mapping | Condition |
| --- | --- | --- |
| Native conversation identifier | `gen_ai.conversation.id` | Source supplies it; a local fallback ID is not substituted. |
| Known request model | `gen_ai.request.model` | An observed request establishes it. |
| Known response model | `gen_ai.response.model` | Response evidence establishes it; a UI label is insufficient. |
| Actual model input message sequence | `gen_ai.input.messages` | The sequence sent to the model is known; not merely all displayed messages. |
| Actual generation outputs/choices | `gen_ai.output.messages` | The source establishes which operation produced them. |
| Reported token counts | Applicable `gen_ai.usage.*` fields | Preserve totals/subsets and source meaning; estimates remain separate. |
| Observation time | OTel log `ObservedTimestamp` | Time pageread observed evidence. |
| Known occurrence time | OTel log `Timestamp` | Source occurrence time is available. |

There are three telemetry paths:

1. **Imported telemetry:** parse actual spans/events present in selected page or
   network content; preserve their valid IDs, relationships, and timing.
2. **Qualified projection:** when evidence establishes an operation and its
   boundaries, project a GenAI operation. Mark locally reconstructed telemetry
   with pageread-owned provenance attributes. Missing operation facts mean a
   content/observation record, not a fabricated inference span.
3. **Runtime instrumentation:** real spans/events for capture, parsing, storage,
   and indexing. These describe pageread's work, including failures and lag.

A conversation graph can branch, have unresolved ancestors, and relate to
projects. A trace span has at most one causal parent. Message ancestry is not
span parentage; repeated imports are not repeated inference usage. A complete
historical transcript can remain useful without any recoverable inference span.

For exported observation events, use explicit application-owned names such as
`pageread.content.observed`. OTel GenAI external-content-reference encoding and
streaming-chunk conventions are not established by the reviewed specification;
our references/chunk events must be labeled custom. Keep content export into
telemetry an explicit output choice, separate from storing a transcript locally.

The profile's callable surface is `decodeMicrodata`, `encodeMicrodata`, and
`projectTelemetry(items, evidence)`. The last operation returns validated telemetry
records **and reasons for omitted projections**, such as unavailable operation
boundaries. An OTel codec consumes/emits the selected standard record format;
the semantic profile owns only the adaptation and its custom provenance fields.
Actual embedded telemetry can enter through an interpreter without first being
reconstructed from conversation content.

## 6. Shared observation and live queries

### Host and source capabilities

```ts
interface ObservationHost {
  attach(target: Target, options: { signal?: AbortSignal }): Promise<Reading>;
}

interface Reading {
  capabilities(): CaptureCapabilities;
  walk(query: EntityQuery): Promise<ObservedSnapshot>;
  live(query: EntityQuery, options?: { signal?: AbortSignal }): LiveQuery<ObservedEntity[]>;
  events(source: SourceSelection, options?: FeedOptions): EventFeed<Observation>;
  refresh(query: EntityQuery): Promise<ObservedSnapshot>;
  close(): Promise<void>;
}
```

Capabilities describe DOM access, available roots/frames, response bodies,
streaming bodies, early instrumentation, and supported replay. Coverage reports
late attachment, inaccessible roots, interrupted bodies, and other gaps.

The extension can supply page instrumentation plus isolated-world DOM reading.
The Playwright host can supply its observation facilities. Select the strongest
available evidence through the same recipe, without pretending those hosts have
identical privileges or capture completeness.

Chrome `webRequest` does not generally expose response bodies. Wrapping `fetch`
in an isolated content script does not wrap the page's fetch. Early main-world
instrumentation is a plausible adapter, but misses earlier calls, saved function
references, and uninstrumented worker/frame traffic. Neither debugger attachment
nor an external Playwright process is required for ordinary extension use.

Response-body capture needs a byte/time budget and interruption outcome.
`Response.clone()` is not a bounded tee. Streaming parsers must handle arbitrary
chunk boundaries, replacement patches, cancellation, and completion evidence;
neither DOM mutations nor network chunks are assumed to be tokens.

Use tagged source frames so concurrent responses cannot share a decoder by
accident. This is the proposed capture input, not a choice of interception API:

```ts
interface StreamIdentity {
  source: string; // recipe source
  epoch: string; // attachment incarnation
  stream: string; // one request/response incarnation, never reused in this epoch
}

type CaptureFrame = { stream: StreamIdentity; sequence: number } & (
  | { kind: "start"; metadata: CaptureMetadata }
  | { kind: "chunk"; bytes: Uint8Array }
  | { kind: "terminal"; outcome: "eof" | "cancelled" | "truncated" | "error" }
);
```

Frames are serialized per stream; different streams may interleave. Chunk bytes
are immutable to consumers. Sequence gaps invalidate decoder continuity. Exactly
one terminal outcome ends a locally observed stream; no later chunk is accepted.
A lost host cannot deliver a terminal frame: recovery reports interrupted coverage
instead of inventing EOF. Transport EOF does not by itself establish successful
model generation. Cancelling one stream leaves the other decoders running.
Capture cancellation abandons the observation branch, not the application's
request. If a host cannot bound capture without blocking the page, it abandons
capture and reports the gap rather than changing the site's transport behavior.

### Ownership, roots, and evaluation

Each realm has a shared router that owns compatible source observations and
leases them to queries. A reading session federates these routers. One observer
can watch several roots; the contract requires sharing, not a particular count
of observer objects. Releasing one consumer never disconnects another consumer's
lease. Final release drops listeners, observers, and retained node references.

`live()` acquires a query-owner lease immediately and returns an explicitly
disposable `LiveQuery`. Its `read()` is useful without a subscription. Each
subscription can be cancelled independently; the query-owner lease remains until
`dispose()`, its AbortSignal, or `Reading.close()`. Compatible handles share work
but have separate ownership. Disposal closes only that handle and its listeners;
a final closed snapshot may be delivered before disposal completes, and no callback
starts after it returns. Subsequent `read()` returns the last value marked closed;
new subscriptions on a closed handle fail. Read-only callers can use `walk()`
instead when they do not want a live lease.

`EntityQuery` declares:

- root set, CSS selector, traversal policy, and per-root ordering;
- extractor identity/version, including its field dependencies;
- invalidation sources: mutations, declared DOM events, explicit refresh;
- identity extraction and handling of an element reused for another entity.

The DOM extractor is synchronous and side-effect-free: it copies selected DOM
values into immutable observation input during the scan. It cannot await and
then read a changed element. Asynchronous interpretation consumes those copied
values later and carries their observation revision; it does not retain mutable
DOM handles as its semantic input.

Keep **membership** and **projection** separate: text edits can change an entity
without changing which elements match. Reuse membership evaluation where safe;
different projections need not become identical queries.

Start with batched invalidation followed by rescan-and-diff. This handles ancestor
class changes, `:has()`, sibling position, reordering, and content edits more
reliably than treating MutationRecords as semantic edits. Optimize only verified
selector subsets. Dependency roots must include relevant ancestors outside a
local query root.

MutationObserver cannot guarantee all CSS state changes. A declared live-query
profile either supports relevant events, requires refresh, or rejects the live
guarantee for selectors such as `:hover` or property-driven `:checked`. Do not
silently promise arbitrary-selector reactivity.

Native DOM queries do not cross frames or shadow roots. Declare open-shadow
discovery and slot handling; report closed roots as unavailable. Frame navigation
starts a new document epoch. Aggregation across realms has per-root boundaries,
not one fictional atomic DOM revision.

### Joining now to next

Register observation before the initial synchronous scan. Finish that scan
without yielding, establish a revision, then process invalidations through the
same serial publication path. Treat queued mutations as reasons to rescan, not
as patches to reapply to a snapshot that may already include them.

Published DOM snapshots contain immutable extracted values. Element handles are
optional ephemeral anchors, never an immutable representation of past text.
`read()` returns the latest committed view; `refresh()` requests a fresh scan.
It does not promise to see a synchronous mutation before the observer flush.

## 7. State views and event feeds

Use a small framework-independent view boundary:

```ts
interface ReadableView<T> {
  read(): ViewSnapshot<T>;
  subscribe(
    receive: (snapshot: ViewSnapshot<T>) => void,
    options?: { signal?: AbortSignal },
  ): () => void;
}

interface LiveQuery<T> extends ReadableView<T> {
  dispose(): void;
}

interface ViewSnapshot<T> {
  value: T;
  revision: ViewRevision;
  coverage: Coverage;
  status: "ready" | "refreshing" | "degraded" | "closed";
}
```

Subscription installs the consumer and chooses its initial snapshot as one
serialized operation; that snapshot is the first notification. Later callbacks
are ordered. Consumers must not compose a separate `read(); await; subscribe()`
sequence to obtain continuity. Subscriber errors are isolated from other leases.

Provide Preact, Solid, and eventually TC39-compatible adapters. A signal adapter
materializes the latest state and may coalesce intermediate values. It does not
promise to preserve every event or join another framework's dependency graph.
Disposal of the bridge releases its subscription.

Durable or remote collections additionally expose a streaming handoff protocol:

```ts
type Change<T, Key> =
  | { kind: "upsert"; key: Key; value: T } // complete replacement, not a patch
  | { kind: "delete"; key: Key };

type WatchFrame<T, Key = string> =
  | { kind: "snapshot-begin"; snapshot: string; at: Cursor; coverage: Coverage }
  | { kind: "snapshot-page"; snapshot: string; entries: { key: Key; value: T }[] }
  | { kind: "ready"; at: Cursor }
  | { kind: "change"; base: Cursor; cursor: Cursor; publication: PublicationId;
      changes: Change<T, Key>[] }
  | { kind: "reset-required"; reason: string }
  | { kind: "closed"; reason: string };
```

A cursor is opaque and scoped to a view/index identity, definition, and epoch.
All snapshot pages describe one boundary; changes after that boundary arrive
after `ready`. Resume from `after` yields later changes when retained, otherwise
`reset-required`. At-least-once delivery is sufficient when changes have stable
IDs/cursors. Consumers can detect and skip redelivery.

A snapshot replaces the consumer's prior state, assembling pages privately until
`ready`. A change frame is one atomic view transition; apply all keyed changes
and then advance to its cursor. Repeated cursor means the same immutable frame:
skip an already-applied cursor, otherwise require `base` to equal the current
cursor. An unrecognized mismatch requires reset rather than guessing order from
opaque strings. State changes carry full values, including membership revisions
and ordering fields; sorting follows the index definition with a deterministic
identity tie-breaker. A content key is the resource/representation tuple; an
index key is its entry ID.

A resume request starts with retained changes after its supplied boundary, not
a new unannounced snapshot. Snapshot-pagination expiry returns `reset-required`;
it never silently switches later pages to the latest head. This log reconstructs
published state, not unrecorded source traffic or every intermediate DOM state.

For transient DOM state, an epoch change or overflow can demand a new snapshot.
For durable changes, retention and replay floor are advertised. Buffers are
bounded: an implementation must backpressure or report a gap/reset, never silently
drop events while advertising uninterrupted delivery. A reset invalidates the
current incremental view until it is resubscribed and rebuilt.

An **event feed** has `subscribe`/async iteration, event identity, epoch/sequence,
optional resume, cancellation, and explicit overflow. It has no synthetic
"current event" snapshot. State views and feeds share lifecycle vocabulary,
but are not interchangeable. Content backends can emit post-commit feeds;
readers can also send transient observations directly to an event output.

## 8. Content storage and named indexes

### Cache-shaped content access

```ts
interface WriteCondition<R> {
  operationId: string; // idempotent retry of the same operation
  expectedRevision: R | null; // null means create-only
}

type UpdateCondition<R> = WriteCondition<R> & { expectedRevision: R };

interface ContentStore {
  put(key: ContentKey, response: Response, write: WriteCondition<ContentRevision>): Promise<ContentRef>;
  match(key: ContentKey | ContentRef): Promise<StoredRepresentation | UnavailableRepresentation | undefined>;
  matchAll(query: ContentQuery): Promise<Page<StoredRepresentation | UnavailableRepresentation>>;
  keys(query?: ContentQuery): Promise<Page<ContentRef>>;
  delete(key: ContentKey, write: UpdateCondition<ContentRevision>): Promise<CommitReceipt>;
  watch(options?: WatchOptions): AsyncIterable<WatchFrame<ContentRef, ContentKey>>;
}
```

This is inspired by Cache methods, not a browser `Cache` polyfill. Important
departures are explicit representation keys, immutable revision reads, conditional
writes, namespaces, and changes. `StoredRepresentation` includes the resolved
reference and an independently consumable `Response` for that caller.
`UnavailableRepresentation` identifies a known reference whose body is unavailable;
`undefined` means no known matching key/revision. Enumeration reports unavailable
entries explicitly as well, rather than dropping them from a claimed complete view.

- `match(key)` selects the current head; `match(ref)` selects exactly that revision.
  A missing/evicted exact revision is reported, never replaced with newer bytes.
- Response metadata preserves MIME; unknown type is explicit. A store revision,
  body digest, source ETag, and source timestamp are separate values.
- Logical IDs may use application URIs. A native Cache adapter must map them to
  valid physical HTTP(S) keys. Fragments cannot distinguish physical Cache keys;
  native matching ignores them.
- `put` commits a finite body. A live source produces bounded captures or successive
  representations rather than an indefinitely pending durable response.
- Reads and keys are account/namespace-scoped. Identical source URLs after an
  account switch do not identify the same retained content automatically.

Deleting a head, removing an index membership, recording source deletion, and
purging retained revisions are different operations. No automatic pruning is
implied. Explicit purge needs its own semantics, including delayed-write handling,
when that capability is introduced.

### ContentIndex-like collections

```ts
interface IndexRegistry {
  create(id: string, definition: IndexDefinition): Promise<Index>;
  open(id: string): Promise<Index>;
  list(): Promise<IndexDescription[]>;
}

interface Index {
  describe(): Promise<IndexDescription>;
  add(entry: IndexEntryDraft, write: WriteCondition<MembershipRevision>): Promise<CommitReceipt>;
  delete(entryId: string, write: UpdateCondition<MembershipRevision>): Promise<CommitReceipt>;
  getAll(page?: SnapshotPageRequest): Promise<SnapshotPage<VersionedEntry>>;
  watch(options?: WatchOptions): AsyncIterable<WatchFrame<VersionedEntry>>;
  progress(): Promise<ProjectionProgress>;
  waitFor(publication: PublicationId, options?: { signal?: AbortSignal }): Promise<ProjectionWait>;
}

type ContentSelection =
  | { kind: "metadata-only" }
  | { kind: "pin"; ref: ContentRef }
  | { kind: "follow"; key: ContentKey };

interface IndexEntryDraft {
  id: string; // local membership identity within this index
  resource: URI;
  content: ContentSelection;
  title?: string;
  description?: string;
  launchUrl?: string;
  orderKey?: string; // ordered only within this definition's ordering scheme
}

interface VersionedEntry {
  entry: IndexEntryDraft;
  revision: MembershipRevision;
  resolvedContent?: ContentRef; // exact ref selected at this entry revision
  contentState: "metadata-only" | "available" | "unavailable";
}
```

This retains the useful `add/delete/getAll` discovery shape while adding multiple
indexes, revisioning, and subscription. Browser Content Index registration is
an optional output adapter for an owned offline reader; it is not the database.

An index definition declares its owner, accepted entry profile, membership mode,
ordering, and optional projector. Two modes are sufficient:

- **Managed:** callers explicitly add/remove entries. Useful for an agent's
  research set or a user-maintained selection.
- **Derived:** a versioned projector maintains entries from declared inputs.
  Public mutation is through that projector; expose its applied input boundaries.

Index creation is idempotent only for the same definition; a conflicting existing
definition is an error. Changing a projector definition creates a new generation
and invalidates old cursors deliberately. A derived index's definition names its
inputs, and cyclic projection dependencies are rejected in the initial design.

Every read, upsert change, and write receipt exposes the membership revision.
It is not the referenced content's revision or an index-wide cursor. Create-only
requires no current member; updates/deletes require the current membership token.
Delete/recreate never reuses the old token, so an intervening recreation cannot
make a stale conditional write succeed. The same rule applies to content heads.

The content selection has observable consequences:

- **Metadata-only:** no implicit body resolution or subscription.
- **Pin:** retain an exact representation reference; future content edits do not
  advance it. Availability changes may emit an upsert without changing the pin;
  a body becoming unavailable is not reported as empty text.
- **Follow:** select a specific resource/representation head. The index maintains
  a resolved pin and emits an upsert/new membership revision when it advances.
  This dependency is a built-in projection with reported progress, even when
  membership itself is managed. A missing head has unavailable state.

A resource URI by itself does not select a representation. A transcript can follow
semantic message representations that reference their Markdown/body revisions;
a research index can pin the same messages. A branch-selection change affects
only indexes whose definitions depend on that selection.

Possible indexes include account transcripts, account projects, a project's
conversations, a conversation's messages, an individual message's parts, a chosen
branch, and an agent's scratch selection. Overlapping membership is ordinary.
Index naming does not imply a fixed hierarchy or a separate physical database.

`getAll` is paginated at a pinned boundary. `watch` handles the initial snapshot
and the transition to changes. Describe coverage separately from freshness:
"all known transcripts, current through commit X" does not mean "entire account
enumerated." Entry metadata can exist before a transcript body has been captured.

### Publication and persistence

Semantic items live in ordinary versioned `application/json` representations,
read through `content.match`, not an unmentioned second entity database. Their
document can include the item and its related representation references. Use one
publication call for content and memberships that must become visible together:

```ts
type BatchRef = { existing: ContentRef } | { pending: string }; // batch-local handle

interface Publication {
  operationId: string;
  puts: {
    handle: string;
    key: ContentKey;
    expectedRevision: ContentRevision | null;
    body: { kind: "response"; response: Response }
      | { kind: "semantic"; item: SemanticItem; representations: BatchRef[] };
  }[];
  memberships: MembershipCommand[];
  deletions: ContentDeleteCommand[];
}

interface PublicationHost {
  publish(batch: Publication): Promise<CommitReceipt>;
}

interface CommitReceipt {
  publication: PublicationId;
  content: Record<string, ContentRef>; // resolves each put handle
  memberships: { index: string; entryId: string; revision: MembershipRevision }[];
  boundaries: { view: string; cursor: Cursor }[];
}
```

`MembershipCommand` is a managed-index add/update/delete with its scoped membership
precondition. For add/update, a pin may use `BatchRef` instead of `ContentRef`.
`ContentDeleteCommand` names a content key and its non-null expected revision.
Batch handles are unique; missing handles or conflicting commands for one target
are errors. The host allocates refs, resolves pending pins and typed semantic
representation links, consumes finite bodies, and validates all preconditions.
Ordinary resource relations use resource URIs and need no revision reservation.

The reference host commits the batch, resolved receipt, and change records in
one transaction, or exposes none of them. Response bodies are staged before that
transaction; staging is not publication. Standalone store/index writes are
single-target publications. Events identifying successful persistence follow
commit. An idempotent retry checks the stored operation outcome before current
preconditions and returns the original receipt; reuse with different input fails.

Derived indexes may update later. They report source boundaries applied, failures,
and stale state. Cross-index cursors are incomparable; asking for aligned views
requires an explicit common publication boundary, not comparing cursor strings.
The initial caller can wait for named projections to apply a commit rather than
requiring a distributed transaction across all indexes.

```ts
interface ProjectionProgress {
  state: "current" | "catching-up" | "failed" | "reset-required";
  inputs: { id: string; generation: string; through: Cursor }[];
  failure?: Diagnostic;
}

interface ProjectionWait {
  outcome: "applied" | "not-applicable" | "failed" | "reset-required";
  progress: ProjectionProgress;
}
```

`progress()` reports an applied boundary for each input identity/generation and
any failure detail. A managed index without following dependencies has no inputs.
`waitFor(publication)` reports `applied` only when that publication's relevant
effects have been applied through the dependency graph; unrelated publications are
reported as not applicable. Failure, expired input history, and cancellation
are explicit outcomes, not endless success-looking waits; cancellation rejects
with the abort reason rather than reporting applied progress.

A projector commits its output and input progress together, or uses a recoverable
idempotent application protocol with equivalent behavior. Restart never advances
progress beyond committed outputs. If needed input changes are no longer retained,
rebuild from a new snapshot/generation or report reset. Stateful parser replay
additionally needs its source prefix or a decoder checkpoint; a final body alone
does not establish that intermediate source-event replay is possible.

A backend unable to atomically publish content and referencing membership must
either implement a recoverable publication protocol or decline that capability.
It must not acknowledge a durable reference before the associated body is durable.
Later deliberate eviction is an explicit unavailable-body condition, not an empty
response. For a metadata-only entry, absent body is simply its declared state.

IndexedDB is an attractive first implementation for this transaction boundary.
A native CacheStorage adapter, file-backed host, or later Rust host is viable if
it meets the same published guarantees. Large-body placement and retention policy
are measured implementation questions, not reasons to change resource identity.

For the reference browser host, acknowledgment means a completed browser-storage
transaction, surviving worker suspension and ordinary browser restart while that
storage remains available. It does not claim OS/power-loss or forced-process-crash
durability. Stronger durability is an advertised backend capability. Receipts and
stream identity/generation metadata are persisted with commits; receipts initially
last for the namespace generation. Old-generation write handles fail after a
namespace reset, rather than treating an old retry as new work. Bounded change
retention has an advertised floor and expired cursors reset; it is distinct from
receipt retention and raw-capture retention. Storage eviction/clearing is an
explicit continuity loss on reconnection, not a successful empty old snapshot.

## 9. The extension-authoring DSL

The DSL should make a reader **explainable before activation and reproducible
against evidence**. Start as typed TypeScript constructors producing a serializable
recipe. Packaged interpreter modules handle the irreducibly procedural parts.

```ts
export default defineReader({
  id: "chatgpt",
  version: "0.1",
  targets: ["https://chatgpt.com/*"],
  profile: profile("conversation-and-telemetry", "1"),
  sources: [
    network({
      id: "conversation-network",
      select: plugin("./sources.ts", "selectConversationTraffic"),
      interpret: plugin("./interpret.ts", "conversationTraffic"),
    }),
    dom({
      id: "visible-entities",
      query: plugin("./sources.ts", "visibleEntityQuery"),
      interpret: plugin("./interpret.ts", "visibleEntity"),
    }),
  ],
  merge: plugin("./reconcile.ts", "conversationEvidence"),
  indexes: [
    derived("transcripts", plugin("./views.ts", "transcripts")),
    derived("projects", plugin("./views.ts", "projects")),
    derivedFamily("messages", plugin("./views.ts", "messagesByConversation")),
    derivedFamily("parts", plugin("./views.ts", "partsByMessage")),
  ],
  outputs: [
    { from: "materializations", to: "local-catalog" },
    { from: "observations", to: "session-events" },
    { from: "telemetry", to: "otel-export", enabled: false },
  ],
  cases: [fixture("history"), fixture("stream-correction"), fixture("dom-only")],
});
```

This example intentionally does not invent current ChatGPT endpoint shapes or
DOM selectors. Those belong to the adapter and its verified fixtures. Simple
selectors and field mappings can be literal recipe data; complex matchers and
protocol decoders are modules. `derivedFamily` is a template for creating named
indexes as resources appear, not permission to prune absent ones.

Output names resolve to host-provided sinks. Routes distinguish transient
observations, accepted materializations, post-commit changes, and telemetry;
a transient delivery is never labeled persisted. Sink descriptions declare
accepted profiles/MIME types, delivery mode, queue limits, and retry support.
`accept(envelope, { signal })` receives a stable event/publication ID and returns
a delivery receipt; cancellation and errors remain local to that output. A
non-replayable sink reports gaps explicitly. The catalog sink uses `publish`,
while event-only readers can omit it. This makes event output an ordinary reader
capability rather than a side effect of installing a database.

### Interpreter boundary

```ts
interface Interpreter {
  describe(): InterpreterDescription;
  interpret(input: Observation, context: InterpretationContext): AsyncIterable<Proposal>;
}
```

Proposals include semantic-item/property observations, representation candidates,
relations, telemetry records, coverage updates, and diagnostics. An interpreter
does not secretly write the store or create observers. The host provides source-
session state, ordered input, cancellation, and declared dependencies. For network
input, each observation wraps a tagged `CaptureFrame`; decoder state is keyed by
its full stream identity, with serial interpretation within that stream. AbortSignal
reaches pending decoder work. Terminal/gap handling releases its state. Shared
conversation reconciliation is a subsequent operation across stream proposals,
not shared byte-decoder state. Independent streams are not ordered by a fabricated
global timestamp. For DOM input, interpretation receives the immutable synchronous
extraction, never an element to reread after an await.
The host rejects late proposals from cancelled work or a retired source epoch;
retained evidence can be reinterpreted later through an explicit replay operation.

Equivalent captured input plus interpreter version/configuration and declared
context should yield equivalent proposals. Inject observation time and ID
allocation. Parser replay means running those inputs again, not recovering an
uncaptured network stream. Replay can produce a preview or new index generation;
it does not silently replace an existing materialization.

### Authoring/build operations

| Operation | Result |
| --- | --- |
| `validate(recipe)` | Schema errors, unavailable capabilities, incompatible profiles, missing modules, index-definition problems. |
| `explain(recipe, host)` | Source subscriptions, observation sharing, module graph, output routes, requested browser capabilities, fallback/coverage behavior. |
| `preview(recipe, captureSet)` | Proposed items, representations, index updates, telemetry, and unresolved conflicts. |
| `fixture(recipe, case)` | Deterministic outcomes and continuity/coverage assertions. |
| `build(recipe, target)` | WXT entrypoints/configuration and packaged modules, with a build receipt identifying inputs. |
| `attach(recipe, host)` | A cancellable reading session exposing coverage and diagnostics. |

This is a DSL of reader construction, not a miniature replacement for JavaScript.
The compiler may generate source matchers and adapter glue, but domain parsing
stays authored code. No executable strings are needed in serializable recipes.

WXT should own extension lifecycle, manifest, entrypoints, and bundles. Its use
of Vite is documented; WXT–Vite+ substitution was not verified by this research.
Try that integration against content scripts, background worker, UI, development
reload, and production builds before making it the only build path.

## 10. Agent access and possible host components

An extension-building session needs the same public operations as a local author:

```text
describe-capabilities, list-profiles, list-interpreters
content.match, content.put, content.keys
publish
indexes.create, indexes.open, indexes.list
index.getAll, index.add, index.delete, index.watch
index.progress, index.waitFor
reader.validate, reader.explain, reader.preview, reader.fixture, reader.build
reader.replay, evidence.inspect
```

Return exact content references, MIME metadata, cursors, coverage, and diagnostics
as data. Large bodies can be readable resources rather than strings embedded in
every tool result. A session-provided resource URI requires a working resolver;
a URI in a prompt alone does not provide access.

ACP can carry resources as context and negotiate an extension or companion tool
adapter. It does not define these store/index operations. If custom ACP methods
are used, follow its underscore-prefixed extension-method convention. A2A can
later wrap build/replay/indexing tasks and artifacts. Its task stream does not
become the persistent content stream by implication.

Do not base content identity on an ACP session ID or A2A task ID. Preserve those
as provenance of an authoring action when useful. The same indexes survive the
session that created them.

### Candidate components, not a mandated workspace

| Responsibility | TypeScript/browser candidate | If a Rust host becomes useful |
| --- | --- | --- |
| Semantic profiles and representation/reference contracts | Shared schema/validation module | `crates/content` |
| Snapshot/change protocol, cursor validation, publication semantics | Host-neutral protocol module | `crates/changes` |
| Durable content, memberships, conditional publication, replay | Browser persistence adapter | `crates/catalog` |
| Process/tool transport, resource serving, host lifecycle | Agent-host adapter | `crates/host` |
| DOM/network observation and WXT compilation | Browser/tooling modules | Usually remain TypeScript; Rust is not needed for browser DOM access. |

These are possible responsibility boundaries, not instructions to create crates
now. A Rust host earns its place through needs such as long-lived local indexing,
large captures, or use outside a browser. If introduced, instrument publication,
conflicts, replay resets, and projector failures with `tracing`; use `tracing-test`
for meaningful operational assertions alongside state/consistency tests.

## 11. Find, search, and an owned reader

The likely remembered hook is **`beforematch` with `hidden="until-found"`**.
The browser finds text already present, fires the reveal event, removes the
hidden state, and reveals it. Fragment navigation can also trigger this process.
It neither supplies a general Ctrl+F query stream nor asks an application backend
to search absent text.

Expose three separate functions:

1. **Search retained content:** `search(index, query, options)` returns hits with
   content revision, matched representation/range, index boundary, and coverage.
   Start with lexical text search; ranking engines are pluggable indexers.
2. **Reveal a hit:** navigate to an owned reader or a still-valid source anchor.
   A removed DOM anchor is not a missing retained message. Text offsets identify
   a particular representation revision; re-resolve after edits.
3. **Participate in native find:** materialize searchable text in an owned
   transcript view; use hidden-until-found for collapsed sections where supported.

I recommend the owned transcript view first, rather than invisibly duplicating
all retained messages into ChatGPT's page. Large archives use application search
to select a transcript, then materialize that transcript for browser find. A
virtual placeholder containing no text cannot make unloaded messages searchable.

The browser Content Index API may advertise this offline reader's URLs and
metadata on supporting platforms. CacheStorage may store its assets. Neither
replaces the content, index, or search contracts above. Direct host-page native-
find participation remains a separately testable extension feature.

## 12. ChatGPT walkthrough

1. **Attach.** Detect the browsing/account scope and negotiate network and DOM
   capabilities. Start a document epoch; report whether early traffic was missed.
2. **Discover.** Recognize observed project/conversation listings, preserving
   pagination and filter coverage. Publish metadata resources and corresponding
   index entries. No unobserved transcript body is asserted to be captured.
3. **Read a conversation.** Interpret observed response content when available;
   walk selected DOM entities for visible material and anchors. Merge with explicit
   source policies. Persist message/part resources and branch relations.
4. **Open multiple views.** An extension panel, an agent, and a signal-driven UI
   follow different indexes or the same live query. Compatible observations and
   query evaluation are shared; consumer cancellation is independent.
5. **Follow generation.** Decode source chunks into message revisions. Distinguish
   an append, a replacement, a completed output, and interrupted observation.
   Update relevant indexes and emit committed changes; optional transient event
   outputs can report source activity without waiting for durable publication.
6. **Switch branch or virtualize.** Change the selected-path view and page anchors;
   keep other captured messages. No implicit deletion occurs.
7. **Inspect traces.** Imported telemetry remains identifiable. A documented
   reconstruction may create a qualified inference operation if evidence supports
   it; otherwise the user still has searchable content and observation events.
8. **Read offline or from an agent.** Resolve exact MIME-bearing content and
   enumerate a pinned collection snapshot. Resume changes or explicitly reset.
   Create a new named index for a research subset without copying message bodies.
9. **Improve the reader.** Replay retained captures through a new interpreter into
   a preview/new generation. Compare interpretations and then select a version.

This walkthrough requires no claim that current ChatGPT private APIs are stable
or that DOM-only reading can enumerate an entire account. A separate explicit
collection job may drive navigation/pagination; it reports progress and coverage.
Background account crawling is not implicit in attaching a reader.

## 13. Verification and landing sequence

### Verification obligations

Use MSW in an owned simulated application. It can exercise historical responses,
streaming patches, project pagination, edits, delayed responses, and failures.
Playwright drives that application's DOM and the packaged extension. Browser MSW
requires its service worker; Playwright routing tests that block service workers
are a separate mode, not a substitute for the MSW test.

| Claim | Scenario that must verify or falsify it |
| --- | --- |
| Gap-free initial subscription | Change an entity while a snapshot is being established and while paginated delivery is in progress; no undetected missing update. |
| Multi-consumer sharing | Create/read live handles with and without subscribers; count shared observations; dispose listeners and owners independently; verify final teardown. |
| Correct live semantics | Ancestor attributes, `:has`, sibling reorder, text-only edit, recycled nodes, event-dependent state, and unsupported selectors. |
| Honest coverage | Late injection, missing response-body capability, shadow root/frame navigation, virtualized list, and failed pagination. |
| Bounded streaming | Interleaved response IDs, split UTF-8/protocol frames, replacement chunks, never-ending body, slow consumer, and cancelling only one decoder. |
| Durable publication | Terminate a worker before/after commit, lose an acknowledgment, restart normally, retry the batch, conflict on stale membership revision, and resume/reset. |
| Independent indexes | One resource in pinned and following indexes; remove one membership; edit a MIME variant; change branch selection; verify exactly which revisions advance. |
| Replay and projection progress | Apply a delete/upsert frame twice; expire a paginated snapshot; restart a two-input projector between output/progress; require identical state or explicit reset. |
| Semantic fidelity | Nested microdata, itemref, repeated values, typed lexical errors, missing model/timing/usage, and misleading quoted markup. |
| Source reconciliation | Old network response after newer edit, duplicate observations from two tabs, account switch at the same URL. |
| Trace honesty | Imported trace preserved; insufficient historical evidence produces no invented inference duration or usage. |
| Agent authoring | Create an index, read exact MIME bytes, preview a recipe, replay a fixture, inspect a conflict, and build through the same host surface. |
| Native find | Real browser reveal of materialized hidden text, fragment-triggered reveal, unsupported/fallback behavior, and absence of unloaded text. |

Synthetic event dispatch is not proof that native Ctrl+F works. Use a real
target-browser interaction check for that affordance, with a manual check where
automation cannot control browser chrome. Test native DOM and Playwright locator
semantics separately, especially shadow traversal.

Reuse the existing Playwright infrastructure by implementing its observation/test
adapter after inspecting it in the implementation phase. That inspection is
deliberately outside this independent design. No current harness compatibility,
live ChatGPT compatibility, or WXT–Vite+ integration has been demonstrated here.

### Coherent implementation slices

1. **Contracts and a replayable specimen.** Define one vocabulary profile, the
   content/index/watch protocols, and a synthetic branched transcript. Prove exact
   revisions, partial coverage, and snapshot handoff in a small reference host.
2. **Shared browser observation.** Add explicit walks and live projections with
   ownership/cleanup; test source capability negotiation and MSW contexts.
3. **Reader DSL and packaging.** Compile a small recipe through WXT and the
   Playwright adapter; keep complex parsing in modules. Trial Vite+ integration.
4. **ChatGPT-specific interpretation.** Establish real selectors/protocol evidence,
   retain reproducible fixtures, implement source reconciliation and branches.
5. **Agent and reader surfaces.** Expose content/index authoring tools, replay,
   lexical search, an offline transcript view, and supported telemetry outputs.

These are dependency relationships, not time estimates. Each slice must preserve
the user-visible contracts before widening capture or storage coverage.

<a id="research-and-alternatives"></a>

## 14. Research, alternatives, and outstanding choices

- [Browser research](./research0-browser.gpt61s.md) establishes the find/API
  distinctions, live-query invalidation and ownership, network capability limits,
  and build/test constraints. Its observation-session emphasis supports the
  transient half of this design.
- [Content research](./research0-content.gpt61s.md) establishes current GenAI
  convention meanings, evidence-qualified content, persistence/replay contracts,
  and protocol boundaries. Its content-first emphasis supports the durable half.
- [Bias audit](./bias-audit0.glm53fx.md) supplies an exclusion map, not an
  implementation precedent. [Fresh ask](./brief0.gpt6a.md) remains the commission
  to use when comparing a genuinely different proposal.

Both researchers independently converge on framework-neutral subscriptions,
explicit snapshot handoff, and content/telemetry separation. The useful tension
is **observation-session-centered** versus **retained-content-centered** design.
I join them at the proposal/publication boundary: a reading session can end while
its content and indexes continue to exist, and event-only reading is useful even
without persistent publication.

| Alternative | When it would be preferable | Why it is not my default |
| --- | --- | --- |
| DOM-only live-reader library | Mainly in-page enhancement with little historical collection | It cannot recover unrendered ChatGPT history or richer network evidence. |
| Playwright/CDP-centered capture application | Always-attached automation and strongest network visibility are the product | It makes an external host central to ordinary extension use. |
| Telemetry-first event ledger | The source reliably exposes real operation telemetry and observability is the principal product | Historical conversation content has different identity, branching, and timing semantics. |
| Native CacheStorage plus native Content Index | A small offline site needs bodies and browser discovery, without independent reactive indexes | The requested transaction, replay, and arbitrary collection semantics need additional machinery. |
| Fully declarative extraction language | Target sites fit a small stable extraction algebra | Protocol decoding and source reconciliation otherwise turn it into an accidental programming language. |

Outstanding choices should be settled by evidence or human preference:

- Owned vocabulary URL and initial profile revision policy.
- Capture retention, body-size limits, and minimum durable replay window.
- Which target browsers and network-capture capabilities the first release supports.
- Whether direct native-find participation on ChatGPT is desirable beyond the
  owned reader.
- Exact agent-tool transport and whether a long-lived external host is useful.
- WXT–Vite+ compatibility and any measured need for a Rust host.

None prevents writing the small, testable contracts above. None should be silently
fixed by a package scaffold before the relevant tradeoff is examined.

## 15. Review disposition

The [browser review](./review1-browser.gpt61s.md) and
[content review](./review1-content.gpt61s.md) independently examined the initial
candidate checkpoint `e16851b7`. Their findings are retained as review evidence;
this revision answers them rather than editing their historical assessments.

| Finding | Decision and correction |
| --- | --- |
| Concurrent response decoders were underspecified | Use tagged per-stream frames, ordered input, terminal outcomes, and stream-scoped state (§6, §9). |
| Live ownership had no complete release path | Acquire an explicit disposable query-owner lease; define listener, handle, and reading teardown (§6–7). |
| Async extraction could break the claimed DOM snapshot | Require synchronous value copying; asynchronous interpretation receives immutable observations (§6, §9). |
| Conditional membership writes lacked readable tokens | Return membership revisions in envelopes/receipts and separate token scopes (§4, §8). |
| Atomic publication had no callable request or pending refs | Add `publish`, batch-local handles, resolved receipts, and ordinary semantic representations (§8, §10). |
| Replay could reconstruct different states | Define full-value keyed upsert/delete, atomic frames, base checks, duplicate handling, and snapshot expiry (§7). |
| Shared content could ambiguously advance indexes | Explicit metadata-only, pin, and follow selections with observable projection progress (§8). |
| Projection checkpoints could lie after restart | Commit outputs and progress coherently; expose per-input progress and `waitFor` failure/reset (§8). |
| Durability and retry lifetime were unbounded claims | State the reference failure model and separate receipt, change, and capture retention (§8, §13). |

The reviews found no material primary-source contradiction in the proposed
browser or semantic mapping. This is documentary review, not runtime verification.
