---
type: DesignProposal
title: "Queries as observations, structures as data, annotations as tools"
description: SOSA query procedures, composable selectors, microdata occurrence structure, identified result batches, and data-driven processor/annotation factories.
resource: /design/observation-queries/design0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Human direction for SOSA query selectors, structural microdata, identified result sets, agentic annotation tools, and discoverable data-consuming factories
  - resource: /design/ontology/design0.gpt6a.md
    title: Observation/activity/result identities, provenance, graph storage, and portable evidence
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Shared observation ownership, immutable extraction, stream continuity, and reader authoring contracts
  - resource: /design/script-runtime/design0.gpt6a.md
    title: Script-first reader host and explicit installation/runtime boundaries
  - resource: https://www.w3.org/TR/2017/REC-vocab-ssn-20171019/
    title: SOSA procedures, software sensors, observations, results, and features of interest
  - resource: https://www.w3.org/TR/2017/REC-annotation-model-20170223/
    title: Selectors, refinement, target states, Unicode text positions, bodies, and annotations
  - resource: https://www.w3.org/TR/2017/REC-annotation-vocab-20170223/
    title: oa:ResourceSelection, CssSelector, refinedBy, and RDF predicate names
  - resource: https://www.w3.org/TR/2014/NOTE-microdata-rdf-20141216/
    title: Historical Microdata-to-RDF mapping note and distinctions lost by direct triple conversion
  - resource: https://www.w3.org/ns/md
    title: Existing microdata namespace endpoint is a vocabulary registry, not the proposed occurrence ontology
  - resource: https://github.com/w3c/data-shapes/blob/4f88f8c5398a87f7957260593f1f0742b5924a65/shacl/shacl.ttl
    title: Node/property shapes, property paths, cardinalities, and datatype vocabulary
  - resource: https://www.w3.org/1999/02/22-rdf-syntax-ns
    title: RDF properties, statements, lists, and container vocabulary
  - resource: https://www.w3.org/2002/07/owl
    title: Object/datatype properties, inverse relations, and distinction from symmetric relations
  - resource: https://www.w3.org/2004/02/skos/core
    title: Concept schemes and semantic relations, distinct from data-field structure
  - resource: https://w3id.org/function/spec/20230512/
    title: Unofficial FnO specification for functions, parameters, outputs, implementations, mappings, and executions
  - resource: "opencode://ses_ea4bc04caffe3ibHrNRHIVRsJM"
    title: FX rediscovery of DepIn-O, OOC-O, SPL, and software-process dependency precedents
  - resource: file:///home/rektide/archive/doc/onto/depin-o.ttl
    title: Local draft translation of Dependency Injection Ontology, including implementation selection and scopes
  - resource: file:///home/rektide/archive/doc/onto/ooc.ttl
    title: Local draft Object-Oriented Code Ontology translation for code constructs, methods, variables, and types
  - resource: /design/observation-queries/dependencies0.gpt6a.md
    title: Verified archive findings, source standing, and proposed factory-binding interpretation
  - resource: /design/observation-queries/example0.gpt6a.trig
    title: Fictional query, batch, microdata occurrence, annotation, and factory declaration dataset
  - resource: /design/observation-queries/verify0.gpt6a.mjs
    title: Executed graph round trips, fixture CSS matches, and annotation offset checks
---

# Queries as observations, structures as data, annotations as tools

[Module map](./README.md) · [Dependency precedents](./dependencies0.gpt6a.md)

## 1. The idea to preserve

**A query selector is part of an observation procedure. Running it finds something
out. Its results deserve identities, structure, provenance, and useful tools.**

The human asks for nested/related selectors; a vocabulary describing microdata's
own items, properties, and nesting; identified batches with a batch ID on each
entry; and an agentic annotation kit. The further direction is to identify the
code and factories that accept these data structures and turn them into working
processors. This proposal joins those requests at explicit boundaries.

The current product direction is [one host running discoverable reader scripts](../script-runtime/design0.gpt6a.md).
Query definitions, structural profiles, and annotation recipes are data that
installed implementations can consume. They can also be inspected, annotated,
exported, and used by an authoring agent. This is a design, not a claim that a
general selector executor or annotation tool service is already installed.

