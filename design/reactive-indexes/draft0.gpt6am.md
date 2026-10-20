---
type: DesignInquiry
title: A local document database pretending to be a cache
description: Independent redesign of pageread persistence, reactive views, search, and cross-context delivery.
status: draft
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra#medium"
sources:
  - resource: "opencode://ses_ea50d45c4ffexfv2EsIZ0yNvbT"
    title: Independent Astra-medium diagnosis and proposed reactive-index architecture
  - resource: "/home/rektide/src/pageread/schema/src/vocab.ts"
  - resource: "/home/rektide/src/pageread/schema/src/item.ts"
  - resource: "/home/rektide/src/pageread/schema/src/ids.ts"
  - resource: "/home/rektide/src/pageread/schema/src/trace.ts"
  - resource: "/home/rektide/src/pageread/schema/src/microdata.ts"
  - resource: "/home/rektide/src/pageread/signals/src/core.ts"
  - resource: "/home/rektide/src/pageread/signals/src/subscribable.ts"
  - resource: "/home/rektide/src/pageread/signals/src/dom-router.ts"
  - resource: "/home/rektide/src/pageread/signals/src/live.ts"
  - resource: "/home/rektide/src/pageread/store/src/types.ts"
  - resource: "/home/rektide/src/pageread/store/src/memory.ts"
  - resource: "/home/rektide/src/pageread/store/src/idb.ts"
  - resource: "/home/rektide/src/pageread/store/src/cache-api.ts"
  - resource: "/home/rektide/src/pageread/store/src/content-index.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/types.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/factory.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/tokenize.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/text-index.ts"
  - resource: "/home/rektide/src/pageread/indexer/src/shapes/shared.ts"
---

# A local document database pretending to be a cache

## Vibes: the kernel is a replayable observation database

Pageread is a collector pipeline feeding a local document database with materialized views and a search service. It has the beginnings of a sync engine, but no replicated-state protocol yet. Signals are its presentation adapter; they are not its consistency model.

The interesting kernel is **stable identities for things observed more than once, plus independent projections of those things**. A transcript browser, a project directory, a message navigator, and a text search engine can share evidence without sharing UI state. MIME-typed URNs are an excellent small waist: browser code and a Rust process can agree on bytes and identity without agreeing on object classes.

The accidental complexity is treating every mechanism as the same kind of stream. A DOM invalidation, a committed document replacement, a current view value, and a search-result delta have different replay and ordering meanings. Sharing `subscribe()` is convenient plumbing, not evidence that these contracts are equivalent.

My governing choice: **make committed change observable and recoverable before making computation incremental**. Otherwise IVM just makes missed events harder to repair.

This is a source-based design opinion, not a tested patch or an upstream API audit. The external systems below are architectural comparisons; their current documentation was not consulted.

## First, some premises are already wrong

These are visible in the inspected code, not hypothetical scaling objections:

- `store/src/idb.ts` resolves a mutation on request success, not transaction completion. It also reads and writes in separate transactions. The event stream therefore does not yet mean “committed transitions,” and concurrent read-modify-write behavior is not protected.
- Body hash equality is not entry equality. Memory and IDB suppress changes to MIME type and metadata when body bytes stay equal. A renamed or reclassified object can fail to move between views. Preserve `bodyHash`; add an entry revision covering semantic headers and metadata, with a specified canonical encoding.
- The Cache adapter is not behaviorally equivalent to the other backends: it always emits puts, reads arbitrary bytes through `.text()`, and tests MIME filters against an empty MIME before reading responses. A MIME-filtered scan can exclude everything. The stated idempotent, MIME-typed binary-store contract is not currently met.
- `factory.ts` accesses `event.uri` for puts, but the put variant carries `event.entry.uri`. With `uriPrefix`, the listener can attempt `undefined.startsWith(...)`. This breaks the normal refresh route before the subtle architecture problems arise.
- `changedUris` is presently every surviving entry, not the changed set; deletions are absent. It cannot support correct incremental maintenance as named.
- Excluding only one's own snapshot does not prevent cycles between broad indexers. Two views can consume each other's output. Refreshes also have no serialization or generation guard.
- The ContentIndex directory is one unprotected read-modify-write document. Concurrent additions can overwrite one another. Its facade-local events also omit changes made through the underlying store, and `deleteAll()` emits no facade deletion events.

The parent is right to worry about cross-context events, but wrong if it assumes this is merely a missing BroadcastChannel connection. The event being transported needs a stronger definition first.

## Three concepts, with sharper ownership

Keep three **roles**, not three competing authorities:

