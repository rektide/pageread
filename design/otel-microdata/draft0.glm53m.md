---
type: DesignInquiry
title: "pageread: otel-microdata traces out of pages — architecture wave 0"
description: Working model for reading ChatGPT sessions into OTEL-semconv microdata traces: schema, signal-routed live DOM, MIME-typed content store, reactive indexers, extension DSL on WXT, and the paused inflight-registry direction.
status: draft
tags: [pageread, otel, microdata, signals, extensions, indexer]
generated:
  at: "2026-10-20"
  by: "model:zai-coding-plan/glm-5.3#max"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: "Session commissioning the architecture: schema, signals router, store shapes, indexer factory, DSL/WXT machinery"
  - resource: "/home/rektide/src/pageread/README.md"
    title: "Original pageread sketch: page-grasping CLI with agent-contributed JS rules"
  - resource: "/home/rektide/src/pageread/schema/src"
    title: "OTEL-semconv microdata vocabulary, deterministic ids, DOM microdata extraction"
  - resource: "/home/rektide/src/pageread/signals/src"
    title: "TC39-style signals core and global MutationObserver router"
  - resource: "/home/rektide/src/pageread/store/src"
    title: "Cache-shaped content store and ContentIndex facade"
  - resource: "/home/rektide/src/pageread/indexer/src"
    title: "Reactive indexer factory with lean snapshots and warm finders"
---

# pageread architecture — wave 0

## Situation

The operator wants to read their ChatGPT sessions as data. The asks, in
their words: adapt OTEL semantic conventions into a personal schema ("use
a microdata but adapt otel semantic conventions somehow to be my schema");
build bespoke browser extensions via an *extension-writing toolkit* whose
extensions "parse otel events out of the page — traces"; an indexer; and a
store backend shaped like the web's content-indexing ideas — "an api
shaped like that, with mime types." A live/signal querySelector — "a query
that joins into the change stream" over one shared MutationObserver — is
"a great tool unto itself." Indexes come in multiples (transcripts,
projects, per-conversation messages), "each ideally able to act as a
reactive event stream signaller thing."

This repo was an empty sketch (a page-grasping CLI idea); this wave gives
it its first real capability spine.

## Present ask

Build the base machinery (done: schema, signals, store, indexer); wire
extension building on WXT with tsdown's unbundled mode (extension
packaged as its full file tree, no deep bundling); define a DSL of
extension building that compiles declarative specs to WXT entrypoints;
delegate the ChatGPT reader extension and the playwright/MSW harness to
background agents once the machinery exists; define Rust crate skeletons
(tracing-tested) for a future ACP/A2A session hosting the store.

## Directions of inquiry

### Schema: microdata whose vocabulary is OTEL semconv

Structural fields are direct itemprops (`trace_id`, `span_id`,
`start_time_unix_nano`, `events`, …) with OTel JSON names; semconv
*attributes* live in an `attributes` bag keyed by real semconv names
(`gen_ai.request.model`, `http.request.status_code`), so `toOtelJson()`
is a mechanical mapping. Item types are IRIs under
`https://opentelemetry.io/semconv/`; `pageread.*` is our adaptation
namespace (`pageread.conversation.id`, `pageread.project.id`,
`pageread.source`). Deterministic ids (pure-JS sha256) make re-captures
idempotent: conversation UUID → trace id, message node id → span id.
DOM microdata extraction (`itemsFromDom`) reads items pages embed — the
"walk the entities on the page" primitive.

### Signals: one router, many consumers

TC39-signals-style core (`state`/`computed`/`effect`/`batch`/`untrack`,
eager invalidation, lazy pull, deferred effects). The dom-router keeps
exactly one MutationObserver per root, batching records into
microtask-aligned `MutationBatch`es; `liveQuery`/`liveQueryWhere` are
computeds invalidated through it — precise for flat selectors
(changed-attribute-name participates in matching), conservative
otherwise, with array equality so no-op recomputes notify nobody.

### Store: the web's content-store shape, with MIME types

`ContentStore`: `put/match/matchAll/keys/delete` of URI → MIME-typed
content (`application/vnd.pageread.trace+json`, …). sha256 etags make
re-puts noops. Event outputs (`put|delete|noop`) make persistence a
reactive source. Backends: memory, IndexedDB (primary; works in MV3
service workers), CacheStorage adapter (URNs onto synthetic URLs). The
Content-Indexing-API shape arrives as a *facade* over the store
(`contentIndexOver`), persisting a directory document — the real API is
metadata-only and cannot be the backend.

### Indexer: named, reactive, persisted views