## 2. Querying in SOSA terms

| Thing | Representation |
| --- | --- |
| Reusable query definition | A versioned `sosa:Procedure`: selector/plan, extraction profile, ordering, identity policy, and declared inputs |
| Running query evaluator | A software `sosa:Sensor`, hosted by a reading session/runtime |
| One actual evaluation | A `sosa:Observation`, linked to the procedure and sensor |
| What it examines | `sosa:hasFeatureOfInterest`: the page/root or other subject; `prov:used` identifies the exact captured representation/state |
| What it determines | `sosa:observedProperty`: e.g. matching message occurrences and their projected fields under this query |
| Result of that evaluation | An identified `sosa:Result`; for a batch, also a `prov:Collection` |
| One result occurrence | A batch-local entry referring to the stable subject, observed revision, source anchor, and extraction evidence |

The observable property is the query-conditioned membership/projection being
determined, not the CSS text itself. The definition contains the CSS selector;
the procedure specifies how it is interpreted. One shared runtime can execute
many procedures; its identity is not the selector's identity.

A live query owns a succession of evaluations. Each actual evaluation has its
own observation identity even if it finds equal values. A state subscription may
coalesce unchanged results; an observation feed may preserve repeated attempts.
Declare which behavior an output provides. Replaying delivery reuses identities;
actually evaluating again creates a new observation.

Nested evaluations record the exact parent observation/batch/entry that supplied
their input. This lets an agent ask why a child query ran and what state it saw,
without pretending every live child across several realms shares one atomic DOM
snapshot. Source epochs and per-input revisions remain part of the result.

## 3. Existing vocabularies and the jobs they do

| Vocabulary | Useful role here |
| --- | --- |
| Web Annotation (`oa:`) | Existing `CssSelector`, `XPathSelector`, `TextQuoteSelector`, `TextPositionSelector`, `RangeSelector`, `refinedBy`, and source/state selection |
| RDF/RDFS | Named classes and properties; `rdf:type`, `rdf:Property`, `rdfs:subClassOf`, `rdfs:subPropertyOf`, labels and definitions |
| OWL | Object versus datatype properties, explicit inverses and justified equivalences |
| SHACL (`sh:`) | Node/property shapes, nested value shapes, property paths, counts, datatypes, and validation contracts |
| SKOS | Concept/tag vocabularies and broader/narrower/related discovery categories |
| SOSA + PROV | Procedures, observations, outputs, execution, and derivation |
| FnO | Implementation-independent callable descriptions and bindings to concrete implementations; an unofficial specification |
| DepIn-O / OOC-O | Dependencies, injection/selection/lifetimes, and code declarations; local provisional translations require an explicit adaptation for functional factories |

For “objects with fields/properties and nested structure,” **RDFS/OWL plus SHACL**
is the useful combination. SKOS can organize categories of readers, selectors,
annotation purposes, or problems. `skos:broader` is not a DOM parent, a field path,
or a promise that one query's results contain another's.

RDFS domain/range and OWL restrictions have inference semantics. Required fields
and acceptable input records belong in validation shapes. Declaring an inverse
does not make Oxigraph automatically materialize it; query the inverse path or
run an explicitly selected inference step.

## 4. Nested and related selectors

Web Annotation's `oa:ResourceSelection` is specifically offered for applications
beyond annotation. It binds a source to selector/state descriptions. An annotation
target can use the richer `oa:SpecificResource` subclass.

Use identified selector descriptions, rather than anonymous strings throughout:

```turtle
@prefix oa: <http://www.w3.org/ns/oa#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix ex: <urn:pageread:selection-example:> .

ex:messageSelector a oa:CssSelector ;
    rdf:value "article[data-message-id='m1']" ;
    oa:refinedBy ex:phraseSelector .
ex:phraseSelector a oa:TextQuoteSelector ;
    oa:exact "a useful claim" .
ex:target a oa:SpecificResource ;
    oa:hasSource ex:pageSnapshot1 ;
    oa:hasSelector ex:messageSelector .
```

The source is an exact retained representation, resolvable through the host's
content interface. A live page URL can also be retained for navigation.

Several different structures need distinct relations:

| Structure | Meaning |
| --- | --- |
| Selector refinement | Apply a selector to the segment selected by the preceding selector (`oa:refinedBy`) |
| Query scoping | For each parent entry, evaluate a child procedure with that entry as its root/binding |
| Query dataflow | Feed a named output/field into another procedure's named input |
| DOM containment | One element is physically below another in a particular DOM snapshot |
| Item/property structure | A semantic item has a property whose value may itself be an item |
| Concept hierarchy | A discovery category is broader/narrower than another |

Important Web Annotation semantics: **several `refinedBy` values are alternative
descriptions of the same selection**, not an implicit union or a chain of steps.
Use one chain for sequential refinement. General for-each, union, intersection,
join, fallback, and field-binding operations need explicit query-plan terms and
execution rules. Do not repurpose annotation refinement to hide a query language.

An initial plan can be a small DAG of named steps: select, scoped-select, project,
and emit. Each step refers to a standard selector or a registered procedure.
Keep CSS syntax as a literal first; a CSS AST can be a separate representation
when structural editing actually needs it. Definition nesting does not require
inventing an ontology for every CSS grammar production.

## 5. Microdata structure as inspectable data

Microdata supplies a generic item/property encoding; schema.org or another
vocabulary supplies domain meanings. We also want to describe **the encoding
occurrences themselves**, so an agent can understand and improve extraction.

The historical *Microdata to RDF* Interest Group Note is a useful mapping
precedent, not a current W3C Recommendation or an installed lossless occurrence
ontology. The inspected `http://www.w3.org/ns/md` endpoint supplies a vocabulary
registry. We should publish our additional structure under an owned namespace.

Proposed occurrence model (`pr:` terms are illustrative, as in the ontology draft):

| Record | Fields / relationships |
| --- | --- |
| `MicrodataItemOccurrence` | Source snapshot/node, raw/resolved `itemid`, itemtype tokens, denoted subject if established, property occurrences |
| `PropertyOccurrence` | Owning item occurrence, original itemprop token, expanded predicate when known, position, source element/selector, extraction rule, literal or item-valued result |
| `PropertyBinding` | Profile-level mapping from an itemprop name to an RDF predicate and value shape/codec |
| `SourceNode` | Snapshot/epoch-local element identity and physical DOM relationships |
| `ReferenceTraversal` | An `itemref` traversal associating an external source element with an item's properties |

This enables questions such as “which element and mapping supplied this field?”,
“which properties have nested item values?”, and “which unknown itemprop names
could a new reader understand?”

`itemscope` starts an item occurrence; `itemtype` describes its asserted types;
`itemid` supplies a candidate subject identity; each token in `itemprop` names a
property; `itemref` contributes properties outside the physical subtree. Keep
raw tokens and resolution context so a mapping can be revised later.

Physical DOM ancestry and semantic ownership can differ. An `itemref` may reach
outside the subtree, and a nested itemscope starts a new ownership boundary.
One source element may contribute properties to multiple owners. Represent the
association as an occurrence, not as a universal single parent edge on the DOM
element. Follow HTML's extraction/visited-node rules; avoid recursive cycles.

Repeated equal values remain separate occurrences with positions. An RDF triple
projection may deliberately collapse equal statements, but the occurrence layer
retains how many fields appeared, their order, and their sources. Ordered shape
presentation (`sh:order`) is distinct from the order of captured values.

An example nested field contract is:

```turtle
@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix schema: <https://schema.org/> .
@prefix ex: <urn:pageread:selection-example:> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

ex:MessageShape a sh:NodeShape ;
    sh:property ex:authorField .
ex:authorField a sh:PropertyShape ;
    sh:path schema:author ; sh:node ex:AuthorShape .
ex:AuthorShape a sh:NodeShape ;
    sh:property ex:nameField .
ex:nameField a sh:PropertyShape ;
    sh:path schema:name ; sh:datatype xsd:string ; sh:minCount 1 .
```

The shapes describe selected semantic data. A separate binding points from
`itemprop="author"` to `schema:author`; a SHACL path itself does not execute CSS
or the microdata extraction algorithm.

## 6. Identified batches with a field on every entry

The proposed event shape follows the human's suggestion directly:

```json
{
  "kind": "entry",
  "id": "urn:pageread:entry:batch-42:0",
  "batch": "urn:pageread:batch:42",
  "entity": "urn:pageread:message:account-a:c1:m1",
  "revision": "message-revision-7",
  "position": 0
}
```

Every entry repeats the batch ID. Query/observation/source metadata can be read
from the identified batch header. A receiver can group records by that field,
and a graph query can recover the set without a parent object containing a large
array. The stable entity remains distinct from its occurrence in this batch.

For RDF, `entry pr:inBatch batch` is sufficient. A named batch is a
`sosa:Result`/`prov:Collection`, generated by the observation. A convenient
`pr:hasEntry` inverse can be declared, or queried using `^pr:inBatch`.

This is **shared membership**, not an OWL symmetric relation. Declaring
`inBatch` symmetric would incorrectly imply that the batch belongs to the entry.
If we publish both directions, they are inverses. `pr:hasEntry` may be a
subproperty of `prov:hadMember`; the more specific entry/batch inverse should not
reclassify every PROV collection as a query batch.

The first profile gives each batch-local entry one batch. The same message can
appear in many batches through different entries. Transport retransmission
keeps the entry ID; a new observed occurrence receives a new one. Position is
optional for a genuinely unordered result; it is explicit for DOM-ordered output.

### Batch boundaries and empty results

The membership field alone cannot communicate an empty batch or prove completion.
Use a small lifecycle around the entry records:

```text
begin(batch, observation, queryVersion, sourceRevision, kind=snapshot)
entry(id, batch, entity, revision, position, ...)
entry(id, batch, entity, revision, position, ...)
seal(batch, distinctEntryCount, coverage, cursor)
```

Only one terminal `seal` or `abort` is valid for a batch. Receivers stage entries,
deduplicate by entry ID, and publish the snapshot after the declared distinct
count and terminal record agree. A sealed count of zero is a real empty result.
A lost source/aborted scan is not an empty set. RDF's open-world semantics do not
make the batch closed; the sealed-batch application contract establishes closure.

Separate transport completeness (all entries received) from source coverage
(which roots/subjects were inspected). A fully delivered DOM batch can still
cover only mounted messages. Multi-root batches name an input revision vector
unless the host actually provides one shared boundary.

