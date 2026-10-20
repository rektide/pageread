---
type: DesignInquiry
title: Resolve claims, preserve documents, project graphs
description: Round-two design for the trace–metadata hybrid, RDF-compatible persistence, and an end-to-end-first journal sequence.
status: draft
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra#medium"
sources:
  - resource: "opencode://ses_ea50d45c4ffexfv2EsIZ0yNvbT"
    title: Operator rulings and independent round-two resolver, RDF, and sequencing analysis
  - resource: "/home/rektide/src/pageread/design/reactive-indexes/draft0.gpt6am.md"
    title: This session's preceding argument, revised explicitly below
  - resource: "/home/rektide/src/pageread/extension-kit/src/dsl.ts"
  - resource: "/home/rektide/src/pageread/extension-kit/src/capture.ts"
  - resource: "/home/rektide/src/pageread/schema/src/vocab.ts"
  - resource: "/home/rektide/src/pageread/schema/src/item.ts"
  - resource: "/home/rektide/src/pageread/schema/src/microdata.ts"
  - resource: "/home/rektide/src/pageread/store/src/types.ts"
  - resource: "/home/rektide/src/pageread/store/src/idb.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/types.ts"
---

# Resolve claims, preserve documents, project graphs

## Position after the rulings

The hybrid is coherent. Trace documents remain the primary persisted account of message content and telemetry. Thin conversation documents carry application structure. A resolver gives their join a single, inspectable meaning. RDF can then express that meaning without requiring the browser to become a triple-store client overnight.

My revised ordering is **prove capture and persistence, preserve the evidence needed for resolution, then strengthen delivery**. The operator has selected that tradeoff. I still think restart correctness needs a journal eventually; I no longer think its absence should block the first working extension.

This is a design pass against the files listed above, not verification of all reported fixes. In this checkout the DSL exists, but I found no extension-kit resolver/runtime module to inspect. Its `ReaderResult.observation` is currently one envelope for all puts. `vocab.ts` defines the conversation MIME and URN stem, not a complete metadata schema. Interfaces below are proposals rather than claims about implemented APIs. No Oxigraph version/API or RDF specification was fetched for this pass.

## 1. The resolver adjudicates claims, not blobs

“Merge the two JSON documents” is underspecified. A title, a message body, branch membership, and an edit relationship have different sources of authority. The resolver must know **which assertion is being made about which entity**, not merely which document arrived last.

### Roles and ownership

- A reader owns interpretation of a particular capture: entities observed, explicit field assertions, coverage, upstream revision, and source identity. It does not choose global overwrite policy.
- A source policy owns revision comparison and source capabilities. An opaque `observedRevision` is comparable for equality; ordering requires provider-specific knowledge. Lexicographic ordering is not a default.
- The resolver owns reconciliation, provenance, conflict reporting, and selection of current values under a named policy version.
- Trace schema owns message content, roles, timestamps, and telemetry attributes. Metadata schema owns title, branch structure/selection, and edit relationships. The metadata layer can say “message B supersedes A”; B's text remains in the trace representation.
- A user override, if introduced, is its own scoped assertion. It must not silently impersonate an upstream title or edit.

Trace attributes already containing `pageread.title` are legacy/fallback evidence. A valid explicit title assertion from the metadata authority wins according to policy. A missing metadata field does not erase the fallback. An explicit clear is distinct from an absent field. Do not create two equally authoritative writable title locations.

Branch selection is contextual: “the branch currently displayed in tab X” is not necessarily “the canonical branch of this conversation.” Preserve that distinction in the metadata schema before attaching one global selected-branch value.

### A minimal conceptual interface

These types describe the boundary; they need not become a giant public generic framework:

```ts
type RevisionOrder = "before" | "equal" | "after" | "incomparable";
type Assertion<T> = { op: "set"; value: T } | { op: "clear" };

interface ObservationScope {
  conversationUri: string; // includes provider/account identity by convention
  branch?: string;
  domain: "messages" | "title" | "branches" | "edits";
}

interface ObservedDocument {
  document: PutInput;
  envelope: ObservationEnvelope;
  scope: ObservationScope;
  source: { reader: string; version: string; account: string; provider: string };
  observationId: string;
}

interface ConversationMetadata {
  conversationUri: string;
  title?: Assertion<string>;
  branches?: Array<{ id: string; members?: string[] }>;
  edits?: Array<{ originalMessage: string; replacementMessage: string }>;
  // Explicit removal assertions need their own scoped representation.
}

interface ResolutionInput {
  observations: readonly ObservedDocument[];
  policyVersion: string;
}

interface Resolution {
  trace: TraceItem;
  conversation: ConversationMetadata;
  support: Record<string, string[]>; // selected field/entity -> observation ids
  conflicts: Array<{ target: string; candidates: string[]; reason: string }>;
  completeness: Array<{ scope: ObservationScope; coverage: Coverage }>;
  inputRevisions: Array<{ uri: string; revision: string }>;
}

interface ResolverPolicy {
  compareRevision(a: ObservedDocument, b: ObservedDocument): RevisionOrder;
  resolve(input: ResolutionInput): Resolution;
}
```

`revision` above must identify the full relevant entry, not today's body-only etag. The algorithm must be deterministic for the same observations and policy. Arrival time and `storedAt` are evidence about acquisition, not upstream precedence.

Do not demand that the runtime infer per-document scopes from arbitrary URNs. For today's single-envelope `ReaderResult`, require one semantic scope per result or a reader-supplied mapping. A capture returning a complete title and a partial message page cannot truthfully stamp both with one undifferentiated completeness assertion. This is the main DSL pressure I expect real captures to expose.

### Coverage is about a domain, not a quality ranking

The adopted `covers` field means “entities seen.” It does **not** define the closed universe against which absence is meaningful. A list containing M1 and M2 cannot tell us whether M3 was omitted, deleted, on another page, or on another branch.

`complete` therefore needs an agreed scope: all messages in branch B at revision R, all branches in this conversation, or the one title field. Without that scope, interpret absence conservatively even if the reader used the word complete. Do not turn `covers` into an implicit deletion list.

Rules I would encode:

1. **Same observation retried:** idempotent. No duplicate messages, memberships, or edit edges.
2. **Partial/unknown observation:** apply only explicit assertions for covered entities. Never delete omitted entities. This does not make every included assertion newer or authoritative.
3. **Comparable newer assertion:** replace the older value within its scope and authority. A newer partial capture can update M1 while leaving M2 and M3 intact.
4. **Comparable older assertion:** retain as evidence, but do not replace a newer current value. Newly discovered entities may require source-specific reconciliation if a later complete observation established their absence.
5. **Complete replacement:** absence may retract membership only within the exact authoritative scope, with suitable revision precedence. Removing membership from branch B does not delete a shared message used by branch C.
6. **Incomparable conflicting assertions:** retain alternatives and report conflict. A documented source-priority rule may select a provisional display value, but must not claim temporal certainty.
7. **Explicit deletion/clear:** requires authority and precedence just like a set. Completeness alone cannot trump a demonstrably newer assertion.

Example: full branch capture R10 contains M1–M3. A late partial R9 containing only M1 cannot remove M2/M3 or roll M1 back. Partial R11 changes M1; retain M2/M3, but do not describe the assembled branch as a complete capture at R11. It is an R10 baseline with an R11 overlay. A later complete R12 for the same branch may retract M3's membership if absent; its observed content can remain available as historical evidence.

That last distinction matters for RDF too: an absent triple is not automatically a negative assertion.

### Where resolution lives

Use **one resolver implementation and two persistence products**, not bespoke joins in every indexer:

- Preserve observation records binding envelopes, source identity, scope, and exact document revisions. These are replay inputs. Raw captures alone are insufficient unless reader versions and deterministic reprocessing are also retained.
- Produce a resolved trace plus resolved metadata as a derived generation, selected by a small manifest. Consumers load a consistent pair through a resolver facade. Indexers may cache that pair, but do not decide merge precedence themselves.

