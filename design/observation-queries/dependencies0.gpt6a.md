---
type: ResearchNote
title: "DepIn-O recovered: dependencies and code structure for factories"
description: Verified local precedents for dependency injection, code structure, callable arguments, and data-shape declarations, with their applicability boundaries.
resource: /design/observation-queries/dependencies0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Human recollection, commissioned FX archive search, source verification, and factory-model integration
  - resource: "opencode://ses_ea4bc04caffe3ibHrNRHIVRsJM"
    title: FX rediscovered DepIn-O and related RDF dependency/code/argument vocabulary captures
  - resource: file:///home/rektide/archive/doc/onto/depin-o.ttl
    title: Local provisional OWL translation of Dependency Injection Ontology
  - resource: file:///home/rektide/archive/doc/onto/depin-o.pdf.url
    title: Pointer to the source paper at CEUR-WS Vol-3564 paper4.pdf
  - resource: file:///home/rektide/archive/doc/onto/ooc.ttl
    title: Local provisional OWL translation of Object-Oriented Code Ontology
  - resource: file:///home/rektide/archive/doc/onto/rules/README.md
    title: Rule/constraint capture inventory and standards-status notes
  - resource: file:///home/rektide/archive/doc/onto/rules/spl.rdf
    title: SPL argument metadata, value types, optionality, defaults, and constraints
  - resource: file:///home/rektide/archive/doc/onto/seon/SPO.ttl
    title: Software procedures and activities declaring artifact/resource dependencies
  - resource: https://w3id.org/function/spec/20230512/
    title: Unofficial FnO function/implementation/mapping specification
---

# DepIn-O recovered

**The remembered name is DepIn-O — Dependency Injection Ontology.** FX found it
under `~/archive/doc/onto/depin-o.ttl`; the parent checked that file and the related
sources below. Its source pointer names
[DepIn-O: An Ontology on Dependency Injection Software Frameworks](https://ceur-ws.org/Vol-3564/paper4.pdf).
FX verified the title/authors/venue through the CEUR volume index; this note's
technical interpretation is checked against the local translation, not a fresh
audit of the paper's diagrams.

## What the captures actually contain

| Source | Exact evidence | Use here |
| --- | --- | --- |
| [`depin-o.ttl`](file:///home/rektide/archive/doc/onto/depin-o.ttl), lines 22–50 | Consumer classes, dependencies, constructor/method/property injection points | Describe what an implementation needs and where it receives it |
| Same, lines 59–94, 153–176 | Abstract/implemented/default/qualified dependencies, specifications, qualifier keys | Explain provider selection rather than hiding it in registry code |
| Same, lines 103–127 | Singleton, dependent, request/session/application scopes | Precedent for declared sharing and lifetime ownership |
| Same, lines 195–205 | Constraints from source prose/diagrams are not fully encoded; paper review needed for automated reasoning | Avoid treating the capture as a complete executable reasoner input |
| [`ooc.ttl`](file:///home/rektide/archive/doc/onto/ooc.ttl), lines 51–54, 73–125 | Compile-time OO source constructs; Class, Method, Variable, Type, ValueType, ReturnType | Describe code structure, not runtime object instances |
| Same, lines 224–246, 299–307 | Constructors, instance/parameter variables, return/value type relations | Name the code slots corresponding to dependency and argument bindings |
| [`rules/spl.rdf`](file:///home/rektide/archive/doc/onto/rules/spl.rdf), lines 1792–1811 | `spl:Argument` wraps a predicate and describes value type, optionality, default | A local precedent for machine-readable function/template arguments |
| [`seon/SPO.ttl`](file:///home/rektide/archive/doc/onto/seon/SPO.ttl), lines 755–758, 783–788 | Procedure description; standard activities declare other-activity dependence, artifacts used/created/changed, required resources | Conceptual precedent for processor plans; heavier than the immediate runtime needs |

The DepIn-O header calls itself a **draft OWL translation** and its namespace
**provisional**. OOC-O says the same and explicitly excludes runtime objects and
messages from its code-model scope. These are useful prior work with known
standing, not newly verified official namespace deployments.

`depin:DependencyImplementation` is class/inheritance-oriented. `depin:hasScope`
also uses the translation's dependency-class taxonomy. We should not directly
reinterpret those triples as arbitrary JavaScript functions or runtime lease
instances. Their vocabulary motivates a language-neutral profile with explicitly
documented correspondence.

## Complementary descriptions

**DepIn-O answers a different question from a data shape.** The dependency
`DOMMutationRouter` is a provisioned service; a `QueryDefinition` is configuration
data; a DOM snapshot is processing input; a result batch is an output. These all
can be dependencies in ordinary speech, but their construction and ownership
requirements differ.

| Question | Useful vocabulary / contract |
| --- | --- |
| What code declaration/module/member is this? | OOC-O where the OO model applies, plus exact artifact/source references |
| What callable operation and ports does it expose? | FnO; SPL is a local argument-description precedent, especially for SPARQL functions/templates |
| What data values are accepted or emitted? | SHACL/profile constraints, media types, and codecs |
| What services must be supplied, which implementation, at which slot? | DepIn-O concepts adapted to named requirement/provider bindings |
| Which resources are shared, and who releases them? | Explicit runtime lifetime/lease contract informed by DepIn-O scopes |
| What ran, with which resolved bindings and inputs? | PROV activity and pinned execution plan; SOSA observation when it determines a property |

FnO does have a separate source checkout at
`~/archive/FnOio/fno-specification`. FX's absence finding concerns captures in
`~/archive/doc`, not all of `~/archive`. The FnO specification read for this
design is the **unofficial 2023-05-12 draft**. Its function composition vocabulary
is marked experimental. The local SPIN/SPL captures come with a
[status/source inventory](file:///home/rektide/archive/doc/onto/rules/README.md):
the SPIN specification is a W3C Member Submission, and the RDF schemas were
retrieved from accessible TopBraid hosting.

## Proposed application to pageread

A query factory can declare a data port accepting `QueryDefinitionShape`, output
a bound sensor/live handle, and require a selector engine, realm-scoped mutation
router, and document-epoch identity map. A second annotation factory can accept
`ResultEntryShape`, require content/target resolvers and a publication sink, and
produce annotation drafts or committed receipts according to its declared mode.

Different code implementations may satisfy the same callable contract. A binding
plan selects concrete artifact revisions and service providers, records why each
was selected, and states who owns them. Creating a factory instance follows that
plan; re-running an observation uses its configured instance and immutable input.

The most immediately valuable recovered idea is **declared lifetime-aware
provisioning**. It connects “many query consumers, shared observer/router” to an
inspectable dependency plan. Preserve separate contracts for object structure,
dataflow, and service construction; combining their metadata does not make their
relations interchangeable.

See the [query/annotation design](./design0.gpt6a.md#8-code-shapes-and-factories-that-take-data)
for proposed operations and the [worked graph](./example0.gpt6a.trig) for a
queryable illustrative declaration. No factory has been automatically generated
or executed from these ontology records.
