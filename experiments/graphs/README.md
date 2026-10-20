---
type: ResearchExperiment
title: Oxigraph conversation graph laboratory
description: Runnable WASM graph playground and IndexedDB checkpoint/restart experiment with scoped observations and portable RDF exports.
status: draft
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra#medium"
sources:
  - resource: "opencode://ses_ea50d45c4ffexfv2EsIZ0yNvbT"
    title: Independent graph designs implemented and tested as two isolated browser iterations
  - resource: "/home/rektide/archive/oxigraph/oxigraph/js/README.md"
    title: Archived upstream JavaScript API and 0.6 migration guidance, consulted before installation
  - resource: "/home/rektide/src/pageread/experiments/graphs/node_modules/oxigraph/package.json"
    title: Installed npm latest resolved to 0.5.12, distinct from archived development documentation
  - resource: "/home/rektide/src/pageread/experiments/graphs/node_modules/oxigraph/web.d.ts"
    title: Verified installed load, dump, query, term and initialization API
  - resource: "/home/rektide/src/pageread/extension-kit/src/dsl.ts"
    title: Current reader envelope includes explicit conversation/domain/branch scope
  - resource: "/home/rektide/src/pageread/design/reactive-indexes/draft0.gpt6am.md"
    title: Earlier capture completeness and recoverable-change argument
  - resource: "/home/rektide/src/pageread/design/reactive-indexes/draft1.gpt6am.md"
    title: Hybrid resolver, graph projection and journal sequencing design
---

# Oxigraph graph laboratory

**A working browser UI, two selectable iterations, and repeatable tests.** Independent package/lockfile; no imports from pageread core packages. The experiment can run while the core build is under repair.

## Run

From this directory:

```sh
pnpm install --frozen-lockfile
pnpm dev --port 4317
```

Open **http://localhost:4317/**. The commissioning session left that development server running. A future checkout must start it again.

1. Read the default **Resolved main branch** result: M1 is updated; M2 survives.
2. Select provenance, title, default-graph, datatype/language, CONSTRUCT, or ASK queries. Edit the SPARQL freely and press **Run query**. This is a query playground, not a SPARQL Update editor.
3. Select **02 · IndexedDB checkpoint / restart**, then **Checkpoint**.
4. **Empty memory**, reload the page, select iteration 02 again, empty memory again, and **Restore into fresh store**. The query returns the original resolved pair.
5. Download the JSON bundle or TriG. The JSON bundle includes N-Quads and exact document strings.

There is no automatic restore on startup: the page deliberately begins with fixtures so restoration is an explicit, visible action. Emptying memory does not delete the saved checkpoint. Checkpointing an empty store deliberately saves an empty graph dataset alongside its fixture-source evidence.

## The two iterations

| | 01 · WASM graph | 02 · IDB checkpoint |
| --- | --- | --- |
| Engine | Oxigraph browser/WASM in-memory `Store` | Same engine, reconstructed from serialized RDF |
| Durable state | None | One IndexedDB record: N-Quads + exact JSON documents + observation metadata |
| Interesting question | Can named graphs and SPARQL express a scoped baseline/partial overlay? | Can graph semantics and original documents survive loss of the process-local store together? |
| Publication boundary | Fixture load | IDB transaction completion for the complete checkpoint record |
| Cost | Parse/query in memory | Full serialization and full reconstruction, not incremental persistence |

The persistence contrast was chosen instead of adding a token native crate. It tests the browser constraint directly and provides a concrete portable boundary for a future Rust/Oxigraph host. No native RocksDB persistence, Rust crate, ACP/A2A host, or tracing-test usage is claimed here. If a native iteration is added, its useful comparison is transactional native commits versus whole-dataset browser checkpoints, with `tracing-test` covering its trace output as requested by the operator.

## Fixture and resolution policy

[`src/fixture.ts`](src/fixture.ts) creates six exact JSON documents and six observation records:

- R10 complete main-branch trace: M1 and M2.
- R11 partial main-branch trace: updated M1 only.
- Late R9 partial trace: old M1, which must not roll it back.
- R99 complete alternative branch: must not win in the main-branch query.
- R100 other-account observation: must not appear in account A's result.
- Conversation title metadata, joined to the same conversation through provenance.

Message subjects include the scoped conversation URI. Observation graphs carry message assertions; `urn:graph:provenance` records conversation, branch, domain, coverage, numeric revision, document URI and capture URI. The default graph contains only a dataset catalog statement. A separate caveat graph contains a blank node, French language tag, and typed integer with a noncanonical lexical spelling.

All RDF predicates are under **`https://pageread.dev/experimental/graph/`**, a proposed project-owned experimental vocabulary, not a claim that this ontology is published or that OTel defines RDF classes there. Source JSON retains pageread's OTel-adapted itemtype spelling. Trace IDs are fixed fixture values, not a replacement for the project's deterministic ID derivation.

The resolved query takes the newest assertion **per message within the exact conversation/branch/domain scope**. The older baseline contributes M2 because the partial overlay says nothing about it. Higher revisions in other scopes cannot override it. Numeric revisions are an explicit synthetic-provider rule, not a general comparator for upstream opaque revision strings.

This is a baseline-plus-overlay query, **not a complete resolver implementation**. Equal-revision conflicts, explicit clears, deleted membership, authority ranking, later complete replacement, branch edits and coverage aggregation remain future experiments. Capture URIs are synthetic provenance identifiers; raw network capture bodies are not included. Observation records use a flattened experimental representation corresponding to the current DSL scope rather than importing the DSL.