Keep the resolved trace at the existing canonical trace URI if compatibility requires it; place observation-qualified inputs under a separate proposed observation namespace. The resolver, rather than individual readers, becomes the writer of canonical resolved documents when that stage lands. Alternatively a manifest can point at immutable generation URIs while `match()` on the established canonical URI remains a compatibility route. Choose one publication convention deliberately.

Before the resolver exists, the immediate requirement is smaller: persist the envelope **with its exact input**, not merely in a runtime message that disappears after `put()`. An observation record can embed its puts for the first proof. A later reference-based representation can avoid duplication. A mutable raw URI or a body hash alone is not enough if metadata also affects meaning.

No journal exists yet, so a multi-document write is not atomic. For the proof, either use one aggregate observation record or write immutable generation members first and publish a manifest last; consumers must follow the manifest rather than independently scanning half-published pairs. Missing members are an incomplete result, never a successful empty conversation. This is an application publication convention, not a stealth requirement to implement the full journal now.

## 2. RDF changes the lens, not the need for evidence

I take the operator's “as general as it gets” seriously. Generic MIME bodies are extraordinarily general as **storage**; they are nearly silent about **relationships**. RDF contributes globally named relations, heterogeneous joins, and graph-scoped assertions. Those are precisely the interesting next steps once traces join metadata and observations.

There is no single most-general durable model that eliminates later choices. An opaque byte store preserves every serialization without understanding any. RDF understands a broad relationship algebra but needs explicit encodings for order, duplicate occurrences, nested values, and exact byte representation. The useful choice now is **lossless documents plus an explicit graph interpretation**, not prematurely replacing one with the other.

### URNs already belong here

URNs are URIs and can serve as RDF IRIs. No migration from `urn:pageread:trace:...` to HTTP keys is required. Keep established keys stable. Distinguish three identities:

1. The logical entity: a conversation or message.
2. The stored document describing it, at a particular revision.
3. The graph asserting a set of relationships from that revision.

They may share a naming scheme but should not be conflated. A document URI can identify a named graph by convention; its graph contents are not magically all facts about the document itself. Use stable scoped message identities for graph subjects, and revision-specific graph names for evidence. Existing truncated trace/span IDs are identifiers, not substitutes for provider/account scoping rules.

### A concrete graph shape

For illustration, `pr:` below denotes a proposed pageread-owned vocabulary, not a registered existing ontology:

```text
GRAPH <urn:pageread:observation:example> {
  <urn:pageread:conversation:chatgpt/account/c1> pr:title "A conversation" .
  <urn:pageread:message:chatgpt/account/c1/m1> pr:conversation
    <urn:pageread:conversation:chatgpt/account/c1> .
  <urn:pageread:message:chatgpt/account/c1/m1> pr:text "hello" .
}
```

A separate control graph records the observation's source, capture URI, revision, coverage scope, and mapping version. A resolved graph is another projection, with provenance pointing to supporting observation graphs. Merely putting triples in a named graph does not standardize trust or provenance: pageread supplies that convention.

Represent message order with explicit positions/order relations or RDF lists where appropriate. Repeated events need occurrence identities; an RDF set of triples collapses duplicates. A JSON `null` or clear operation needs explicit representation because omitted triples alone cannot express its intended update semantics. Preserve numeric/timestamp datatypes without routing nanosecond integers through imprecise floating point.

### OTel semconv is usable vocabulary, not an RDF ontology already installed

The existing semconv-inspired itemtype URLs are project choices; appending `trace` to the semconv base does not establish an officially defined RDF class. Attribute names such as `gen_ai.message.role` are useful compact identifiers, but not absolute predicate IRIs. Structural keys such as `spans` and `attributes` also need mappings.

Keep OTel's names as the authoritative schema terms selected by the operator. Publish a versioned JSON-LD context or equivalent explicit mapping into owned predicate IRIs, with documented relationships to upstream semconv names. Do not silently equate similarly named predicates from different vocabularies. The current `itemTypeMatches()` trailing-segment heuristic is useful permissive extraction behavior, but must not become RDF term equality.

