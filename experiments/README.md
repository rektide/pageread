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

| Experiment | Question | State at commissioning |
| --- | --- | --- |
| [Reader loop](reader-loop/README.md) | Can a page request produce a retained executable reader with inspectable inflight state? | Runnable MSW/jsdom proof; Chrome adapter unit-tested |
| `graphs/` | How do browser Oxigraph, persistence and observation graphs compose? | AM building visible/queryable iterations |
| `publishing/` | How can scripts and RDF datasets be published as lexicon-governed records? | AM building validated records and mock-PDS round trips |

The extension build proof lives outside this experiment subtree, under
`extension-kit/`, `extension-build/`, `extensions/` and `harness/`. Its AM session
owns the root build machinery. At dispatch, the previous core had passing unit
tests but failing typechecks, and no built WXT extension. A test count alone is
not evidence that an extension can load.

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

The experiments exercise individual seams, not this whole sequence yet.
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
