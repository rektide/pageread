---
type: DesignAssessment
title: Adapting the current RDF work to the gap-doc wins
description: Win-by-win assessment of the ontology-forward corpus against rdf-gap0's identified RDF benefits, with the remaining adaptations and honest revisions to the gap doc.
resource: /design/tabula-rasa/rdf-adapt0.glm53m.md
status: draft
generated: { by: "model:zai-coding-plan/glm-5.3#max", at: "2026-10-20" }
extensions:
  ticket: pageread-semantics-rdf
sources:
  - resource: "opencode://ses_ea512e94affeKEPqju0qHMPIrE"
    title: Commission to assess adapting current RDF work toward the gap-doc wins
  - resource: /design/tabula-rasa/rdf-gap0.glm53m.md
    title: The wins, mismatches, and options being assessed against
  - resource: /design/ontology/design0.gpt6a.md
    title: Ontology-forward proposal: SOSA/PROV profile, named graphs, resolution, hosts, export
  - resource: /design/ontology/observations0.gpt6a.trig
    title: Worked dataset showing pr: terms, support graphs, and xsd usage in practice
  - resource: /design/ontology/README.md
    title: Verified 170-quad TriG/N-Quads round trips and module standing
  - resource: /design/observation-queries/README.md
    title: Query procedures, microdata structure with SHACL mention, batches, annotations
  - resource: /design/reactive-indexes/draft1.gpt6am.md
    title: Operator-ruled sequencing, document authority, graph projection, OTel mapping requirements
  - resource: /schema/src/vocab.ts
    title: Existing hand-maintained TS vocabulary: item types, semconv names, MIME types, URN stems
  - resource: /experiments/graphs/README.md
    title: Oxigraph WASM playground and IndexedDB checkpoint experiment status
---

# Adapting the current RDF work to the gap-doc wins

## Commission and evidence boundary

The [gap doc](./rdf-gap0.glm53m.md) identified what an RDF-shaped backbone would
buy. Since then, sibling sessions built a substantial RDF corpus: the
[ontology-forward design](../ontology/design0.gpt6a.md) with a verified TriG
dataset, [observation queries](../observation-queries/README.md) with a second
verified example, the operator-ruled
[resolver/projection revision](../reactive-indexes/draft1.gpt6am.md), and an
[Oxigraph experiment](../../experiments/graphs/README.md) that checkpoints and
restores graphs plus exact documents in a browser. This document assesses how
that work captures the gap doc's wins and what remains.

The tabula-rasa reading ban was bounded to that exercise; this assessment is a
new commission that reads the current corpus. It revises the gap doc where the
current work found better answers — promotion-style synthesis, not a defense of
either side.

## Verdict

The current work has already secured most wins, in some places more robustly
than the gap doc proposed: provenance isolation is designed around named
support graphs with verified queries, federation has working portable bundles
and an ATProto publication round-trip, and sequencing follows the operator's
capture-first ruling rather than a graph-first leap.

What remains uncaptured is precisely the **mechanical spine** the gap doc
called O1. Concretely, three artifacts do not exist yet anywhere in the corpus:

1. an **owned namespace and profile versioning policy** — `pr:` is
   `https://example.org/pageread/vocab/0#`, explicitly a placeholder that must
   not leak into published records;
2. a **single machine-readable vocabulary source** — today
   [`schema/src/vocab.ts`](../../schema/src/vocab.ts) hand-maintains item
   types, semconv names, and MIME types while the `pr:` registry lives only in
   design prose; two vocabularies are already drifting;
3. the **lossless minting rule** — dots are legal in IRI path segments, so a
   predicate IRI like `<vocab>/otel/gen_ai.request.model` preserves the semconv
   name byte-for-byte; no current document uses this, and without it every
   mapping proposal (`gen_ai.request.model` → `requestModel` or similar) is
   lossy and reversible only by table lookup.

Everything else is adaptation of details, not architecture.

## Win-by-win

