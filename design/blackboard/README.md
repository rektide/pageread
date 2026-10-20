---
type: DesignModule
title: Virtual page blackboard
description: Integrating architecture and small structural/work protocols for a private semantic page view where workers append inspectable received records beneath items.
resource: /design/blackboard/README.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Commission the overall virtual-blackboard thesis and focused item-structure and received-work notes
  - resource: /design/blackboard/thesis0.gpt6a.md
    title: Integrating architecture and first system proof
  - resource: /design/blackboard/structure0.gpt6a.md
    title: Virtual items, typed child attachments, selector roots, and private rendering
  - resource: /design/blackboard/work0.gpt6a.md
    title: Receipt, decisions, execution attempts, reasons, outputs, and effect receipts
  - resource: /design/observation-queries/blackboard0.gpt6a.md
    title: Preceding production-system account of proactive content, receivers, and export
---

# Virtual page blackboard

**Sensors contribute items. Workers attach their work beneath those items and
produce further items. Our own view shows the developing knowledge and the work
that explains it.**

The observed page is the source, while the virtual graph is the shared working
surface. Blackboard structure and work records are rendered privately by default,
without augmenting the source page DOM.

## Bigger thesis and small parts

| Read | What it owns |
| --- | --- |
| [Blackboard thesis](./thesis0.gpt6a.md) | The integrating architecture: sensors, items, workers, activation, production, receivers, and private inspection |
| [Virtual item structure](./structure0.gpt6a.md) | Entries as items, typed work-child attachments, source versus board selector roots, and an XML view sketch |
| [Received-work protocol](./work0.gpt6a.md) | Receipt, accept/wait/reject/reuse decisions, attempts, reasons, output, and store/delivery outcomes |

These are design candidates, ahead of the runtime implementation. They preserve
the [earlier blackboard-production note](../observation-queries/blackboard0.gpt6a.md)
and add the user's concrete structural convention: a worker has a selector child;
a meaningful engagement with an entry leaves a received/work child beneath it.

## The key invariant

**Work attachments change operational state, not the input's source-content
revision.** A reader must not repeatedly activate merely because it appended
`received`, `running`, or `rejected` under the item it is reading.

## Follow the smaller capabilities

- [Sensor routines](../observation-queries/sensor-routines0.gpt6a.md): minting
  declarative routines and binding module implementations to keyed entries.
- [Query/annotation tools](../observation-queries/README.md): Web Annotation
  selectors, SOSA observations, microdata structure, result batches, and factories.
- [Ontology-forward model](../ontology/README.md): evidence, provenance, selected
  content generations, and portable datasets.
- [Script-first host](../script-runtime/design0.gpt6a.md): installed code,
  runtime adapters, and execution ownership.
- [Design reading map](../README.md): prior inquiries and alternatives.

## First integrated demonstration

An owned inspector shows one source item and two workers: one receives and
produces; the other receives and rejects with a reason. Later input and a failed
store operation exercise revision/receipt distinctions. The source DOM remains
unaugmented. The [thesis's proof criteria](./thesis0.gpt6a.md#9-the-first-integrated-proof)
state what must be demonstrated; no such runtime proof is claimed here.