A delta batch is tagged `kind=delta`, names its base cursor, and carries explicit
upsert/delete operations. Absence from a delta never removes membership. Immutable
snapshot batches and transitions between them are related artifacts with distinct
identities. The [tabula-rasa watch contract](../tabula-rasa/design0.gpt6a.md#7-state-views-and-event-feeds)
supplies the handoff, base validation, redelivery, and reset rules.

## 7. The agentic annotation-making kit

An annotation joins a body to a target, with purpose and provenance. Useful targets
include a selected page segment, a semantic message, a property occurrence, a
whole query batch, a query definition, a shape, or a processor artifact. Agents
can annotate the mechanisms they use as well as the content those mechanisms find.

Proposed callable tools:

| Operation | Produces |
| --- | --- |
| `selectors.create/refine/describe` | Identified standard selector descriptions and explicit composition |
| `queries.walk/live/inspect` | Observation/result batches and their supported source capabilities |
| `structure.inspect` | Item/property occurrence graph, nesting, profile bindings, and source anchors |
| `targets.fromEntry` | Exact target representation plus selector/state, derived from a batch entry |
| `annotations.draft` | Body + target(s) + motivation + author/generator provenance |
| `annotations.preview/validate` | Matched excerpt, structural checks, ambiguity, missing target, and mapping diagnostics |
| `annotations.publish` | Committed annotation and receipt through the host's ordinary publication boundary |
| `annotations.reanchor` | A proposed new target binding and evidence of the relocation; preserve the original target |
| `annotations.list/watch/export` | Searchable/followable collections and standard RDF/JSON-LD exposures |

A representative loop is: live-query messages → inspect one result's nested
fields → refine to a phrase → attach a comment/classification/structured claim →
publish → watch the annotation collection. No compulsory human approval step is
implied; the same tools support interactive and autonomous authoring.

Use `oa:Annotation`, `oa:hasTarget`, `oa:hasBody`, `oa:motivatedBy`, and
`oa:SpecificResource` with `oa:hasSource`/`oa:hasSelector`. A structured body can
refer to a retained claim graph. The annotation's provenance identifies the
authoring activity and supporting observation; it does not automatically turn an
agent's claim into an upstream page fact.

### Stable targets and portable offsets

Pin the target representation when an annotation concerns exact observed text.
Retain a live source route separately. A live tracking policy can request
reanchoring, but a new match must not silently rewrite what was originally
annotated. Several quote matches produce ambiguity/candidates, not a fabricated
unique target. Missing source bodies and missing matches are different outcomes.

Web Annotation text selectors use **Unicode code points in normalized text**.
The earlier ontology proposal's browser-facing search offsets use UTF-16 code
units. These are different coordinate systems: adapters must convert and record
the normalization/text-extraction profile. Include emoji and combining characters
in fixtures. CSS-to-text refinement must specify which extracted text stream the
quote/position applies to; a DOM Range offset cannot simply be copied into
`oa:start`/`oa:end`.

## 8. Code, shapes, and factories that take data

The desired question is concrete: **given this query definition, input shape,
and available runtime, which implementation can accept it and what will it
produce?** The graph should describe that relationship, not just name a module.

Separate these identities:

1. **Callable contract:** input/output ports, shapes, media types, effect and
   lifecycle semantics. FnO's Function/Parameter/Output terms fit this role.
2. **Implementation artifact:** exact code/package identity, version/digest,
   entrypoint, runtime profile, and its declared supported contracts.
3. **Binding:** how named inputs and outputs map to an implementation's arguments,
   return values, events, or remote operation.
4. **Factory invocation:** configuration data + explicitly supplied services →
   a bound processor/sensor or live query handle with lifecycle ownership.
5. **Processing invocation:** a finite input/snapshot → result; a long-lived
   sensor may perform many of these observations.

FnO describes implementation-independent functions, concrete implementations and
mappings, executions, and experimental composition. It is an **unofficial draft**,
not a W3C Recommendation or an executor. Its descriptions can be useful even if
we implement a small registered dispatch table initially. SHACL describes data
shapes; the host still checks actual data and runtime capability compatibility.

Shape identity gives an exact declared match. Different shapes require an
explicit adapter or a justified compatibility relation; matching names or merely
having an RDF type is not a general proof that code accepts a value. Separate
description from verified conformance. Factory configuration is data; created
DOM handles, subscriptions, and cancellation controllers are runtime resources
whose portable records describe their ownership rather than serialize them.

### The recovered dependency precedent: DepIn-O

FX found **DepIn-O**, the Dependency Injection Ontology, and its companion
**OOC-O**, the Object-Oriented Code Ontology. The
[research account](./dependencies0.gpt6a.md) records exact archive paths and
source limitations. DepIn-O models dependency consumers, injection points,
abstract dependencies, selected implementations, qualifier keys, decorators,
and scopes. OOC-O describes code classes, methods, fields, and their types.

This is the missing complementary perspective: a factory has **data arguments**
and **provisioned services**, and its output may itself be a provider. FnO/shapes
describe the data-facing contract; DepIn-O informs the service-binding plan.

The local DepIn-O `Consumer` and `Dependency` are OOC-O code classes, and its
implementation relation is framed through inheritance. A free JavaScript factory
is not automatically an instance of those class-oriented concepts. Use direct
terms for genuine OO code mappings; for our language-neutral runtime, publish
an explicitly DepIn-inspired profile such as `FactoryDefinition`,
`DependencyRequirement`, `ProviderBinding`, and `LifetimeScope`. Record the
correspondence without asserting an unjustified `owl:equivalentClass`.

Example factory declaration, expressed informally:

```text
makeLiveQuery
  accepts: QueryDefinitionShape / application/json
  provides: bound query sensor + disposable LiveQuery handle
  needs:
    router: DOMMutationRouter, shared within this realm/root scope
    selectorEngine: CssSelector evaluator, compatible declared syntax/profile
    identityMap: source-node identities for this document epoch
  implementation: exact artifact revision + export binding
  lifetime: query-owner lease; final release returns shared service leases
```

The router can therefore be shared across several factories/queries through
the declared scope—the ontology gives our original event-router requirement a
provisioning description. Scope is a runtime identity, not the word `singleton`
standing for the entire browser. A request scope in a DI framework and one SOSA
observation are only analogous until an explicit lifecycle mapping establishes
their relationship.

The proposed tools are `processors.find`, `processors.describe`,
`factories.plan`, `factories.create`, and `instances.dispose`. Planning returns
selected artifact/implementation IDs, named data bindings, dependency providers,
lifetime owners, and unresolved requirements. Creation consumes that pinned plan;
it does not silently switch providers as the registry changes. A code reference
has a resolver/runtime adapter, consistent with the script-installation model.

Composition connects a named output to a named input when their declared profiles
match or an explicit adapter bridges them. Initial resolution uses exact contract
identity and explicit provider selection, reports ambiguity/missing requirements,
and rejects unsupported dependency cycles. General shape subsumption, OWL-based
program synthesis, and implicit dependency downloading are not prerequisites.

The [worked dataset](./example0.gpt6a.trig) includes an illustrative FnO factory
contract, input/output shape links, code mapping, and DepIn-inspired requirement
records. They are queryable declarations, not proof that their example module
exists or has executed.

## 9. Coherent proof and connections

First prove a compact path with real artifacts:

1. A versioned query procedure and named CSS selector over a fixture page.
2. A software sensor/evaluation producing an identified, sealed result batch.
3. Two entries carrying the same batch ID, stable entity references, and order.
4. A nested item property occurrence whose semantic owner differs from simple
   DOM ancestry; preserve raw itemprop and expanded predicate.
5. An annotation derived from one entry, using CSS-to-quote refinement against
   an exact target snapshot.
6. Query the batch membership, field structure, observation provenance, and
   annotation target; dump/reload and preserve those answers.
7. Discover a compatible declared factory and its requirements; a later executor
   proof binds actual inputs/providers and verifies lifetime/release behavior.

Exercise zero matches, two equal-valued occurrences, itemref ownership, concurrent
parent/child revisions, redelivered entries, abort before seal, and ambiguous
reanchoring. A dataset fixture proves its representation/query behavior. Live DOM
execution, SHACL validation, factory dispatch, and browser annotation rendering
each need their own actual execution evidence.

- [Ontology-forward design](../ontology/design0.gpt6a.md): this specializes its
  procedure/observation/result model and makes the query/annotation relationships
  first-class. The offset conversion is an explicit addition to its codec story.
- [Tabula-rasa observation model](../tabula-rasa/design0.gpt6a.md#6-shared-observation-and-live-queries):
  retain its per-realm ownership, immutable extraction, separate membership and
  projection, and per-stream identities. Ontology identifiers do not replace
  those runtime semantics.
- [Script-first host](../script-runtime/design0.gpt6a.md): registered scripts and
  versioned artifacts can implement the declared factories; the vocabulary is
  independent of extension generation.

The payoff is a discoverable chain: **which code can consume this structure →
which procedure ran → which batch it produced → which exact occurrence an agent
annotated → what claim or interpretation that annotation contributes.**

## 10. Worked-example verification

On 2026-10-20, the [verifier](./verify0.gpt6a.mjs) loaded the
[205-quad example](./example0.gpt6a.trig) using the existing Oxigraph installation
in `experiments/graphs` and jsdom installation in `schema`. It checked:

- Batch membership through entry-side references and an explicit inverse path;
  no accidental symmetric membership or assumed OWL inference.
- An explicitly sealed empty batch, and observation/procedure provenance.
- Nested property ownership through `itemref`, distinct from DOM ancestry.
- Discovery of the factory's declared input shape and two required service slots.
- Actual fixture CSS matches and quote/position selection of the same text.
- Unicode code-point positions 4–16 mapping to UTF-16 offsets 5–17 in the emoji
  fixture; direct reuse of those position numbers gives the wrong substring.
- Identical answers and all quads after both TriG and N-Quads dump/reload.

Run from the repository root:

```sh
node design/observation-queries/verify0.gpt6a.mjs
```

The fixture has only IRI-named nodes, so quad comparison does not exercise
blank-node canonicalization. It is expected graph state plus static DOM checks,
not a general microdata extractor, SHACL validator, live stream implementation,
factory executor, or browser-native annotation interface. Those capabilities
remain the proposed implementation proofs.