1. **Content store:** authoritative typed documents, conditional writes, transactional batches, bounded scans, and a durable committed-change cursor.
2. **View engine:** named/versioned deterministic projections, checkpoints, invalidation dependencies, and optional query accelerators.
3. **ContentIndex facade:** a presentation catalog, adapting a view or independently authored catalog entries into `add/delete/getAll`-shaped operations.

The real Content Index API is a useful inspiration for user-facing discovery metadata, not a database indexing model. A catalog record needs both a store identity and an actionable navigation target. Calling a URN `url` obscures that distinction. Keep a compatibility facade if useful, but internally use `contentUri` and `openTarget` separately.

If the catalog is derived from transcripts, it should be a view. If the operator can author descriptions/icons, those edits should be separate source documents, joined with the derived view. Do not make a generated directory also the only home of human edits. Store independent catalog items under stable URNs instead of rewriting one aggregate document on every edit.

Borrow from Cache the simple typed-body interface and explicit matching. Do not borrow HTTP request matching or pretend CacheStorage supplies database transactions. Expose backend capabilities honestly: a Cache adapter may remain useful for payload storage/export without supporting the authoritative transactional view engine. Memory can emulate the stronger contract for tests.

### Queryable, yes; a universal query language, no

Add structured range scans and `watch(filter, cursor)` to the durable backend. Keep arbitrary text extraction and ranking outside it. A minimal filter is enough initially: URI namespace, MIME, and perhaps explicitly indexed account/project properties. Fetch bodies only when needed; current `keys()` loading every body is an avoidable tax.

Transactions should commit multiple content mutations and one change batch atomically. Include old and new MIME/namespace classification in changes so subscribers invalidate when an entry **leaves** their filter as well as when it enters. Do not put noop calls into the durable change history; operation diagnostics can retain them separately.

## Snapshot/finder: good boundary, bad lifecycle

I would keep the split, but reject “lean snapshot” as a universal storage policy. A finder is executable process state. A snapshot is portable data. That says nothing about whether snapshot data may include postings.

Define a view manifest with:

```ts
interface ViewManifest {
  name: string;
  definitionVersion: string;
  sourceCursor: string;
  generation: string;
  artifacts: Array<{ uri: string; bodyHash: string; mimeType: string }>;
}
```

Directory views can remain lean. Large text views should persist extracted field documents first, and versioned posting segments when cold-start measurements justify them. Rebuilding every finder from every full trace on each service-worker wake squanders the main benefit of persistence. Publish artifacts before atomically selecting the manifest; a reader only opens a complete generation. Or write all records in one bounded transaction where practical.

For now, retain full rebuild as a correctness oracle. Add serialized refresh with a dirty flag: changes arriving during a build guarantee another pass. Publish a coherent `(manifest, snapshot, finder)` generation, not a snapshot whose finder can lag or fail after publication. Longer work needs persisted progress; a debounce timer is only a scheduling hint under MV3 suspension.

`find()` returning `[]` before initialization is a lie by omission: “no matches” and “not searched” are different states. Return or expose `{phase, sourceCursor, generation, error}` and make readiness explicit. A live search query depends on **both query text and finder generation**. Its results should carry the searched revision and distinguish current, stale, building, and failed.

### Incrementality I would actually build

Start with per-source replacement, not a general differential-dataflow framework:

1. Extract fields once per `(uri, entryRevision, extractorVersion)`.
2. Track the contributions owned by each source URI: message rows, project membership, postings.
3. On replacement, remove the old contributions and insert the new ones; on deletion, remove them.
4. Advance the view cursor in the same transaction as durable view changes.

A reverse map from document to its indexed terms avoids the current `TextIndex.remove()` scan of every term. Replacing a field must remove its old postings; `addField()` alone currently appends duplicate/stale postings on reuse. Project aggregates need old membership and counts, not merely the new trace.

Multiple logical views should share extraction and a physical text index, scoped by account, project, conversation, and field. “One index per conversation” need not mean one complete `TextIndex` allocation and corpus scan per conversation. Maintain separate subscriptions and view identities over shared machinery.

Borrow Replicache/Electric-style ideas of transactional change batches, resumable positions, and query invalidation. Do not import remote optimistic mutation rebasing until there is an actual remote authority and conflict policy. Borrow search-engine document replacement and serialized index generations; do not assume a particular library's serialization is a cross-language format. In Rust, FTS5 is a strong local accelerator candidate, not necessarily the portable index artifact.

## Cross-context eventing: durable cursor, lossy doorbell

