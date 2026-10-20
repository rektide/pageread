---
type: DesignReview
title: "Wave 1 — browser and reader-interface adversarial review"
description: "Targeted corrections to the clean-room candidate's streaming, lease, and initial-snapshot contracts."
resource: /design/tabula-rasa/review1-browser.gpt61s.md
status: draft
generated: { by: "model:openai/gpt-6.1-sol#medium", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea5103182ffeZEKBEjHks2vnSJ"
    title: "Independent wave 0 browser research and wave 1 adversarial interface review"
  - resource: /design/tabula-rasa/brief0.gpt6a.md
    title: "Approved clean-room requirements and independence boundary"
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: "Candidate reviewed; parent identifies its checkpoint as e16851b7"
  - resource: /design/tabula-rasa/research0-browser.gpt61s.md
    title: "Own earlier research, especially live ownership, portability, streaming, and build constraints"
verification:
  scope: "Document/interface review only; no code, tests, new primary-source research, or runtime claims."
---

# Browser and reader-interface review

**Outcome:** keep the candidate's direction. Three contract gaps need correction
before using its interfaces to implement readers; no material browser-source error
or wrongly promoted user requirement was found in the reviewed areas.

Only the approved brief, candidate, and my own earlier research were read. No
pre-existing scaffold/configuration/history or sibling research/reviews were read.
Line numbers below refer to the candidate as supplied for this review.

## P1 — streaming invocation and state scope do not identify a response stream

**Target:** §6 “Host and source capabilities,” lines 308–311; §9 “Interpreter
boundary,” lines 587–599; §12 generation walkthrough, lines 713–716.

`interpret(input: Observation, context): AsyncIterable<Proposal>` permits multiple
outputs, but does not establish how a parser receives incremental bytes. State is
scoped to a “source epoch,” while a recipe source such as `conversation-network`
can match several simultaneous responses during the same document attachment.
Source ordering alone cannot identify which decoder owns a partial UTF-8 sequence,
protocol frame, replacement patch, EOF, or interruption. No request/body stream
identity or invocation lifetime is specified.

**Correction:** define one of two small input contracts, without choosing capture
technology: either one interpreter invocation per response with a cancellable
`AsyncIterable<Uint8Array>` plus metadata/terminal outcome, or tagged
`start/chunk/end/interrupted` observations keyed by stream identity. State belongs
to that stream incarnation; cross-response reconciliation remains separate.
Specify whether calls are serialized per stream, how cancellation reaches an
awaiting decoder, and how a completed versus truncated body is distinguished.

**Falsification:** interleave two responses through one recipe source; split a
multibyte character and protocol delimiter across chunks; cancel only one body.
The other must finish correctly, with no shared decoder residue or fabricated EOF.

## P1 — live-view resource acquisition has no complete release contract

**Target:** §6 “Ownership, roots, and evaluation,” lines 315–319; `Reading.live`
and `close`, lines 283–290; §7 `ReadableView`, lines 365–389.

The text promises final-lease cleanup and subscription disposal, but `live()`
returns a readable object without defining when its query lease is acquired.
If construction or `read()` starts observation, a read-only caller cannot release
that lease except by closing the entire reading. If only subscription acquires
it, the semantics of `read()` before subscription and after final unsubscribe are
unspecified. This affects the explicit own-now/use-later authoring workflow, not
just garbage collection.

**Correction:** choose and state lease timing. Either make construction/read
non-observing and subscription own live work, documenting read-only snapshot and
freshness behavior, or return an explicitly disposable query handle. State that
`Reading.close()` terminates owned views and that callbacks cease after disposal;
an individual query release must not close another query or reading's lease.

**Falsification:** create/read/discard many queries without subscribing, then
subscribe twice to one compatible query. Dispose each consumer and query owner
independently. No orphan observation remains and the surviving consumer continues.

## P2 — synchronous initial scan needs an extractor execution constraint

**Target:** §6 `EntityQuery`, lines 321–326, and “Joining now to next,” lines
350–358; §9 packaged executable extraction, lines 579–590.

The initial scan must not yield and its published values must be immutable, but
the extractor contract does not say whether projections must be synchronous.
Packaged executable modules otherwise leave that question open. Awaiting an
extractor while it reads mutable elements later defeats the stated snapshot
boundary; a synchronous membership snapshot alone does not freeze projected text.

**Correction:** make the initial DOM projection explicitly synchronous and
side-effect-free, producing immutable observation input. Async interpretation can
then consume that input. Alternatively permit asynchronous projection but define
revalidation/stale-result rejection and stop describing the combined result as
the same synchronous scan boundary. No new framework is required.

**Falsification:** delay extraction after finding an element, edit/recycle it,
and attach a second subscriber before extraction completes. Both must receive
truthfully revisioned values, not old membership combined with unlabeled new text.

## Coverage and features that pass review

- §6/§7 provide finite walks, atomic snapshot/subscription joining, independent
  consumers, explicit coverage, and unsupported-selector rejection. `Coverage`
  still needs a concrete scoped-reason type when contracts are detailed, but the
  candidate already distinguishes degraded results from empty successful capture.
- Multiple independently creatable streams are realizable through
  `indexes.create/open` and each index's `watch`; do not replace them with one
  hard-coded transcript feed. The agent surface exposes those same operations.
- §9 correctly separates serializable recipes from packaged procedural parsers.
  §10's authoring operations need no new ACP/A2A domain model to satisfy this brief.
- §9 keeps WXT packaging independent of unverified Vite+ substitution. §13 keeps
  browser MSW and service-worker-blocked Playwright routing as separate test modes.
- §11 correctly separates native find, retained-content search, and offline
  discovery; it does not claim `beforematch` searches absent text or yields queries.
- Realm pooling, browser-local durability, and IndexedDB are labeled proposals,
  not user mandates. No corrective package/backend replacement is warranted here.

## Forks to leave open

For streaming, fixture tests should choose body-iterable versus tagged-chunk input:
prefer the former if hosts expose one cancellable body naturally; prefer the latter
if recording/replaying independently routed lifecycle events is materially simpler.
Both need per-stream identity and terminal outcomes. For query ownership, select
lazy subscriptions versus explicit handles by exercising read-only authoring and
the signal adapters; neither choice justifies a global singleton or new signals core.
