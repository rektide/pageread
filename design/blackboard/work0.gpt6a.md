---
type: DesignProposal
title: "Received work: decisions, attempts, and explicit outcomes"
description: A worker-input engagement protocol whose child record explains acceptance, waiting, rejection, execution, output, and effect receipts.
resource: /design/blackboard/work0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Human proposes a received child beneath an entry that resolves into work outcomes or an explanation of rejection
  - resource: /design/blackboard/thesis0.gpt6a.md
    title: Blackboard coordination, private-view structure, and separation of content/work revisions
  - resource: /design/blackboard/structure0.gpt6a.md
    title: Entries as items and work attachments as typed graph relationships
  - resource: /design/observation-queries/blackboard0.gpt6a.md
    title: Receiving versus claiming, proactive production, commit receipts, and destination-specific delivery
  - resource: /design/observation-queries/sensor-routines0.gpt6a.md
    title: Instance continuity, entry revision rebinding, leases, and stale asynchronous results
  - resource: /design/ontology/design0.gpt6a.md
    title: Attempts, interrupted/unknown outcomes, OTel correlation, and durable publication
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Idempotent publication, original receipts, conditional writes, and post-commit feeds
---

# Received work

[Thesis](./thesis0.gpt6a.md) · [Item structure](./structure0.gpt6a.md)

## 1. Receipt is the beginning of a visible engagement

When a worker receives a candidate item, append a **received/work record** beneath
that item. It says: this worker encountered this exact input for this declared
purpose. It does not yet say the worker accepted, executed, stored, or delivered
anything.

The stable engagement can gain decisions and zero or more execution attempts.
Each attempt records actual running work; retries remain distinct attempts.
A rejection can settle the engagement without ever invoking the implementation.

| Identity | Why it exists |
| --- | --- |
| Worker definition + revision | The reusable selector/contracts/production policy |
| Worker instance + owner epoch | The bound implementation and its live scope |
| Activation/delivery identity | Idempotency and cause of this offered work |
| Received/work identity | The persistent account attached beneath the input |
| Attempt identity | One actual execution, with trace correlation |
| Result/batch/revision identity | Particular values produced |
| Commit/delivery receipt | What a receiving store or destination actually acknowledged |

An item may have many engagements by different workers, or by the same worker
against different revisions/purposes. Those records explain the plurality instead
of collapsing all activity into one `processing` flag on the message.

## 2. Matching is distinct from deciding to do the work

A cheap selector or index query identifies candidate inputs. A delivery/activation
then records the worker's engagement and checks its actual contract and context.
That is where a received record can explain an input that looked relevant but
could not be processed.

Do not create a rejection record for every worker against every unrelated item.
Default recording covers actual deliveries, requested evaluations, and considered
activations worth explaining. A worker's selector and an explicit `explainMatch`
operation can answer why an unrelated item was never a candidate.

| Decision | Meaning | What follows |
| --- | --- | --- |
| **Accepted** | Input/contracts/policy support this work | Queue/start an owned attempt |
| **Waiting** | A named input/service/condition is missing | Record the dependency and a defined wake condition |
| **Rejected** | This worker declines this input under the checked definition/policy | Terminal for this engagement; record reasons |
| **Reused** | Existing output/outcome already satisfies this request | Link the existing work/output; no invented new execution |
| **Cancelled** | Owner or command stopped pending work | Record who/why and release owned resources |

Waiting is not a rejection. Rejection is not an execution error. Reuse is not a
second successful computation. The view can present all of these under the same
received-child convention while preserving their meaning.

## 3. A small lifecycle with enough room for real outcomes

```text
received
  -> checking
       -> rejected(reason)
       -> reused(existing result/work)
       -> waiting(requirements) -> checking
       -> accepted -> queued -> attempt running
                                  -> succeeded(results, possibly zero)
                                  -> failed(error)
                                  -> cancelled(reason)
                                  -> interrupted / outcome unknown
```

Retry policy can schedule another attempt within the engagement. A new input
revision or different request normally creates a new engagement linked to the
predecessor. The earlier record remains an account of the input it actually saw.
No automatic retry or background reconciliation policy is selected by this note.

A successful zero-result computation explicitly records that outcome and its
coverage. It is different from rejection, an aborted scan, or a batch that never
sealed. `succeeded` covers the operation declared by this worker; it does not
implicitly mean durable storage or all downstream effects succeeded.

The `received` root has a derived current phase and references its decisions and
attempts. Transitions carry an identity/sequence, timestamp when known, actor,
and relevant references. Append their history and update the selected summary
coherently. Imported `running` history does not establish a currently live owner.

## 4. What goes on the received child

Minimum proposed fields:

- Work identity, owning input item, and activation/delivery key.
- Worker definition revision and bound instance when one exists.
- Selector/profile and the evidence that led to consideration.
- Exact input references/revisions and binding/configuration identity.
- Received time and current phase, with transition sequence/revision.
- Decision, reason records, dependencies being awaited, and attempt references.
- Produced values/content declarations and later receiver receipts by reference.