First distinguish **extension pages** from **website pages/content scripts**. Giving two contexts the same IDB name does not give them the same database. Origin/storage partition boundaries matter. A ChatGPT page must not be assumed to share extension-origin IDB or BroadcastChannel. Use extension messaging for the content-script bridge, and validate the supported browser's actual storage behavior rather than building on that assumption.

For contexts that really share the database, use this protocol:

1. IDB holds `contents`, `changes`, and `control`. The control record has an epoch and monotonic head sequence. Treat `(epoch, sequence)` as the cursor; database recreation changes epoch.
2. A write opens one readwrite transaction across all three stores. Read the old entry there; compare the complete semantic revision or an explicit expected revision; update content; allocate the next sequence; append a bounded change batch; update head. Precompute hashes before opening the transaction where possible, and avoid unrelated async work that lets IDB auto-close it.
3. Resolve the write only on transaction completion. Then emit local invalidation and broadcast `{databaseId, epoch, head}`. No bodies, no invented second ordering authority.
4. Each reader serializes its drain loop, reads changes after its cursor, applies them, and advances its cursor only after successful application. Duplicate or out-of-order doorbells are harmless. Read committed head rather than trusting message ordering.
5. Bootstrap by registering notification handlers first, then reading a consistent initial snapshot and head in one readonly transaction. Buffer hints during bootstrap and drain after the snapshot. A snapshot read independently from its cursor has a race.
6. Always catch up at attachment/reconnection. Also check head when a suspended page becomes active and before serving a freshness-demanding query. For continuously active consumers requiring prompt convergence despite lost hints, use a bounded periodic head check; notifications alone cannot close the commit-before-broadcast crash window.

The change journal can contain invalidations rather than historical bodies. Then catch-up means “re-read current affected documents,” and results must declare the head actually covered; it does **not** promise replay of each intermediate document state. Consumers requiring historical event replay need retained versions. Do not let those two contracts silently share a name.

An extension SW owns writes in the common deployment. Extension UI pages may read shared IDB directly; website content scripts issue commands and receive notifications over `chrome.runtime`/`browser.runtime` messaging. Extension messages wake the SW through supported event handlers. BroadcastChannel is a same-storage-context optimization, not a reliable SW wake mechanism. Ports can disconnect; reconnect with the last cursor. Do not depend on a perpetually alive worker or port.

For a remote reader over a port, define `watchStart` to return a consistent snapshot plus cursor, then stream catch-up invalidations. Bound batches and acknowledge consumed cursors rather than pushing unbounded bodies. A slow reader can be told to resnapshot. The same shape later works over Rust IPC.

No automatic journal pruning is part of this proposal. If explicit retention/maintenance later removes history, advertise a retained floor and return `resetRequired` for older cursors. The protocol should support that response now without secretly deleting anything.

## The surprising missing piece: observations have coverage

My strongest additional proposal is **capture completeness as first-class data**.

A DOM reader sees what is mounted, not necessarily the complete conversation. A network receiver may see a page of messages, a streaming fragment, a different branch, or a whole conversation. Deterministic IDs prevent duplicates; they do not prevent an incomplete late observation from replacing a richer earlier record.

Represent an observation envelope with source identity, capture identity, observed revision if available, branch identity, and coverage such as `complete`, `partial`, or `unknown`, plus the entities/range actually covered. These are semantic assertions by the receiver, not guesses made from a short array. Preserve provenance to the raw capture. A partial capture's absence of a message is not deletion. An explicit deletion or an authoritative complete replacement can remove membership according to the source's rules.

Incremental maintenance should consume the resolved current documents, while a resolver chooses how observations update them. This is where collector thinking is valuable: receivers gather evidence, processors normalize/resolve it, exporters produce OTel or other formats. Receivers should not each invent database overwrite policy.

Ruthless version: conversation/message documents become the primary domain model, and OTel traces become one projection. Conversations have branches, edits, attachments, and capture uncertainty that do not naturally fit a span lifecycle. Incremental version: retain today's TraceItem representation, attach explicit capture/coverage metadata, and document merge authority before enabling incremental deletion. Either is better than treating a reconstructed trace as unquestionable complete truth.

## Ctrl+F over everything needs a search contract

The existing `TextIndex` is token-AND search within a field. It is not browser find: `foo bar` can match a field containing those words far apart, and `cript` does not match `transcript`. Punctuation-only queries disappear. Decide product semantics before choosing a library.

I would expose two modes:

- **Find:** literal substring/phrase semantics with explicit case and Unicode rules; navigation ordered by document/message position.
- **Search:** token/prefix/ranked retrieval with filters and snippets.

