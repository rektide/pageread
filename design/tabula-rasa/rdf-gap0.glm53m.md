---
type: ProblemStatement
title: The RDF gap in pageread's semantic layer
description: Why the bespoke microdata/OTel vocabulary in design0 needs an RDF-shaped backbone, the precise mismatches, and graduated options from generated mappings to RDF-native storage.
resource: /design/tabula-rasa/rdf-gap0.glm53m.md
status: draft
generated: { by: "model:zai-coding-plan/glm-5.3#max", at: "2026-10-20" }
extensions:
  ticket: pageread-semantics-rdf
  related: /design/tabula-rasa/design0.gpt6a.md
sources:
  - resource: "opencode://ses_ea512e94affeKEPqju0qHMPIrE"
    title: User commission to write up and ticket the RDF-interop gap in the proposed semantic layer
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Proposed vocabulary, microdata constraints, and OTel mapping as currently drafted
  - resource: /design/tabula-rasa/research0-content.gpt61s.md
    title: Microdata naming restrictions and OTel semconv status from independent research
  - resource: /design/tabula-rasa/brief0.gpt6a.md
    title: User-grounded requirements the semantic layer must preserve
  - resource: "https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute"
    title: Microdata property-name restrictions
  - resource: "https://www.w3.org/TR/microdata-rdf/"
    title: Microdata to RDF (Second Edition) W3C Note, verified 2026-10-20
  - resource: "https://www.w3.org/TR/rdf12-concepts/"
    title: RDF 1.2 Concepts and Abstract Data Model (triple terms), verified 2026-10-20
  - resource: "https://www.w3.org/TR/json-ld11/"
    title: JSON-LD 1.1 syntax and contexts
  - resource: "https://www.w3.org/TR/prov-o/"
    title: PROV-O provenance ontology
  - resource: "https://schema.org/Message"
    title: schema.org Message type, verified present 2026-10-20
  - resource: "https://schema.org/Conversation"
    title: schema.org Conversation type, verified present 2026-10-20
  - resource: "https://github.com/open-telemetry/semantic-conventions-genai/tree/547934afa90a34298441caf80c43b27255c3a292"
    title: Pinned developmental GenAI conventions registry used by the design
---

# The RDF gap in pageread's semantic layer

## Situation

The [independent design](./design0.gpt6a.md) commits (§5) to an application-owned
microdata vocabulary with dot-free property names, an explicit hand-maintained
mapping to OTel semantic conventions, `SemanticValue` literals with optional
datatype URIs, and resource URIs for identity. Each of those moves is correct in
isolation. Together they hand-roll, as bespoke prose, four problems the RDF
ecosystem solved long ago: **naming, typing, identity, and provenance**. Nothing
mechanically links the microdata profile, the OTel mapping table, and the
internal item model, so none of the standard machinery — JSON-LD contexts, typed
literals, triple-term annotation, SHACL shapes — can help while the vocabulary
stays hand-authored.

This document states the problem precisely and lays out graduated responses.
It extends design0 §5; it does not reopen the user-chosen requirements
(microdata as DOM encoding, OTel vocabulary adaptation) or the
content-versus-telemetry separation.

## What RDF-shape would buy pageread concretely

- **Lossless naming spine.** Predicate IRIs can preserve OTel names verbatim
  (below), so the semconv mapping becomes mechanical and reversible instead of
  a hand-maintained table that drifts.
- **Free serializations.** JSON-LD 1.1 gives a `application/ld+json`
  representation for the content store with a generated `@context`, and RDFa
  remains an alternative full-RDF DOM carrier if ever needed.
- **Typed values.** XSD-typed literals bind microdata lexical forms, OTel
  primitive types, and our `SemanticValue.datatype` into one discipline.
- **Statement-level provenance.** RDF 1.2 triple terms (and PROV-O) express
  evidence, observation-vs-occurrence, and confidence without polluting the
  base graph — exactly the evidence layer design0 §4 sketches informally.
- **Validation and queries.** SHACL/ShEx shapes can replace ad-hoc profile
  validators; graph queries over transcripts become possible for consumers
  that want them.
- **Federation.** IRIs for resources, traces, and spans make index entries and
  captures linkable across stores and with personal knowledge graphs; reusing
  schema.org `Message`/`Conversation` as optional supertypes aids interop.

## The precise mismatches

| Dimension | Microdata (HTML §5.2.3) | OTel semconv | RDF | Consequence today |
| --- | --- | --- | --- | --- |
| Naming | Short tokens; `.` and `:` forbidden in non-URL names | Dot-namespaced strings (`gen_ai.request.model`) | Predicate IRIs; dots legal in path segments | Mapping is lossy into microdata and currently manual in both directions |
| Values | Element-dependent string extraction | Typed primitives incl. arrays | Typed literals (XSD) | No shared datatype discipline binds the three layers |
| Identity | Optional `itemid` | Opaque hex trace/span IDs | IRIs; `owl:sameAs` as explicit claim | Resource IRIs exist in the design but span/trace IRIs are unspecified |
| Relations | Nested items + `itemref` | Parent/links via hex IDs | Triples; graphs | Conversation graph and trace DAG both need first-class predicates |
| Provenance | None | `Timestamp` vs `ObservedTimestamp` distinction | PROV-O; RDF 1.2 triple terms | Observation/evidence records have no standard rendering |
| Validation | Registry-based algorithm (W3C Note) | Registry YAML, no RDF rendering | SHACL/ShEx | We hand-roll validators with no cross-check |

