---
type: ExperimentIndex
title: Pageread isolated experiments
description: Runnable research into graph storage, reader generation and ATProto publication, with explicit integration boundaries.
status: experimental
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Commissioned isolated experiments, tracked ownership, built the reader loop and coordinated integration
  - resource: "opencode://ses_ea50d45c4ffexfv2EsIZ0yNvbT"
    title: Reactive-index inquiry and commissioned Oxigraph experiments
  - resource: "opencode://ses_ea4d321acffe570t5fjBe7tkO8"
    title: Commissioned reader and graph publication experiments
  - resource: "opencode://ses_ea4d36447ffewTLi2X0SImAY6W"
    title: Commissioned extension build and browser proof
  - resource: "/design/reactive-indexes/draft1.gpt6am.md"
    title: Hybrid resolution, graph projection and publication boundaries
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/userScripts"
    title: Browser execution mechanism for returned user scripts
  - resource: "https://developer.mozilla.org/en-US/docs/Web/API/Element/beforematch_event"
    title: Find-in-page reveal event, distinct from content storage and search
---

# Isolated experiments

Each experiment has its own package/dependency boundary so a finding can be
kept, compared or replaced without silently becoming production architecture.
Their README files own commands and verified limitations.

| Experiment | Question | Verified state |
| --- | --- | --- |
| [Reader loop](reader-loop/README.md) | Can a page request produce a retained executable reader with inspectable inflight state? | Runnable MSW/jsdom proof; Chrome adapter unit-tested |
| [Graphs](graphs/README.md) | How do browser Oxigraph, persistence and observation graphs compose? | WASM playground + IDB checkpoint/restart; 5 unit tests, Chromium proof, typecheck/build and 58-quad export |
| [Publishing](publishing/README.md) | How can scripts and RDF datasets be published as lexicon-governed records? | 11 tests; actual graph export and retained reader artifact round-trip through mock PDS |

The [extension build proof](../extension-build/README.md) lives outside this
experiment subtree. It now builds loadable WXT artifacts: library and background/
popup modules are preserved; content scripts remain IIFE bundles. The
[browser harness](../harness/README.md) proves actual capture, IDB persistence,
named index/search and same-profile restart readback. Core build/checks and
50 tests pass. At dispatch, the previous core had passing unit tests but failing
typechecks and no built extension; that predecessor is preserved in history.

The graph playground is served at **http://localhost:4317/** during this session.
To restart it, run `pnpm dev --port 4317` from `experiments/graphs`.

## Integration target

```text
ask to read a page
  -> capture scoped page evidence
  -> dispatch prompt through an agent transport
  -> receive and retain a reader artifact
  -> register/run the reader in an explicit runtime
  -> persist observations
  -> resolve trace + conversation metadata
  -> project RDF and query named graphs
  -> publish selected reader/dataset artifacts via ATProto
```

The experiments exercise individual seams, not this whole sequence yet. Both
the actual RDF export and the actual retained reader artifact have crossed the
publication seam with exact byte comparison after mock-PDS readback.
The browser adapter can use Chrome's `userScripts` API for user-supplied
JavaScript; packaged reader modules remain a distinct execution path.
`AgentTransport` initially uses a small fixture HTTP protocol, not a claim of
ACP/A2A compatibility. A generated artifact, an installed reader and a published
record are separate states with separate evidence.

## What crosses the boundaries

- **Reader artifact:** JavaScript bytes, MIME type, runtime, match patterns,
  generation identity and source provenance. Retain it before execution.
- **Observation:** exact source inputs plus scoped coverage, source revision
  when known, reader version and entity identities. Missing DOM nodes do not
  establish deletion.
- **Graph projection:** N-Quads or TriG with named graph identities, mapping
  version and document provenance. Keep original MIME documents and bytes.
- **Publication:** data records follow a lexicon; publishing that lexicon's
  schema is a different operation. Graph blobs, graph identities and record
  CIDs do not share one identity by default.

Durable journals remain after the e2e capture proof per the operator's ruling.
Local callback events do not promise replay or cross-context delivery. Research
packages should expose that limit rather than reproduce a fragile assumption.

## An earlier browser-API correction

The initial discussion too quickly dismissed a browser find-related event.
`beforematch`, paired with `hidden="until-found"`, fires before a matched hidden
subtree is revealed by find-in-page or fragment navigation. It is a real
rendering/navigation hook; it does not expose the user's query or supply a
searchable content database. Content Index, Cache Storage, token search and
this reveal event serve different purposes. Token-AND search remains the
selected current implementation; this correction does not change that ruling.

## Related inquiry

- [AM round 0](/design/reactive-indexes/draft0.gpt6am.md): committed changes,
  materialized views and cross-context delivery; inspect alongside its revisions.
- [AM round 1](/design/reactive-indexes/draft1.gpt6am.md): scoped assertions,
  hybrid resolution, RDF interpretations and e2e-first sequencing.
- [Earlier architecture](/design/otel-microdata/draft0.glm53m.md): preserves the
  initial vocabulary and the history of the factory simplification.