`createIndexer(store, config)`: filter → `build()` a lean snapshot →
persist as a MIME-typed doc → `makeFinder()` a warm process-local finder
(positional inverted TextIndex — the ctrl+F engine) → publish via signal
+ `subscribe` stream. Store events trigger debounced refreshes. Shapes:
`transcripts`, `projects`, `conversation:<id>`. The snapshot/finder
split keeps persisted documents honest (no postings in JSON) while
queries stay warm.

### Extension building: DSL → WXT, unbundled

WXT for extension machinery (vite-based, per-entrypoint outputs); tsdown
`unbundle: true` for all libs so everything ships as real files. The DSL
(`ExtensionSpec`): matches, network sources (URL patterns, methods),
DOM sources (selectors, itemtypes), readers (capture → store puts +
content-index entries), index names. `@pageread/extension-build` compiles
a spec into thin WXT entrypoints: `world: "MAIN"` content script (fetch/
XHR/SSE hooks), `world: "ISOLATED"` relay (nonce handshake → SW), and a
background that runs readers over captures and maintains indexes.

### Rust: crate guesses for ACP/A2A

Skeletons only: `pageread-schema` (vocab/ids shared with TS),
`pageread-store` (native store host), `pageread-index` (snapshot/find),
`pageread-acp` (expose store+indexers to an agent session). Every crate
wired with `tracing` + `tracing-test` from birth, per the operator's
"lots of tracing-test for any rust."

## Paused: the inflight registry

The operator wants "a good working model, some registry, of the
inflight." The promising frame: **an in-flight operation is a span
without an end time yet** — pageread observing itself. The pipeline
(hooks → captures → readers → store → indexers) emits its own trace
items; `inflight` becomes one more index shape — open spans as live
signal state over a lean persisted snapshot, subscribable as a stream.
Background agent sessions could join the same model (their sessionIDs
are already first-class provenance).

**Paused pending the astra-medium outside pass**
(`design/reactive-indexes/draft0.gpt6am.md`, in flight): whether inflight
lives in the store, in pure signals, or in a cross-context fabric
(SW writer ↔ page readers over one IndexedDB) is exactly the area under
redesign opinion. Do not build before reading that wave.

## Open questions

- Cross-context eventing: same-store contexts don't see each other's
  writes (BroadcastChannel? ports?) — blocks the inflight dashboard and
  page-side index views.
- Full-rebuild refreshes vs incremental view maintenance as trace counts
  grow.
- Whether SSE chunk events belong as span events (verbose) or a
  `pageread.chunk` attribute summary.
- DSL codegen ergonomics: generated-thin vs spec-as-data purity (specs
  currently carry reader functions).

## Layout decision

Top-level capability domains (`schema/`, `signals/`, `store/`,
`extension-kit/`, `extension-build/`, `indexer/`, `extensions/<name>/`,
`harness/`), each a pnpm workspace package exporting source TS.
Alternatives considered: `packages/*` grouping (adds a layer without
grouping insight) and single-package `src/` domains (couples release
cadence of extension code and pure libraries). Domain-top won for
shallow imports and one-product coherence.

## What changed since previous work

First real wave in this repo; prior state was the README sketch plus an
empty `pageread.ts`. Schema/signals/store/indexer cores are committed
with tests green (31 tests). Extension kit, DSL/WXT machinery, crates,
and the delegated chatgpt extension + harness are next.

## Addendum — design journal: the finder split (and a loss)

The indexer API first declared `find?(snapshot, query)` — find as a pure
function of the *persisted* snapshot:

```ts
find?(snapshot: S, query: string): FindMatch[]
```

That signature forced a lie: snapshots are deliberately lean (they must
persist and export as MIME-typed documents), but the ctrl+F payload —
message text, titles — lives in the trace documents the snapshot points
at. The first `transcripts.ts` hid this with closures (`entriesFor`,
`rebuildTextIndex` referenced before definition) whose entry feed was
empty, so find would have silently returned `[]` forever. The correction
split the concern:

```ts
build(entries, prev, ctx): S                                // lean, persisted
makeFinder?(entries, snapshot): (query) => FindMatch[]      // fat, in-memory
```

Tradeoffs stated: finders are process-local (one refresh after restart
before find answers; each context holds its own), and the API admits
find is instance state, not a pure function.

The first factory draft also carried `inflight` promise-chaining and
`lastSnapshotEntry` juggling; both were unnecessary (refreshes are
idempotent full rebuilds; self-feedback is already excluded by URI
filters on both the entry scan and the event subscription) and were
deleted in a simplification pass.

**Process lesson, recorded at the operator's prompting:** none of these
pre-simplification states were ever committed — the overwritten drafts
survive only in the commissioning session
(`opencode://ses_ea538b494ffej4MXIdPDIIDTLU`). Going forward: checkpoint
honest intermediate states before revamps, and commit revisions
separately with their delta and destination explained. This addendum is
the compensation, not a substitute — the journal keeps the argument; the
history keeps only its conclusion.