| Win (gap doc) | Status in current work | Remaining adaptation |
| --- | --- | --- |
| Lossless naming spine | Required twice — [ontology §4.3](../ontology/design0.gpt6a.md) and [draft1's OTel section](../reactive-indexes/draft1.gpt6am.md) — with the right shape (direct predicates for known fields + typed key/value nodes for unknowns, original key and semconv version retained). Not built; `vocab.ts` still mints invented `https://opentelemetry.io/semconv/*` item types and `itemTypeMatches()` heuristics that must never become RDF term equality. | Build the vocabulary source + generators (gap doc O1). Use the dots-legal path minting rule so IRIs are reversible by construction; emit the dot-free microdata profile, the TS constants, and the pinned-semconv mapping from one place. Decide the namespace first. |
| Free serializations | TriG chosen and round-trip verified (170 and 205 quads, dump/reload, emoji/datatypes); N-Quads for interchange; JSON-LD explicitly deferred as "another possible exposure". | Keep TriG/N-Quads for whole-dataset bundles. Generate a JSON-LD `@context` for **entity-level** exposures: `application/ld+json` store representations, the hosted microdata-ified viewer (ticket `pageread-reader-microdata-host`), ATProto record payloads. Declare `@list`/`@set` container rules per field per draft1's array caveats. |
| Typed values | Good bones: `xsd:dateTime` literals in fixtures, the never-through-JS-number rule for nanosecond integers, datatype preservation called out on import. | Add the datatype/container table binding OTel primitives (bool/int/double/string arrays) ↔ XSD ↔ microdata lexical forms, as part of the same vocabulary source. Microdata conversion upgrades typed literals per the W3C Note algorithm. |
| Statement-level provenance | **Secured differently and well.** Support graphs + reification-style selection nodes (`rdf:subject/predicate/object` + `prov:wasDerivedFrom`) instead of RDF 1.2 triple terms, deliberately avoiding host-compat risk; provenance queries verified end-to-end. | Keep it. Revise the gap doc's acceptance wording: evidence isolation means support-graphs **or** triple terms, not triple terms specifically. Revisit only if a future host makes triple terms materially better. |
| Validation | Profile constraints specified narratively ([ontology §4.4](../ontology/design0.gpt6a.md#44-profile-validation-makes-the-vocabulary-usable)) with fixtures as the oracle; SHACL named in observation-queries but no shapes artifact; "machine-readable shape document" deliberately deferred until terms stabilize. | Emit SHACL from the same vocabulary source as a conformance artifact once the first fixture terms stabilize; fixtures stay primary. Choose an engine (oxigraph does not evaluate SHACL; a JS engine or CLI would be a new dependency — decide when it earns its place). |
| Federation | Strongest area. `urn:pageread:*` stability ruled in draft1; portable export bundles with manifest + blobs + definitions; dataset and reader artifacts round-trip through ATProto publication (mock PDS); schema.org `Conversation`/`Message` already in the fixtures — independent convergence with the gap doc's suggestion. | The only blocker is the placeholder namespace and missing profile version. Nothing structural. |

## How this slots into the ruled sequencing

The operator's ruling (draft1) — prove capture and persistence, keep documents
authoritative, project graphs, promote authority only if proofs warrant —
already matches the gap doc's O1 → O2 ordering. The ontology landing sequence
(§14) makes RDF a labeled projection at step 2 and graph-native later.

The one insertion this assessment recommends: **land the vocabulary source and
namespace decision before interpretation parity** (ontology step 2), because
parity compares `vocab.ts`-shaped items against graph mappings — if both sides
are generated from one source by then, parity tests a pipeline instead of
arbitrating between two hand-maintained vocabularies. The gap doc's O2
(ld+json representations + round-trip conformance) folds into ontology step 5
and the hosting ticket. A standalone O3 is superseded: the ontology's
graph-native destination already carries the safety rails (one writer boundary,
projection-first, controlled graph writes) that a naive RDF-native rewrite
would have needed to invent.

## Concrete next actions

Ordered by dependency; no time estimates.

1. **Namespace + profile versioning decision** (human choice). Blocks all
   minting. Candidate shape: one owned HTTPS vocabulary IRI with version path
   segments and `/otel/…` preserving semconv names verbatim.
2. **Vocabulary source + generators** (ticket O1): emits `pr:`-style class and
   predicate IRIs, the dot-free microdata profile, TS constants superseding
   the hand-maintained lists in `vocab.ts`, and the pinned-semconv mapping
   with original keys retained.
3. **Microdata ↔ RDF conversion fixtures, both directions**, targeting the
   W3C Microdata-to-RDF Note algorithm: graph → microdata feeds the hosting
   ticket's microdata-ified tree; page microdata → graph feeds interpretation
   parity. Draft1's warning stands — the current extractor is a subset and
   must earn conformance via fixtures, not assertion.
4. **JSON-LD context + entity-level `application/ld+json` representation**
   with declared container rules; round-trip digest checks.
5. **SHACL emission** from the same source, engine chosen when needed.
6. **Datatype/container table** as part of 2, exercised by 3 and 4.

## Honest revisions to the gap doc

Recorded here rather than editing history: the triple-terms acceptance item
becomes support-graphs-or-triple-terms; O3 as a standalone option is
superseded by the ontology's better-railed graph-native destination; the
"no official RDF rendering of semconv" observation still stands; the
schema.org reuse suggestion was independently adopted by the sibling corpus
before this assessment.

Ticket `pageread-semantics-rdf` carries these revised acceptance criteria and
next actions in its notes.