**Key mechanical fact.** IRI path segments may contain dots (RFC 3987 path
characters include `.`), so a predicate IRI such as
`https://<vocab>/otel/gen_ai.request.model` preserves the semconv name
byte-for-byte and reversibly. The HTML dot restriction binds only microdata's
short property names. Therefore RDF can be the **lossless spine**; microdata
remains the **constrained HTML projection** (dot-free names generated from the
same source); and the OTel mapping table stops being authored and starts being
**generated**.

## Prior art (verified 2026-10-20 unless noted)

- [Microdata to RDF, Second Edition](https://www.w3.org/TR/microdata-rdf/)
  (W3C Note): registry-based conversion — `itemid` → subject, `itemtype` →
  `rdf:type`, `itemprop` → predicate IRIs via registry, typed literal upgrade.
  Exactly the shape our generator needs, with our vocabulary as the registry.
- [RDF 1.2 Concepts](https://www.w3.org/TR/rdf12-concepts/): triple terms for
  annotating individual statements.
- [JSON-LD 1.1](https://www.w3.org/TR/json-ld11/) and PROV-O: serialization and
  provenance layers.
- schema.org: both [`Message`](https://schema.org/Message) and
  [`Conversation`](https://schema.org/Conversation) exist (verification
  corrected an initial suspicion that Conversation did not) — candidates for
  optional supertypes, not requirements.
- OTel [GenAI semconv](https://github.com/open-telemetry/semantic-conventions-genai/tree/547934afa90a34298441caf80c43b27255c3a292)
  (Development status): published as YAML/markdown registry; **no official
  RDF/OWL rendering found** at research time (negative observation, not proof).
  Community OTel↔RDF prior art: unsearched — check before minting predicates.

## Concurrent work in this repository

Sibling sessions committed adjacent work while this write-up was prepared:
`3dfd9c38` (runnable reader publication), `ad9b79e4` (`design/ontology/` with a
worked-example verifier; 170-quad TriG/N-Quads round trips under oxigraph
0.5.12), `bf0b0faf` (`design/script-runtime/`; the operator's script-first
recentering), and `60cd66e0` (`design/observation-queries/`; SOSA queries,
structural microdata, annotation tools, with factory dependency terms held open
while FX recovers a remembered RDF dependency precedent). Only commit messages
and path summaries were read; contents were not consulted.

Consequences: parts of O2/O3 are already exercised experimentally, and
`design/ontology/` owns an evolving ontology design. Treat this document as the
problem statement and coordination point, not a green field. Any implementation
reconciles with those modules — especially their vocabulary decisions — before
minting IRIs, contexts, or generator sources.

## Options

**O1 — Single vocabulary source + generators (no runtime RDF).** Define the
vocabulary once as a machine-readable source; generate (a) the microdata
profile with dot-free names, (b) a JSON-LD `@context`, (c) the semconv↔IRI
mapping (lossless via dotted path segments), (d) TS types/validators. This is
design0 §5's mapping table, formalized. Cheapest; makes the layer
RDF-compatible by construction.

**O2 — `application/ld+json` as a first-class representation.** Content store
accepts/serves linked-data representations of semantic items; conformance tests
round-trip item ↔ JSON-LD ↔ parsed triple set with a stable digest. Optional
schema.org supertypes. Interop surface without internal redesign.

**O3 — RDF-native internals.** Quads as the retained model, SPARQL-ish index
queries, SHACL validation, PROV-O wiring, per-signal quads for imported
telemetry. Maximal interop; highest cost; risks churning the just-reviewed
contracts. Defer with explicit triggers (cross-store federation demand, SPARQL
consumers, provenance-query need).

**Non-goals either way:** replacing microdata as the DOM encoding; OWL
reasoning; reopening content-vs-telemetry separation (design0 §5 stands).

**Recommendation:** O1 now, O2 next, O3 on triggers.

## Acceptance sketch (ticket)

- Name round-trip: every attribute of a pinned semconv registry snapshot maps
  name → IRI → name identically; microdata short-name collisions fail at build.
- Representation stability: item ↔ `SemanticItem` ↔ JSON-LD ↔ parsed triples
  yields a stable digest across re-encoding and re-parsing.
- Type preservation: OTel bool/int/double/arrays ↔ XSD typed literals in both
  directions without silent stringification.
- Evidence isolation: provenance renders as triple terms/quads; base-graph
  digest unchanged by adding evidence.
- Single source: one vocabulary edit propagates to microdata profile, context,
  mapping, and types; CI fails on drift.

## Open questions

- Owned vocabulary IRI and versioning policy (already outstanding in design0 §14).
- IRI scheme for traces/spans (`urn:otel:trace:<hex>`? collisions with our URNs?).
- Message parts as blank nodes vs IRIs.
- Array and union attribute encodings in all three layers.
- RDF 1.2 tooling availability vs legacy RDF-star syntaxes for evidence.
- Whether imported OTel telemetry should also export as quads per signal.
- Where the vocabulary source lives (repo file, generated registry, both).

Ticket: `pageread-semantics-rdf` (see `.beads/issues.jsonl`).
