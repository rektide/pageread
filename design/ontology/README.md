---
type: DesignModule
title: Ontology-forward pageread
description: Entry point for the observation/provenance ontology, Oxigraph host design, and executable dataset example.
resource: /design/ontology/README.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Ontology-forward design, graph verification, and connections to observation-query tools and the virtual-blackboard architecture
  - resource: /design/blackboard/README.md
    title: Private semantic working surface integrating items, workers, and child work records
  - resource: /design/ontology/design0.gpt6a.md
    title: Proposed ontology, semantic authority, reactive views, host publication, and portable export
  - resource: /design/ontology/observations0.gpt6a.trig
    title: Fictional two-observation dataset with scoped resolution and supporting evidence
  - resource: /design/ontology/verify0.gpt6a.mjs
    title: Executable checks of documented queries and TriG/N-Quads round trips
  - resource: /design/observation-queries/README.md
    title: Extension into SOSA queries, structural microdata, identified batches, annotations, and factories
---

# Ontology-forward pageread

**Retain what a reader observed as queryable knowledge, preserve how it learned
it, and make that account portable.**

The [design proposal](./design0.gpt6a.md) connects SOSA observations and results,
PROV derivation, web content vocabulary, OTel execution, and an Oxigraph-backed
semantic store. It is a commissioned candidate; graph-native migration and
browser deployment remain decisions to prove.

## Read by concern

- [Direction and standing](./design0.gpt6a.md#1-direction-and-standing): how this
  develops the original trace-first toolkit and the later ontology discussion.
- [Vocabulary](./design0.gpt6a.md#4-a-small-application-ontology-grounded-in-existing-vocabularies)
  and [identity](./design0.gpt6a.md#5-identity-revisions-order-and-clocks): subject,
  attempt, observation, result, representation, revision, and time distinctions.
- [Graph roles](./design0.gpt6a.md#6-dataset-organization-and-semantic-authority)
  and [resolution](./design0.gpt6a.md#7-resolution-explain-what-was-selected): keep
  evidence and selected content connected, with scoped coverage and support.
- [Inflight registry](./design0.gpt6a.md#9-otel-and-the-inflight-registry): explicit
  attempt state, ownership, outcomes, and trace correlation.
- [Reactive queries and catalogs](./design0.gpt6a.md#10-reactive-queries-catalogs-and-search):
  independently named views over shared data, committed changes, and find/reveal.
- [Oxigraph hosts](./design0.gpt6a.md#11-oxigraph-hosts-and-committed-publication)
  and [portable bundles](./design0.gpt6a.md#12-portable-export-and-restoration):
  browser checkpoints, native transactions, payload closure, and restoration.
- [Reader authoring](./design0.gpt6a.md#13-reader-dsl-microdata-and-authoring)
  and [landing proofs](./design0.gpt6a.md#14-landing-sequence-and-proof-obligations):
  DSL boundaries and a sequence that earns its abstractions through use.

## Load, query, dump, reload

The [worked TriG dataset](./observations0.gpt6a.trig) has a complete baseline and
a partial newer observation of one branch. Its selected view updates one message
and retains the other. Provenance queries explain the selection.

[Verification](./verify0.gpt6a.mjs) passes with `oxigraph@0.5.12`: all 170 quads,
documented query answers, and embedded capture content survive both TriG and
N-Quads dump/reload. This exercises an expected dataset, not a production resolver.

```sh
node design/ontology/verify0.gpt6a.mjs
```

Uses the existing installation under `experiments/graphs`. The design records
[what that check establishes](./design0.gpt6a.md#worked-example-verification--2026-10-20).

## Related inquiry

- [Virtual page blackboard](../blackboard/README.md) — an integrating architecture
  over this semantic model, with private item rendering and explicit received/work
  children. It keeps source content separate from operational attachments.
- [Observation queries and annotations](../observation-queries/README.md) —
  specializes procedures/results into live-query batches and annotation tools;
  connects data shapes and executable factories with recovered DepIn-O work.
- [Design reading map](../README.md) — the preceding waves and parallel inquiry.
- [AM's resolver/RDF pass](../reactive-indexes/draft1.gpt6am.md) — scoped claims and
  document-preserving graph projection; this proposal explores a further
  graph-native authority boundary.
- [Independent toolkit design](../tabula-rasa/README.md) — a reviewed candidate
  for reader, content, index, and publication interfaces.
- [Graph experiment](../../experiments/graphs/) — an existing narrow proof of
  named-graph queries and browser-checkpoint representation.
