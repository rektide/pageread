---
type: ProjectGuide
title: Pageread
description: Inspectable page readers, OTel-shaped observations, graph experiments and publishable reader artifacts.
status: experimental
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Commissioned the page-reader architecture, coordinated experiments and connected generated-reader publication
  - resource: "/extension-build/README.md"
    title: Verified build mechanics and execution boundaries
  - resource: "/harness/README.md"
    title: Packaged Chromium capture and persistence proof
  - resource: "/experiments/graphs/README.md"
    title: Oxigraph WASM and IndexedDB checkpoint iterations
  - resource: "/experiments/publishing/README.md"
    title: Lexicon-governed reader/dataset publication experiments
  - resource: "/experiments/reader-loop/README.md"
    title: Agent request, generated artifact and inflight registry experiment
---

# pageread

Read a page into reusable knowledge. The original idea remains: unfamiliar
content can go to an agent; the agent contributes a little reader engine that
can process the next page, and readers can be shared through ATProto.

The current implementation is an **experimental toolkit with runnable proofs**.
It combines OTel-semconv-adapted trace items, conversation metadata, live DOM
queries, MIME-typed content stores, named reactive indexes and RDF projections.

## Try something

| Surface | Run | What it proves |
| --- | --- | --- |
| [Oxigraph playground](experiments/graphs/README.md) | In `experiments/graphs`: `pnpm install && pnpm dev --port 4317` | SPARQL over scoped observations; browser checkpoint/restart; RDF + exact-document export |
| [Reader loop](experiments/reader-loop/README.md) | In `experiments/reader-loop`: `pnpm install && pnpm demo` | Page evidence → MSW agent → returned JavaScript → jsdom execution → retained artifact/operation |
| [Publication](experiments/publishing/README.md) | In `experiments/publishing`: `pnpm install && pnpm smoke` | Official ATProto SDK, validated records, blob upload/write/readback through a mock PDS |
| [Packaged extension](harness/README.md) | At root: `pnpm install && pnpm test:e2e` | Browser fetch capture → extension IDB → transcript index/search → restart readback |

The graph UI is at **http://localhost:4317/** when its dev server is running.
Experiments have independent dependencies and lockfiles; root scripts do not
install or test them. [Experiment map and integration target](experiments/README.md).

## Build kit

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm test
pnpm test:e2e
```

Build before checks/tests on a fresh checkout: workspace imports resolve built
distributions. Libraries use tsdown's unbundled output. WXT preserves packaged
background/popup modules; content scripts remain IIFE bundles. Load
`extensions/fixture/.output/chrome-mv3` unpacked for manual use, then follow the
[harness instructions](harness/README.md#manual-inspection).

The typed reader interface and scoped observation ingestion are usable. This is
a **fixture extension**, not yet a live ChatGPT reader or a general extension
DSL compiler. The [build guide](extension-build/README.md) explains the files,
verified browser behavior and follow-on `userScripts` execution path.

## What is connected

- The fixture extension persists exact reader inputs with scoped coverage,
  then produces trace/metadata projections and a searchable transcript view.
- Oxigraph exports preserve named/default graph semantics while retaining
  original documents separately. Its UI demonstrates baseline/partial overlays.
- The actual graph export and generated reader artifact both round-trip through
  publication tools with exact byte verification against a mock PDS.
- The agent loop has an inspectable operation/artifact registry. Chrome
  `userScripts` registration/execution has an adapter, currently unit-tested.

Live agent transport, ChatGPT-specific capture/resolution, browser user-script
execution and authenticated network publication are not joined into one product
yet. The durable journal remains a subsequent increment. Current search is
token-AND, not literal browser find.

## Inquiry

- [First reactive-index review](design/reactive-indexes/draft0.gpt6am.md)
- [Hybrid resolver and RDF revision](design/reactive-indexes/draft1.gpt6am.md)
- [Initial architecture and preserved simplification history](design/otel-microdata/draft0.glm53m.md)
