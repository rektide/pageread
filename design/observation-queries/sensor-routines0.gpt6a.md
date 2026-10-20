---
type: DesignProposal
title: "Sensor routines: queries that produce values, templates waiting for entries"
description: Sensor-first authoring with declarative selector structure, explicit executable leaves, and entry-triggered construction of child sensors and processors.
resource: /design/observation-queries/sensor-routines0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Sensor-first routines and entry factories, extended by the human's blackboard/proactive-content production direction
  - resource: /design/observation-queries/blackboard0.gpt6a.md
    title: Broader factory-system role: matching, declared outputs, proactive production, store receipts and export operations
  - resource: /design/observation-queries/design0.gpt6a.md
    title: SOSA query mapping, Web Annotation selectors, batch identities, annotation tools, and factory contracts
  - resource: /design/observation-queries/dependencies0.gpt6a.md
    title: DepIn-O provisioning and lifetime concepts, OOC-O code structure, and callable data interfaces
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Shared observation leases, synchronous immutable extraction, per-stream identity, and snapshot/change semantics
  - resource: /design/script-runtime/design0.gpt6a.md
    title: Installed script artifacts, runtime capabilities, and the one-host product direction
---

# Sensor routines

[Module map](./README.md) · [Underlying query/annotation design](./design0.gpt6a.md)

## 1. The authoring center

**A sensor is a query that produces values. A sensor routine is the reusable,
identified description of how to make that happen.**

This is the human's preferred starting point. Authoring should begin with a
source, something to select or determine, and the values to produce. Selection,
refinement, projection, composition, and output can remain inspectable data.
Where an operation needs code, a named processor binding supplies it.

The ontology remains precise underneath this friendly surface:

- A routine/definition describes a `sosa:Procedure`.
- Its bound, running evaluator is a software `sosa:Sensor`.
- Each evaluation is an observation, producing values in identified batches.

Calling this whole facility a sensor-query is useful. Authoring need not force
the user to manually construct every ontology node before selecting a page.

The following is a focused design refinement, with proposed syntax. It preserves
the preceding [broader design](./design0.gpt6a.md) and is not an implementation of
a custom-element library or a general factory executor.

## 2. Small authoring vocabulary

| Construct | Job |
| --- | --- |
| **Sensor** | Observe a bound source and publish values/results |
| **Selector** | Describe which segment or occurrences matter; reuse Web Annotation selector descriptions |
| **Projection** | Copy/interpret selected fields into immutable values under a named profile |
| **Processor** | Consume input values and produce output values; may use a module implementation |
| **Entry template** | Describe the child sensors/processors to bind for each matching upstream entry |
| **Connection** | Bind a named output/field to a named input within an explicit scope |

The first useful loop is:

```text
page source
  -> message sensor
  -> identified message entries
  -> entry template, bound once per message identity
       -> scoped text sensor
       -> processor consuming its text entries
       -> annotation drafts or other values
```

Annotation creation is one natural downstream processor. A sensor may also
produce simple values, semantic items, structural microdata records, or telemetry.
Persistence is a selected output route, so the routine can also be used for an
in-page live view or an interactive authoring preview.

## 3. Declarative through the executable leaf

Proposed HTML authoring sketch:

```html
<template id="message-routine">
  <pr-routine id="routine" iri="urn:example:routine:messages:v1">
    <pr-input name="page" shape="dom-source/v0"></pr-input>

    <pr-sensor id="messages" from="page" emits="message-scope-entry/v0">
      <pr-select kind="css" value="article[data-message-id]"></pr-select>
      <pr-key attribute="data-message-id" namespace="source"></pr-key>
      <pr-extract profile="message-scope/v0"></pr-extract>
    </pr-sensor>

    <pr-for-each id="per-message" from="messages" key="entity"
                 on-revision="rebind" on-withdraw="dispose-live">
      <pr-sensor id="text" from="$entry.scope" emits="text-entry/v0">
        <pr-select kind="css" value="[itemprop~='text']"></pr-select>
        <pr-extract profile="text-content/v0"></pr-extract>
      </pr-sensor>

      <pr-process id="draft" from="text" mode="map"
                  accepts="text-entry/v0" emits="annotation-draft/v0">
        <pr-module artifact="urn:example:processor:annotate:v1"
                   export="draftAnnotation" runtime="esm"></pr-module>
      </pr-process>
    </pr-for-each>
  </pr-routine>
</template>
```

