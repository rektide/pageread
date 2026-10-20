---
type: DesignReview
title: "Wave 1 — content and index contract falsification"
description: "Prioritized implementation-blocking gaps in conditional writes, publication, state replay, projection progress, and durability."
resource: /design/tabula-rasa/review1-content.gpt61s.md
status: draft
generated: { by: "model:openai/gpt-6.1-sol#medium", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea50ff0acffevf3FXaD3OV4buy"
    title: "Independent wave 1 adversarial review of the clean-room candidate; only the three authorized documents read"
  - resource: /design/tabula-rasa/brief0.gpt6a.md
    title: "Commission capabilities and explicit distinction between requirements and proposed decisions"
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: "Candidate reviewed at parent-reported checkpoint e16851b7; target sections and line references refer to this reading"
  - resource: /design/tabula-rasa/research0-content.gpt61s.md
    title: "Own wave 0 findings on semantic fidelity, revisions, replay, and independent indexes"
extensions:
  verification: "Document-level falsification only; no code, tests, new external research, sibling reviews, or excluded repository material inspected."
---

# Wave 1: fix the observable tokens and commit boundaries
The architecture preserves the human requirements well. These are proposed
contract corrections, not additional user requirements. Six gaps matter before
meaningful implementation; package/crate allocation can remain hypothetical.

## P1 — Index conditional writes require a token no index read returns
**Target:** §8 “ContentIndex-like collections,” lines 472–488; shared
`WriteCondition`, lines 426–429; §10 agent operations.

`index.add/delete` require `expectedRevision`, but `IndexEntry` contains no
membership revision. `getAll/watch` therefore cannot supply the required token.
`content.revision` versions a representation; a snapshot cursor versions an index
boundary. Neither is the revision of this membership. Renaming a metadata-only
entry is impossible to perform safely through the sketched public API.

**Correction:** return versioned entry envelopes from reads, changes, and write
receipts. Name the token scopes explicitly: representation revision, membership
revision, view revision, stream cursor, publication ID. Define create-only versus
update/delete conditions and whether deletion/recreation creates a new generation
or revision, preventing stale writes from passing an ABA cycle.

**Falsification:** two agents enumerate one metadata-only entry, then update its
title concurrently. Both must obtain usable preconditions; exactly one stale
update must conflict. No content token or index-wide cursor is substituted.

## P1 — Atomic publication cannot yet be called or reference its new bodies
**Target:** §3 `publish`, line 107; §8 “Publication and persistence,” lines 520–535;
§10 public operations, lines 631–638.

The proposed transaction includes representation writes, semantic-item updates,
and membership updates, but has no batch/request/receipt contract. New
`ContentRef` revisions are returned only after `content.put`. A caller cannot
construct a referencing membership in the same batch unless references can name
pending writes or the caller allocates revisions. Semantic-item revision reads
and preconditions are also absent. Separate `put` and `index.add` calls do not
provide the promised atomic publication.

**Correction:** sketch one callable publication operation, with scoped target
preconditions, batch-local handles for new representations, and resolved references
in its receipt. Say where semantic items are read/versioned (e.g. an ordinary
semantic representation, or a separate explicit surface). Specify all-or-nothing
failure and whether standalone writes are one-target publications. Include the
operation in agent access when agents may perform coherent multi-target writes.

**Falsification:** create a message body plus semantic description plus two managed
memberships without publishing intermediate references. Crash/retry at commit;
all results and the original receipt remain coherent.

## P1 — State replay lacks an executable change algebra
**Target:** §7 `WatchFrame<T>`, lines 394–407; §8 `watch/getAll`.

`Change<T>` and `Cursor` remain opaque placeholders precisely where consumers
must reconstruct state and skip redelivery. There is no stated change identity,
delete-key representation, full-value versus patch rule, or relation between
`base` and the last applied cursor. This is not merely transport serialization:
two conforming consumers can currently reconstruct different states.

**Correction:** define keyed upsert/delete (or a precise alternative), stable
frame/change identity, transaction grouping, base validation, and snapshot
replacement semantics. Specify resume before any new snapshot, duplicate handling,
and what happens when a pinned pagination boundary expires. Keep this a retained
state-transition log, not a claim to uncaptured source events or intermediate DOM
states. Feed retention must remain separately advertised.

**Falsification:** snapshot A/B, receive delete A + update B, disconnect after
applying but before acknowledging, then replay that frame. A fresh consumer and
the resumed consumer must agree, including ordering and entry revisions.

## P2 — Overlapping indexes need an explicit content-following policy
**Target:** §8 `IndexEntry.content`, lines 480–488; derived definitions/progress,
lines 495–516; §12 steps 4–6; §13 independent-index verification.

Entries can pin content or only identify a resource, but the design does not say
whether a resource-only member follows current heads, which representation it
selects, or whether a content edit emits an index change. This makes “follow this
conversation's messages” ambiguous when membership stays constant. A static
research pin and a current transcript legitimately need different behavior.

**Correction:** declare per-index/entry selection: metadata-only, exact pin, or
head-following with an explicit representation. State which dependencies invalidate
derived entries, and whether resource-only views require a separate content
subscription. Branch selection must not advance unrelated pinned memberships.

**Falsification:** one message appears in a live transcript, a pinned research set,
and two branch views. Edit its Markdown variant and switch selected branch;
assert exactly which refs, memberships, and watch notifications change.

## P2 — Projection restart and “wait until applied” need a progress commit rule
**Target:** §8 lines 500–506 and 527–531; §9 source-epoch state, lines 596–605.

Applied input boundaries and waiting for projections are promised but not exposed
as a callable/result contract. On restart, persisting a watermark ahead of outputs
loses changes; persisting outputs ahead of the watermark can duplicate effects.
Several independent inputs also cannot be summarized by one incomparable cursor.

**Correction:** expose progress per input identity/generation plus failed/reset
state; define waiting for a publication and its failure outcome. Atomically commit
projector outputs with progress, or use idempotent recoverable application. Distinguish
durable input replay from parser replay; a stateful decoder needs a retained prefix
or checkpoint, not merely any retained final response.

**Falsification:** crash between projector output and progress advancement, restart
with two input indexes, and replay. No lost entry, duplicate effect, or false
“applied” result; unavailable input history produces an explicit rebuild/reset.

## P2 — “Durable” needs a bounded failure model, not only an adapter name
**Target:** §8 lines 522–542; §13 durable-publication scenario.

“Body is durable” and “one local transaction” do not define whether acknowledgment
survives worker suspension, browser crash, OS/power failure, or later eviction.
Persisted idempotency receipts and cursor epochs/retention metadata also determine
whether retry/resume works after restart; they cannot be merely in-memory state.

**Correction:** state the reference host's acknowledged-commit failure guarantee
and retention limits; persist retry outcomes and continuity metadata accordingly.
Treat stronger physical durability as a capability, not an implication of
IndexedDB or a hypothetical Rust host. Test only the failure classes claimed.

**Falsification:** lose the acknowledgment, restart the host, retry the operation,
then resume its changes. The same outcome is returned or an explicitly documented
retention/reset result—not an unrelated second successful publication.

## Boundaries that should remain intact
§5 correctly avoids dotted microdata names, message-to-span coercion, invented
timing/usage, and standardizing custom OTel references. §8's variant key solves
fragment-key collisions; specify the explicit unknown-MIME encoding when making
the types executable. ACP/A2A are correctly adapters, not storage authorities.
§10's Rust responsibilities remain optional and do not require new crates now.
No new primary-source factual contradiction was established in this review.
