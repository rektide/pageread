---
type: DesignProposal
title: "Virtual items and child work structure"
description: The item/property/reference model and private document projection for a blackboard whose work attaches beneath observed entries without modifying the source page.
resource: /design/blackboard/structure0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Human defines entries as items and work as children in a virtual microdata graph rendered in our own view
  - resource: /design/blackboard/thesis0.gpt6a.md
    title: Integrating virtual-blackboard direction and separate data/work revisions
  - resource: /design/observation-queries/design0.gpt6a.md
    title: Microdata occurrences, selector source/state, batch membership, and inverse relationships
  - resource: /design/ontology/design0.gpt6a.md
    title: Named graph roles, semantic authority, representation revisions, and provenance
---

# Virtual items and child work structure

[Thesis](./thesis0.gpt6a.md) · [Work protocol](./work0.gpt6a.md)

## 1. The item graph is the shared surface

Use an identified item model with types, typed properties, literal/reference/item
values, and ordered occurrences where needed. Source observations, worker
declarations, selectors, entry batches, work records, and output declarations all
fit that model. The graph can be exposed as microdata, XML, JSON-LD, or RDF.

An **entry is an item appearing in a collection/batch**, not a special opaque
envelope that hides the thing an agent wants to inspect. Its fields can identify
the stable subject, exact content revision, source selection, batch membership,
and local operational attachments.

Keep stable subject identity, entry occurrence identity, and representation
revision explicit. An entry about m42 in one batch is not the same occurrence as
an entry about m42 in another batch. An inspector can group both under a stable
message view without erasing that distinction.

## 2. A child means a named relationship

The user's child-element convention is valuable: it gives work a place where a
reader naturally looks for it. Preserve that organization as a relation in the
graph, rather than relying on where a UI happened to draw a node.

| Relationship | Meaning |
| --- | --- |
| Item/property nesting | A property value is another item |
| Work attachment (`workOf`) | This engagement's explanatory home is this input item |
| Input dependency (`prov:used` on an attempt) | This activity actually used these pinned entities/representations |
| Result/derivation | This output was produced by or derived from that activity/input |
| Batch membership (`inBatch`) | This entry occurrence belongs to that identified result set |
| Rendered child | The owned view displays one of these relations as nesting |

`workOf` is a proposed local profile relation, not a new assertion that source
content semantically contains our execution history. Work children belong to
our operational description of the entry. The original extracted source item
and its exact representation remain identifiable.

A multi-input operation can live beneath a join/request/scope item, with references
to all inputs. Other views may show references to the same work beneath each input.
There is one work identity and account, not copied histories with diverging state.
Graph cycles through references do not require infinite recursive rendering:
render a reference when an item is already on the current traversal path.

## 3. Source, data, and operational neighborhoods

An input item's neighborhood can include:

- **Observed properties:** raw/parsed fields, source occurrence and coverage.
- **Selected properties:** resolver-selected current interpretation, with support.
- **Source anchors:** Web Annotation selections and ephemeral live access handles.
- **Work attachments:** receipts, decisions, attempts, progress, outputs, reasons.
- **Annotations:** human/agent statements about the item or its interpretation.

Those are separate property/graph roles even when displayed together. A source
HTML item with a nested author is not conflated with a local worker nested beneath
the same visible message. A generic source extractor never walks our inspector
and pretends its work records originated on ChatGPT.

Source-content revisions cover the declared semantic inputs. Operational
attachments have their own revisions. Appending `received` or `rejected` does not
advance the source-content revision or invalidate an input-dependent worker.
Work-aware queries explicitly depend on the operational neighborhood.

Keep source-node identity in realm-local maps and retained anchor descriptions.
Do not assign attributes or insert elements into the source DOM merely to carry
our IDs. The virtual item can have an identity even when the source element has
no native ID.

## 4. Proposed private view

The following XML is a **virtual-document sketch**, with an illustrative profile
namespace. It is not intended to be inserted into the observed page:

```xml
<pr:board xmlns:pr="https://example.org/pageread/vocab/0#" id="board-1">
  <pr:workers>
    <pr:worker id="message-reader" definition="reader-v3">
      <pr:selector id="read-selection" kind="CssSelector"
                   source="page-snapshot-7" value="article[data-message-id]" />
      <pr:accepts profile="message-entry/v0" />
      <pr:produces profile="normalized-message/v0" />
      <pr:module artifact="reader-artifact-r3" export="readMessage" />
    </pr:worker>
    <pr:worker id="image-reader" definition="image-reader-v2">
      <pr:selector id="image-selection" kind="CssSelector"
                   source="page-snapshot-7" value="article[data-message-id]" />
      <pr:accepts profile="image-entry/v1" />
      <pr:produces profile="normalized-image/v0" />
      <pr:module artifact="image-reader-artifact-r2" export="readImage" />
    </pr:worker>
  </pr:workers>

  <pr:entry id="entry-42" entity="message-42" content-revision="r7" batch="b12">
    <pr:field name="text">An observed message.</pr:field>
    <pr:received id="work-9" worker="message-reader" input-revision="r7"
                 selector="read-selection" phase="succeeded">
      <pr:decision id="decision-9" sequence="1" disposition="accepted" />
      <pr:attempt id="attempt-9a" implementation="reader-artifact-r3">
        <pr:started sequence="2" />
        <pr:produced sequence="3" ref="normalized-42-r1" />
        <pr:settled sequence="4" outcome="succeeded" />
      </pr:attempt>
    </pr:received>
    <pr:received id="work-10" worker="image-reader" input-revision="r7"
                 selector="image-selection" phase="rejected">
      <pr:decision id="decision-10" sequence="1" disposition="rejected"
                   code="unsupported-input-profile">
        <pr:reason>Expected an image entry; received a message entry.</pr:reason>
      </pr:decision>
    </pr:received>
  </pr:entry>
</pr:board>
```

The `received` element renders the stable engagement/work record. Its current
`phase` is a convenient summary of its decisions and attempt events. The element
does not need to be renamed when execution starts or finishes. Rejection can
settle it without any processing attempt.

The two example selectors deliberately identify the same broad candidate. Their
different acceptance profiles explain why one processes it and the other records
a rejection. A real worker can use a more selective candidate query; this sketch
does not prescribe delivering every item to every worker.

An HTML exposure uses valid custom-element names such as `pr-worker` and
`pr-received`, with full closing tags. A microdata exposure supplies actual
`itemscope`, `itemtype`, `itemid`, and `itemprop` mappings from the versioned
profile. XML attribute names and tag nesting do not magically provide a standard
HTML microdata mapping; the codec owns that translation.

Local IDs in the sketch stand for graph identities/references, resolved by the
view profile. Production references require the owned namespace and revision
rules described in the existing ontology work. Example module references here
are labels, not installed executable artifacts.

## 5. Selectors state what they select and where

A worker can have a selector child describing what it reads. That selector names
its **source domain**, because these are different operations:

1. CSS/XPath/quote selection over an observed page representation.
2. Selection over a canonical private DOM projection of the blackboard.
3. A semantic graph query over items and properties.

Web Annotation selectors remain rooted in a source and its state/representation.
An `oa:CssSelector` does not natively query arbitrary RDF triples. It can operate
over a declared DOM projection; SPARQL or a property/path query can operate over
the graph. The mapping/profile explains how either yields item references.

Avoid binding worker meaning to incidental inspector markup. If virtual selectors
are CSS-based, expose a stable structural projection profile; UI decoration,
folding, and sorting belong to a presentation layer. A view hiding a work record
does not withdraw that record from the blackboard.

## 6. Appending is a host operation

A worker proposes an attachment under an identified parent and receives an ID and
revision/receipt. The host checks the pinned input's identity/revision and the
expected work revision, allocates or reuses identity according to the operation
key, records the change, and notifies affected views under the declared persistence
contract. Recording an old-input completion as history does not require that
input to remain the current head. Advancing a selected current output does require
the appropriate current-input/generation precondition.

The worker owns its declared attachment/output scope. Shared input properties and
other workers' records do not become arbitrary mutable scratch fields. This
supports independent workers on one input without forcing them into one object
with conflicting status updates.

References and histories can be retained while the current view selects only the
latest relevant state. Replacing a work summary is not deletion of its transitions.
The initial storage implementation can use versioned aggregate records; a graph
host can use transactional quads. Neither requires mirroring the graph into the
source DOM.

## 7. What to verify first

- The same graph item has one identity when displayed in several neighborhoods.
- Microdata encoding preserves nested item values and typed work relations.
- Work attachment changes the board/work coordinate, not source-content identity.
- Source and private-view selectors use their declared roots and profiles.
- An input with two receiving workers shows two independent work accounts.
- A multi-input work item links every pinned input without duplicated histories.
- Source navigation releases anchors, while copied evidence/work stay inspectable.
- A page DOM snapshot before and after blackboard updates shows no augmentation
  from the blackboard renderer; owned-view changes are tested separately.

This note is a structural contract. Its XML can be parsed as a sketch, but
round-trip microdata codecs and live source-isolation behavior require execution
proofs when those parts are implemented.