All `pr-*` elements, profiles, and example artifact IDs are **proposed**. The
artifact reference is illustrative, not a module that has been installed. The
template holds inert recipe markup; an explicit host operation parses, validates,
binds, and activates it. Merely displaying a routine does not run its modules.

The `page` input supplies root access and source identity context. The key profile
scopes a native message key to provider/account/conversation as appropriate;
document epoch remains a separate identity for live node access.

The first sensor emits immutable entry data and a scope binding. `$entry.scope`
is explicitly a source/selection handle for the child sensor, not permission to
reread an arbitrary mutable DOM element after an asynchronous wait. A live handle
is epoch-bound; copied evidence identifies its snapshot. Child results name the
input entry revision they actually evaluated.

`from="text"` resolves in the current `per-message` instance. Every child may use
the local name `text`; globally its identity includes the bound parent instance.
No global-ID collision or cross-message input mixing is implied.

### One model, several presentations

The canonical contract is an identified routine graph plus its versioned profile.
HTML custom elements are an authoring/presentation codec. XML can use an explicit
namespace and the same structural model; RDF/JSON-LD can expose it directly.
HTML nesting, XML nesting, and graph edges map according to that codec, not by
guessing from arbitrary page markup.

Useful correspondences include:

| Recipe record | Semantic description |
| --- | --- |
| Sensor definition | Procedure with source/selection/projection/output contracts |
| CSS selector leaf | `oa:CssSelector` plus its selector literal |
| Refinement chain | `oa:refinedBy` when its actual refinement semantics apply |
| For-each template | Our entry-triggered binding/composition description |
| Processor module | Callable/implementation mapping with exact artifact identity |
| Instance created from the recipe | Runtime sensor/processor, owner scope, and resolved bindings |

Use Web Annotation selectors as reusable data. General per-entry scoping and
pipeline connections remain explicit composition operations. In particular,
several `oa:refinedBy` values describe alternative ways to obtain the same
selection; they are not a list of child factories.

## 4. What is a factory here?

The subsequent [blackboard refinement](./blackboard0.gpt6a.md) expands the
surrounding system: it sees values, advertises producible content and activates
producers proactively. The construction/processing distinction below describes
its smaller callable roles; it does not limit the whole factory system to
constructing objects.

There are two related operations worth naming clearly:

```text
process(inputValue) -> outputValue(s)
construct(configuration, boundInputs, services) -> instance
```

A processor can consume many entries without constructing a new instance for
each one. A factory creates something with its own configuration, input binding,
and possibly a lifetime: a sensor, processor, annotation workflow, or view.

**“Factories waiting for entries” is a factory plus an input-matching rule and
an owner.** The entry template is the declarative form of that combination:

- Subscribe to a named upstream collection/feed.
- Recognize entries that satisfy the declared input contract.
- Bind named fields and available services.
- Create or update the child instance under the declared identity/lifetime rule.
- Report waiting, ready, bound, failed, or closed status with unresolved inputs.

The factory itself can be a regular function exported by an installed module.
It need not implement its own subscription or install another MutationObserver.
The host owns routing, matching, scheduling, identity, and release. A data-driven
template can use a built-in factory; code is only required when the needed
construction or processing behavior exceeds the built-in operations.

### Entry arguments and services are different bindings

A message entry supplies data or a scoped source. A mutation router, selector
engine, identity map, or annotation store supplies services. The factory plan
records both, with their contracts and owners.

The [DepIn-O precedent](./dependencies0.gpt6a.md) is particularly useful for
provider choice and service lifetime. FnO/shapes describe callable ports and
accepted values. These support the sensor-first surface; choosing a complete DI
framework is not a prerequisite to minting the first routine.

A processor artifact reference must resolve to exact code and an execution
adapter. ESM is one implementation profile. The same abstract operation could
be supplied by a built-in, a compatible user script, WASM, or a remote service
when the host advertises those capabilities. The declaration says what is run
and how inputs/outputs cross that boundary.

## 5. Waiting, rebinding, and identity

The initial entry-template contract should be small and explicit:

| Input situation | Proposed behavior |
| --- | --- |
| No matching entry yet | Template is waiting; it has no child instance for that key |
| Required service missing | Report the unresolved binding; preserve input identity for a later explicit retry/binding update |
| First entry for a stable key | Create one child instance with the current input revision |
| Redelivery of the same entry/event | Reuse the recorded transition; do not construct twice |
| Same entity, newer entry revision | Rebind/reevaluate the existing child when its contract permits; otherwise explicitly replace the instance |
| Two entries claim one key in a set | Diagnose ambiguity or apply a declared aggregation policy; no hidden last-writer choice |
| Explicit transient membership withdrawal | Apply the declared pause/dispose policy to the live child lease |
| Source gap or degraded coverage | Mark continuity/coverage uncertain; do not reinterpret missing data as explicit withdrawal |
| Owner closes or source epoch ends | Release its live bindings and dependent resources; retained content/artifacts remain |