Input references are pinned. The record must not resolve “input” to whatever is
current by the time an agent inspects it. The same received child may show a
current summary while its evidence links continue to identify the original input.

### Reasons are data that tools can use

An illustrative rejection record:

```json
{
  "disposition": "rejected",
  "code": "unsupported-input-profile",
  "message": "Expected image-entry/v1; this entry is message-entry/v0.",
  "input": { "item": "urn:example:entry:42", "revision": "r7" },
  "workerDefinition": "urn:example:worker:image-reader:v2",
  "expectedProfile": "image-entry/v1",
  "actualProfile": "message-entry/v0",
  "atField": "profile"
}
```

Other useful reasons include ambiguous target, incompatible source scope,
unsupported selector feature, and missing required representation. A temporarily
unavailable required service usually belongs to `waiting`, with its wake rule,
rather than a permanent refusal.

Reasons can have supporting items/annotations and multiple affected paths.
Structured codes help agents find a compatible producer or revise a routine;
human text explains the judgment. An exception retains its cause/stack where
available and is an execution failure, not merely a refusal message.

## 5. Scheduling, idempotency, and ownership

The host registers worker selectors and production rules, maintains candidate
inputs, and creates activations according to explicit proactive/on-demand/command
policies. A received work record is created or recovered before invoking the
implementation. For a durable work guarantee, that boundary itself is committed
before acknowledging receipt or beginning an externally visible effect.

An activation key binds definition/configuration, input references and requested
purpose. Redelivery uses the recorded activation and returns the existing account.
An explicit new probe can create a fresh activation even for equal input values.
Input-dependent scheduling decides whether new content warrants new work; a batch
ID alone is not the lifetime key of a long-lived child sensor.

An execution owner claims an eligible attempt under the host's atomicity contract.
Several workers may independently receive the same input; claiming one attempt
does not consume or delete the input item. The owner/epoch or claim token guards
updates from superseded executors. Closure releases resources; it does not erase
received history or retained content.

If the host loses an executor, it records what is known: interrupted work or an
uncertain effect outcome. Retrying an external effect requires the effect's own
idempotency/readback policy. A local work ID cannot guarantee exactly-once remote
delivery, and a successful callback return is not a durable store receipt.

## 6. Results become inputs for other workers

A worker may append output declarations/results beneath its work, reference an
output item elsewhere on the board, or both according to the structural profile.
The output identity is stable across those views. Provenance links it to the
attempt and pinned inputs.

Downstream consumers attach their own received records beneath that output:

```text
entry e42
  received w9: message-reader
    attempt a1: succeeded
    output -> normalized item n3

normalized item n3
  received w11: graph receiver
    attempt a2: failed to commit
  received w12: annotation worker
    attempt a3: succeeded
    output -> annotation proposal p4
```

This shows why a value may be available to an in-memory annotation worker while
its configured persistence route has failed. Lifetime/durability descriptors tell
consumers what they can depend on. A later graph commit can produce a new receipt
without pretending extraction ran again.

Only an eligible completion can advance a selected current output generation.
An older attempt's results may be retained, but they stay associated with the
older inputs. Append-only work evidence and current-generation selection are
different operations.

## 7. Ontology and telemetry alignment

- The received/work record is an item describing an engagement or intent. It is
  not automatically the execution activity itself.
- Actual attempts are `prov:Activity`; sensor evaluations can additionally be
  `sosa:Observation` with procedure, sensor, feature, property, and result.
- Selectors use Web Annotation source/selection/state terms where applicable.
- Produced values and receipts are entities with generation/derivation links.
- OTel spans describe actual execution attempts; structured events can describe
  received, waiting, decision, and settlement transitions. Record the work/attempt
  IDs for correlation rather than using a missing span end as the work queue.

The profile defines the new work/decision/attachment terms. The existing
vocabularies provide useful correspondences, not a ready-made durable scheduler.
The first vocabulary source should generate these terms and codecs with the
other pageread terms rather than create another disconnected constants list.

## 8. Focused proof cases

1. Two workers receive one item; one accepts and one rejects, with independent IDs.
2. Rejection happens before any implementation invocation and preserves reasons.
3. Waiting records the exact missing provider and resumes only under its wake rule.
4. Redelivery returns the same received record without another attempt/effect.
5. An explicit new probe gets a new attempt/observation despite equal text.
6. A successful empty batch is visibly different from failure or rejection.
7. Worker termination leaves an honest interrupted/unknown state.
8. Work-child mutations do not recursively trigger the message reader.
9. Old-input completion cannot replace current output selected for newer input.
10. A store failure is attached to the receiving stage while extraction remains
    independently explainable.

These are proposed behavioral checks. This document does not claim a durable
received/work implementation exists yet.