Share extracted fields, not necessarily execution plans. Initially use postings to narrow eligible fields where safe and verify literal matches against original field text; fall back to scanning for queries the token index cannot safely narrow. Trigram acceleration is an option after corpus measurements. FTS5, MiniSearch, or Lunr-like engines are accelerators to evaluate, not a substitute for stating the contract.

Every hit needs source URI, entry revision, stable message/field identity, offset convention, and a navigation target. Current JavaScript offsets are UTF-16 code units; Rust byte offsets will not agree on emoji. Specify this in the wire format and test shared fixtures. Unicode normalization may require a mapping back to original text positions. Recheck revision before applying highlights.

“Everything” also needs coverage reporting: which sources are indexed, which captures are partial, which MIME types have extractors, and which documents failed extraction. A silently skipped parse in `parseTraces()` should become a visible diagnostic count, not a universal zero-results claim. Attachments and code need explicit extraction policies; DOM text needs mapping to rendered ranges and virtualized-message navigation.

## Signals: keep the adapter, stop making it own durability

Borrow disposal/ownership and equality discipline from mature fine-grained reactive libraries. Every live query, indexer, and bridge needs a disposal boundary. The current bridge explicitly discards its disposer; live queries retain router subscriptions; the router never disconnects. Those are practical long-session problems.

The router's first subscriber currently fixes `characterData` forever. Negotiate the union of subscriber requirements, or always observe the required superset. The claimed conservative selector invalidation also deserves correction: inserting a nonmatching sibling can change `:nth-child()` matches without any added node matching the selector. Structural selectors require broader invalidation. Arbitrary predicates may depend on text, and CSS dynamic states such as focus need event sources beyond MutationObserver.

Keep one router per observed root, but document shadow-root boundaries and query ownership. DOM membership signals are not content-revision signals: a message element can remain the same object while all its text changes. An extraction subscription needs content invalidation even when the array of elements compares equal.

Finally, `computed` currently increments its version on every recomputation even when the computed value compares equal, despite the optimization claimed in its comment. Repair semantics and conformance tests before expanding the custom reactive runtime. A standard-shaped interface over a proven implementation may be a better maintenance bargain; it need not change the durable protocol.

## Rust / ACP / A2A: portable semantics before portable classes

The native host should expose a content service that protocol adapters use. ACP/A2A session lifetimes must not define the lifetime of stored content or its revision history. Whether and how each protocol carries custom store operations requires a separate capability/extension review; this document assumes no standardized store API in either protocol.

Needed contracts:

- Byte-preserving bodies, MIME representation, metadata canonicalization, and revision/hash rules, verified by shared TS/Rust fixtures.
- Fully scoped natural keys for deterministic IDs: provider/account/conversation/message as appropriate. Hashing an ambiguously scoped string only makes ambiguity deterministic.
- Conditional put/delete, atomic batch, scan pagination, snapshot-plus-cursor watch, reconnect/reset, cancellation, and bounded delivery.
- Schema/extractor/tokenizer versions and migratable view manifests. Imported indexes are untrusted accelerators until compatible with the source revisions and definition version.
- Source/account scoping and explicit host capabilities, so a session only sees its intended collections. This is also essential for avoiding duplicate or cross-account search results.
- A transport-neutral error and readiness model. Distinguish unsupported MIME, malformed content, conflict, stale cursor, unavailable host, and a successful query with no hits.

SQLite with transactional content rows, a changes table, and optional FTS5 is a plausible Rust backend. Share conformance fixtures and wire semantics rather than forcing IDB and SQLite to expose identical physical indexing. Preserve one-module-per-file TS ESM builds: the new pieces can be ordinary modules for commit protocol, cursor draining, view scheduling, and search sessions, with no bundler runtime requirement.

## Landing recommendation

**Incremental moves:** correct store commit/equality semantics and event shape; serialize refresh; add disposal/readiness; implement durable cursor plus messaging; replace directory read-modify-write with independent records or transactional mutation; introduce shared field extraction and per-document replacement; then decide which search artifacts to persist from cold-start evidence.

**Ruthless moves worth preserving:** demote OTel to an export projection; treat capture resolution as a distinct domain stage; make catalogs views over independently authored metadata; replace “many indexer instances each rebuilding everything” with one view service exposing many named subscriptions.

The architectural test is simple: kill the SW after any committed write, reconnect a reader, and ask whether it can explain both what it knows and how current that knowledge is. If the answer requires hoping an emitter ran, this is not yet a reactive persistence system.