The attribute bag can map either to direct predicates or to key/value assertion nodes. Direct predicates are pleasant to query; assertion nodes preserve arbitrary keys, duplicate occurrences if supported, and per-attribute provenance more uniformly. I favor direct predicates for known stable fields plus a structured escape hatch for unmapped values. Declare the mapping rather than relying on a broad `@vocab` to guess semantics.

Arrays need per-field container rules. JSON-LD arrays do not automatically preserve the ordering semantics of JSON arrays; use list/position encodings when order matters. Nested object identity also needs policy. Avoid anonymous blank nodes for entities that need cross-capture joins; deterministic skolem IRIs are helpful, but require documented derivation.

Microdata's RDF mapping is useful precedent, not proof this extractor already produces a conforming RDF dataset. It returns relative URL strings, string-valued properties, and a subset of microdata behavior. A graph conversion must resolve document bases, handle types and vocabulary expansion, preserve datatypes/order as required, and distinguish links from string literals. Add conversion fixtures instead of treating “graph-shaped” as “already RDF.”

### Migration without orphaning stores

1. **Now:** keep every existing MIME document and URN valid. Record mapping versions and observation provenance. Define entity identity and the handful of relations required for trace/metadata joins.
2. **Projection:** implement document-to-dataset mapping, with a sidecar manifest containing source entry revisions and mapping version. Rebuild it from existing stores. Retain original bytes for exact export; RDF equivalence is not byte identity.
3. **Oxigraph experiment:** load projected named graphs and test concrete queries: conversation→branches→messages; message→capture; title conflicts across observations. Compare results with the resolver's document fixtures. Graph queries initially read derived data, not an independent second authority.
4. **Backend promotion if useful:** expose an RDF-capable backend through the same content facade plus a separately advertised graph-query capability. It must retain documents or their byte representations as well as quads. A graph engine alone does not implement arbitrary MIME bodies. Review its actual transaction and embedding APIs before choosing atomic publication mechanics.
5. **Controlled graph writes later:** if callers may mutate graph facts directly, route them through explicit assertion/resolution commands with provenance. Do not permit untracked SPARQL updates to contradict canonical trace documents. Either transactionally regenerate affected documents or publish a new coherent generation and make synchronization state explicit.

Legacy imports must not acquire fabricated `complete` coverage. Mark unproven coverage unknown and preserve their existing authority as legacy source records until new evidence resolves it. Conversion is not semantic enrichment by fiat.

### The journal survives, but its abstraction changes

RDF changes what a transaction can contain, not whether disconnected subscribers miss it. The journal remains a sequence of **committed dataset revisions** with affected document/graph identities. A richer backend may include quad deltas; IDB may include document invalidations. Both need reconnect positions, reset behavior, and publication boundaries.

Keep backend cursors opaque, scoped to dataset/epoch. Do not require every backend to implement the same physical integer allocator or encode RDF through fake JSON puts solely to generate notifications. A change can say “these graphs and these content documents changed in commit X.” Query invalidation can start conservatively at graph level.

If quads and body storage live in separate databases, there is no assumed cross-database transaction. Use an authoritative publication manifest/outbox/recoverable projection protocol after verifying available backend capabilities. This is another reason to keep RDF a derived projection initially. Neither a triple store nor SPARQL automatically supplies a durable subscription stream.

## 3. Journal-after-e2e: keep the seams honest

The extension proof should establish that the reader sees actual transport/DOM behavior, persists interpretable observations, and can display/index them. It should not accidentally define today's emitter timing as a permanent public contract.

| Interface seam | Do not depend on | Deliberately probe |
| --- | --- | --- |
| `ReaderSpec.read(Capture, ReaderContext)` | Reader directly opening IDB or emitting transport notifications | Same fixture yields stable scoped identities; partial/complete assertions explain actual capture boundaries |
| `ReaderResult` → ingestion | One envelope magically describing heterogeneous puts; envelopes discarded after write | Trace plus metadata association, ambiguous scope, malformed/partial captures, retries |
| `ContentStore.put/match` | Internal object-store layout, body etag as full revision, read-before-write atomicity | Binary preservation, metadata-only change, committed-read visibility, duplicate writes |
| `ContentStore.events` → index scheduler | Exactly one event per user action, cross-context delivery, replay, noop as durable progress | Duplicate/coalesced invalidations, a missed notification followed by explicit refresh, writes during refresh |
| Extension transport | Same IDB name means same origin; ports/SW stay alive | Actual MAIN-world→content-script→SW route, disconnected port, restarted worker, persisted read after restart |
| Resolver/index reader | Separately fetched trace and metadata are one atomic snapshot | Incomplete publication, inconsistent pair detection, explicit refresh/readiness rather than fixed sleeps |
| Test fixtures/assertions | Browser storage internals or a fixed 150 ms debounce | Public content outcomes, provenance, explicit success/failure/unknown states |

