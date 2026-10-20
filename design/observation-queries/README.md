---
type: DesignModule
title: Observation queries and agentic annotations
description: Query procedures, structured extraction, identified batches, callable factories, and annotation-making tools.
resource: /design/observation-queries/README.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Query-as-SOSA and sensor-first authoring, annotation tools, structural batches, factory contracts, and verified example integration
  - resource: /design/observation-queries/sensor-routines0.gpt6a.md
    title: Sensor-first routines in HTML/XML, module leaves, and entry-triggered child bindings
  - resource: "opencode://ses_ea4bc04caffe3ibHrNRHIVRsJM"
    title: FX recovery of DepIn-O and local RDF dependency/code-structure precedents
  - resource: /design/observation-queries/design0.gpt6a.md
    title: Proposed query, structure, batch, annotation, and factory interfaces
  - resource: /design/observation-queries/dependencies0.gpt6a.md
    title: Source-checked DepIn-O/OOC-O/SPL findings and applicability
  - resource: /design/observation-queries/example0.gpt6a.trig
    title: Worked query/annotation/factory dataset
  - resource: /design/observation-queries/verify0.gpt6a.mjs
    title: Executed graph, selector, structure, and coordinate-conversion checks
---

# Observation queries and agentic annotations

**Define a query, find what it can observe, identify the result batch, and give
an agent tools to annotate both the content and the machinery.**

- [Sensor-first refinement](./sensor-routines0.gpt6a.md): start with a sensor as
  a query that produces values. Mint declarative routines, bind executable module
  leaves, and use entry templates to create/update independently owned children.
  Includes proposed HTML/custom-element authoring syntax and factory semantics.
- [Design](./design0.gpt6a.md): a query definition as `sosa:Procedure`, its
  evaluator as `sosa:Sensor`, each evaluation as `sosa:Observation`, and result
  batches as identified `sosa:Result`/`prov:Collection` resources.
- [Nested selectors](./design0.gpt6a.md#4-nested-and-related-selectors): Web
  Annotation selectors/refinement alongside explicit query scoping and dataflow.
- [Microdata structure](./design0.gpt6a.md#5-microdata-structure-as-inspectable-data):
  item/property occurrences, raw tokens, nested values, `itemref`, and SHACL shapes.
- [Batches](./design0.gpt6a.md#6-identified-batches-with-a-field-on-every-entry):
  a shared batch ID on every entry, inverse membership, sealing, empty results,
  ordering, and snapshot/delta semantics.
- [Annotation kit](./design0.gpt6a.md#7-the-agentic-annotation-making-kit): target
  creation, drafts, previews, publication, reanchoring, and provenance.
- [Factories](./design0.gpt6a.md#8-code-shapes-and-factories-that-take-data):
  accepted data shapes, callable contracts, exact code bindings, required services,
  lifetime-aware provisioning, and a pinned creation plan.
- [DepIn-O rediscovery](./dependencies0.gpt6a.md): FX's archive search and checked
  local source passages, including OOC-O and SPL as complementary precedents.

## Executable example

[The TriG dataset](./example0.gpt6a.trig) and [verifier](./verify0.gpt6a.mjs)
exercise 205 quads, fixture CSS selection, nested microdata ownership, an
annotation, a queryable factory declaration, and TriG/N-Quads round trips.

```sh
node design/observation-queries/verify0.gpt6a.mjs
```

Uses existing dependencies from `experiments/graphs` and `schema`. These checks
establish the [worked-example properties](./design0.gpt6a.md#10-worked-example-verification),
not a shipped live-query or factory runtime.

## Connections

- [Ontology-forward design](../ontology/README.md): the broader observation,
  provenance, resolution, and portable-dataset model extended here.
- [Tabula-rasa design](../tabula-rasa/design0.gpt6a.md): observation-session
  ownership, immutable projections, and snapshot-to-stream contracts.
- [Script-first reader host](../script-runtime/design0.gpt6a.md): installed,
  versioned code can implement these declarative procedures and factories.
- [Design reading map](../README.md): surrounding inquiry and prior alternatives.