## API finding: archive and npm differ

The archived upstream README describes a developing **0.6** API and bundler packaging. Installing `oxigraph@latest` resolved to **0.5.12**. Installed declarations and actual execution determined the implementation:

- Browser: explicit `await init()` from `oxigraph/web.js`; Vite resolves `Store` from `oxigraph` to the browser module.
- Node tests/export: package's Node entry initializes WASM itself.
- `Store.load(..., { format: "application/trig" })`, named graphs, SPARQL query, and `dump` in N-Quads/TriG work in the tested version.
- Query results include SELECT binding maps, boolean ASK, and CONSTRUCT quad arrays. Display retains RDF term syntax rather than flattening everything into untyped strings.
- `skipLibCheck` is enabled because 0.5.12's shipped declarations contain `UInt8Array` spelling and missing declaration-modifier errors. Application TypeScript remains checked.

Vite emits a roughly **4.32 MB WASM asset** (about 1.55 MB gzip in the tested build). This experiment uses a UI bundle; it does not change any core package's unbundled module output. There is no library-distribution build requiring tsdown here.

## Portable interface for publishing / native follow-up

```sh
pnpm export
```

Produces ignored, reproducible artifacts:

- `exports/dataset.nq` — `application/n-quads`, complete dataset including named/default graph distinction.
- `exports/dataset.trig` — `application/trig`, same dataset in readable form.
- `exports/bundle.json` — envelope below, preserving source representation as well as RDF.

```ts
interface Bundle {
  format: "pageread-graph-experiment/1";
  mapping: "fixture-projection/1";
  nquads: string;
  documents: Array<{ uri: string; mimeType: string; body: string }>;
  observations: Array<{
    graph: string; documentUri: string; conversation: string;
    branch: string; domain: "messages" | "title";
    coverage: "complete" | "partial"; revision: number; captureUri: string;
  }>;
}
```

The publishing experiment can consume these files without linking the graph package or accessing IndexedDB. JSON parsing reproduces the exact document strings, including whitespace, trailing newline and Unicode; RDF serialization is not used to reconstruct original JSON. These fixtures are UTF-8 text, not an arbitrary binary body/base64 format. Graph dumps do not preserve original RDF formatting and are not canonical signed representations. No content digests, signing, authorization, network publication, or remote importer are implemented.

`exportBundle()` is intentionally a **fixture exporter**: it pairs the current graph with this fixture corpus. It is not a generic provenance generator for arbitrary externally modified stores. `restoreBundle()` checks format/mapping tags and parses RDF but is not a hostile-input validator. External consumers should treat this as an experimental artifact contract.

## Verified capabilities

On 2026-10-20, after installing dependencies with pnpm CLI:

```sh
pnpm test
pnpm check
pnpm build
pnpm exec playwright install chromium  # first run only
pnpm test:browser
pnpm export
```

- **5 Vitest tests passed:** resolved values and scope, default versus union graph, language/datatype/blank-node roundtrip, reopen-IDB/fresh-store reconstruction with exact documents, and absent/unsupported checkpoint handling. IDB unit tests use `fake-indexeddb`.
- **Typecheck and Vite production build passed.** No external core workspace packages needed.
- **1 Playwright test passed in Chromium:** actual WASM UI initialization, checkpoint transaction, memory loss, page reload, fresh-store restoration from real browser IDB, default/union query behavior, invalid-query feedback, download initiation, no page errors. The test starts its own Vite on port **4318** and stops it afterward.
- **MCP browser smoke also passed** against port 4317: query and checkpoint/reload/restore.
- **CLI export passed:** 58 quads, six exact source documents, both N-Quads and TriG files.

The test is a page reload/reconstruction test, not a browser crash, disk-fsync or machine-reboot durability claim. Browser storage quota, eviction, multi-tab races, MV3 worker suspension and cross-origin messaging remain untested. The current IDB record intentionally overwrites only the selected checkpoint; there is no journal, subscription protocol or automatic cleanup.

## RDF boundaries worth seeing

- The **union-default-graph** checkbox is deliberately explicit. Union queries mix conflicting historical observations; union is not resolution or authority selection.
- RDF blank-node labels are serialization-local. Tests verify existential blank-node semantics, never a stable generated label.
- RDF typed literals may normalize lexical spellings (`0007` versus `7`). Test datatype/value semantics; use retained documents when exact text matters.
- Language tags are part of literal identity. The UI keeps `@en`/`@fr` visible.
- A set of quads does not preserve repeated-event multiplicity or JSON array order. This limited mapping extracts text and timestamps; it is not a lossless semantic mapping of the whole trace. Exact documents retain everything else.
- Empty named graphs are not represented in these N-Quads fixtures. A future dataset lifecycle protocol needs explicit graph manifests if empty graph identity matters.
- Full checkpoint serialization is simple and atomic as one record, but scales with the entire corpus. Native persistence or segmented generations should be compared with measured larger fixtures, not inferred from this small demo.

## Connections and next useful experiment

This realizes the scoped-evidence and graph-projection argument in [round two](../../design/reactive-indexes/draft1.gpt6am.md). The older [round-one design](../../design/reactive-indexes/draft0.gpt6am.md) motivates the recoverable-change boundary, which this checkpoint experiment deliberately does not implement.

The best next comparison is a native host importing the exported N-Quads plus exact documents, running the same queries, then proving transactional restart with a recorded commit position. A second useful fixture would introduce a later complete replacement and an explicit deletion assertion: that forces a real coverage/authority policy instead of treating maximum revision as sufficient forever.