Keep ingestion behind a function-shaped seam such as `ingest(result, sourceContext): Promise<Receipt>`. Today's receipt can report written URIs and completion, with no invented cursor. A later transactional store can return a commit cursor without changing readers. Similarly, index scheduling can accept “these inputs may have changed” now and a resumable change source later. Preserve low-level local-event tests where they are intentionally testing that adapter, but do not use them as integration guarantees.

Use the harness to record these specific sequences:

- Full response, later-arriving older partial DOM capture, newer streaming update, and branch switch. For now assert envelope and input preservation; resolver outcome assertions become active when resolution lands.
- Same observation twice; same body with a different title/metadata classification; simultaneous updates to different conversations and to the same one.
- SW restart after a successful put but before a consumer hears about it. The first proof may need explicit refresh; record that limitation instead of making the test pass through an accidental live process.
- Termination between related puts. Preserve the actual partial publication as a fixture that motivates atomic batch or manifest publication.
- A consumer attaching while writes occur. This exposes the snapshot/watch race the later journal must close.
- Truncated HTTP bodies, SSE boundaries, and virtualized DOM omissions. These determine the real unit of completeness and batching better than synthetic store operations alone.

MSW fixtures must be exercised through the real extension capture path, not only by calling the reader with manufactured JSON. Playwright/browser support constraints should be stated explicitly; harness success must not imply unsupported network hooks or worker lifecycle behavior were tested.

Two current details shape, rather than block, the next increment: IDB now resolves on transaction completion but still performs the equality read in a separate transaction; `canonicalMeta()` sorts top-level keys but does not recursively canonicalize nested objects. Thus the proof should not assert compare-and-swap semantics or a cross-language canonical metadata digest. These are contract boundaries to carry forward, not reasons to reopen the just-landed fixes in this wave.

## 4. Corrections to my round-one position

**I overreached on OTel demotion.** I treated the trace model mainly as accidental collector influence and undervalued the commissioning requirement. The hybrid preserves the desired semconv schema while giving application relations a home. It is a principled boundary, not a compromise to apologize for.

**I was too categorical about foundations before delivery.** A journal is required for recoverable change delivery, but an e2e capture proof can legitimately precede it. The condition is that evidence survives and the harness does not advertise emitter behavior as durable subscription semantics. The proof can discover the correct transaction unit.

**I underspecified coverage myself.** My prior envelope recommendation needed domain/branch scope and revision comparability. “Complete” is not a universally stronger write, and a newer partial update can leave a baseline-plus-overlay state rather than a single current complete snapshot.

**I would soften “database pretending to be a cache.”** The byte-oriented content facade is genuinely a useful general substrate. RDF makes its incompleteness as a relationship model apparent, but does not make the facade misguided. The right addition is an explicit dataset interpretation and capabilities, not a forced relational or graph rewrite.

**My journal design was too IDB-shaped for a long-lived protocol.** The durable cursor and lossy-doorbell distinction stands. A mandatory three-store layout and particular sequence allocator should remain an IDB implementation sketch; a graph backend should publish the same observable guarantees using its native transaction model.

**I retain the find/search distinction but accept the sequencing.** Token-AND is a perfectly legitimate current product behavior. This round should preserve it and avoid turning the deferred search contract into a prerequisite for resolver or RDF work.

The new center of gravity is this: **persist what was asserted, resolve under an explicit policy, and make every representation explain the same selected world**. Traces, metadata documents, and RDF graphs can cooperate on that without declaring one serialization the universal answer.