The example's `dispose-live` applies only to live resources owned by that binding.
It is not a request to prune stored messages, annotations, or historical results.
For snapshot sources, withdrawal is established only by a completed snapshot of
the declared transient query scope. Delta sources need explicit delete/withdraw
events and a valid base cursor.

Key construction uses the template definition revision, upstream instance/source
scope, and stable entity or occurrence key. **Do not key persistent child sensors
by batch-entry ID by default:** batch occurrences are new on each evaluation and
would otherwise continually recreate the children. Batch and entry IDs preserve
observation evidence; binding keys preserve instance continuity.

When an old asynchronous evaluation finishes after rebinding, its result is still
about its old input revision. It can be retained as evidence but cannot silently
replace the current child output. This is the publication-generation rule from
the broader design applied to an individual bound sensor.

Several required data ports are possible later. A waiting rule then needs join
keys, revision selection, and completion semantics; it must not combine unrelated
“latest” entries. Start with one upstream entry and explicitly bound services.

## 6. Values, batches, and annotations

A sensor publishes identified observations and result batches. Each entry carries
its batch ID, stable subject identity when known, observed representation/revision,
and optional ordering/source anchor. A seal describes a completed batch, including
zero matches. Partial/aborted delivery retains its actual status.

Templates consuming state snapshots stage a batch until its completion boundary;
their child transitions correspond to that coherent input. Templates consuming
an event feed may act per event when configured to do so. These are distinct modes
with explicit delivery/idempotency semantics.

Produced values may feed another sensor, a processor, an annotation tool, or a
publication sink. A module in `mode="map"` returns proposals/drafts; persistence
occurs through the selected output. An effectful processor declares its effect
and retry contract so duplicate event delivery does not duplicate publication.

An annotation target can be minted from an entry's exact representation and
selector, retaining the observation and procedure references. Live reanchoring is
an explicit new binding; the original annotation remains explainable. The
[annotation kit](./design0.gpt6a.md#7-the-agentic-annotation-making-kit) is thus a
first consumer of sensor values and can also annotate routines and code bindings.

## 7. What minting a routine produces

Minting creates an addressable artifact with:

1. A stable routine identity and an immutable definition revision.
2. Source/input contracts, named selector/transform steps, and output profiles.
3. Referenced procedure/processor artifacts and exact bindings where code is used.
4. Declared service requirements, instance key policy, and ownership/disposal rules.
5. Fixture evidence showing what the routine selects and produces, including
   unsupported or incomplete cases.

Creating that artifact and activating an instance are separate operations. One
routine can create instances on several pages or from retained fixtures. Its
source representation may be HTML/XML, while its graph representation makes
selectors, fields, dependencies, and outputs discoverable to other tools.

Useful authoring operations can remain sensor-centric:

```text
sensor.describe / preview / mint
sensor.bind / walk / follow / close
bindings.inspect
annotations.fromResult / preview / publish
```

The first proof should mint one small routine, run its root sensor on a fixture,
bind two independently owned children, update one entry without duplicating the
other child, feed values into a named module, and produce an annotation draft.
Then verify redelivery, an empty sealed batch, a source gap, and owner teardown.
This note specifies that proof; it does not claim it has run.

## 8. Relationship to the earlier designs

- [Query/annotation ontology](./design0.gpt6a.md): retains its standards mappings,
  occurrence structure, batch IDs, and annotation targets. This note chooses a
  smaller sensor-first authoring surface and clarifies entry-triggered factories.
- [Dependency precedents](./dependencies0.gpt6a.md): supply vocabulary for service
  provisioning and code structure without making the author begin with a DI model.
- [Shared observation and live queries](../tabula-rasa/design0.gpt6a.md#6-shared-observation-and-live-queries):
  supplies the runtime ownership, immutable extraction, and revision boundaries
  the declarative routine must preserve.
- [Script-first host](../script-runtime/design0.gpt6a.md): supplies installed code
  and runtime adapters; bespoke extension generation remains an optional packaging
  exposure of the same routine.
