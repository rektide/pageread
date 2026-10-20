---
type: Audit
title: "Contamination audit for the pageread tabula-rasa design"
description: "Exclusion map, bias categories, and provenance limits for independent pageread design; paths and decision kinds only, no existing solutions."
resource: "/design/tabula-rasa/bias-audit0.glm53fx.md"
status: draft
generated:
  at: 2026-10-20
  by: "model:zai-coding-plan/glm-5.3-flash#max"
sources:
  - resource: "opencode://ses_ea510cab7ffexH6L4EDk85goSE"
    title: "Contamination scout session producing this exclusion map"
  - resource: "/README.md"
    title: "Read to classify mission-level seed vs. contamination"
  - resource: "/package.json"
    title: "Read to separate operational scripts from architecture wording"
  - resource: "/pnpm-workspace.yaml"
    title: "Read as evidence of premature workspace decomposition"
  - resource: "/schema"
    title: "Path and size enumeration only; contents not read"
  - resource: "/signals"
    title: "Path and size enumeration only; contents not read"
  - resource: "/store"
    title: "Path and size enumeration only; contents not read"
---

# Bias audit — pageread tabula-rasa design

Read-only contamination audit of `/home/rektide/src/pageread`, performed
2026-10-20 before an independent, tabula-rasa design effort. Tells later agents
what NOT to read, which decision kinds are prematurely fixed, and what
provenance is known — paths and decision kinds only, no existing interfaces,
data shapes, or solutions. Evidence: see [Audit sources](#audit-sources).

## Provenance discipline

- **Authorship and acceptance of the pre-existing repo state are unknown.** All
  commits share one VCS identity, used by humans and agents alike here;
  identity proves nothing. Never infer authorship or acceptance from history.
- The only supported attribution basis is the **visible conversation**: the
  items in the next section were committed by an earlier assistant during this
  effort's chat, so they are attributable as assistant assumptions — not human
  requirements. Everything else on disk remains **provenance unknown**.

## Excluded paths

Later agents (parent, research waves, implementers) must not read these. "Leak
risk" is what reading would transmit.

| Path | Decision kinds prematurely fixed there | Leak risk |
| --- | --- | --- |
| `schema/` | microdata vocabulary and record model; identifier scheme; trace/event adaptation shape | high |
| `signals/` | reactivity primitive selection; routing and subscription semantics | high |
| `store/` | store facade interfaces; cache-validation semantics; storage backend choice | high |
| `pnpm-workspace.yaml` | workspace package decomposition, including declared-but-unbuilt package names | high |
| `package.json` | `description`, `keywords`, and build-filter fields carry architecture wording; `scripts` are operational | medium |
| `pnpm-lock.yaml`, `node_modules/` | concrete third-party dependency selections | high |
| `README.md` (repo root) | lines 1–3 are mission-level; the remainder carries unbriefed product ideas | medium |
| `pageread.ts` (repo root) | empty placeholder; nothing to read | none |
| `.jj/`, git history | commit messages may carry design wording | medium |
| `tsconfig.base.json`, `.oxlintrc.json`, `.gitignore` | operational config only | low — safe |

Operational commands safe to run without reading excluded files: `pnpm install`;
the `pnpm build` / `pnpm check` / `pnpm test` aggregators;
`pnpm -r check:types`; `pnpm -r test`; `oxlint`; `oxfmt`. Run them as commands;
do not read the manifest fields behind them.

## Bias categories and what to reopen

### Attributed assistant assumptions — reopen in the independent design

Known only from the visible conversation; two were not located on disk at audit
time (the audit opened no source contents):

- a custom TC39-style signals core/package (vs. any other primitive/library);
- mandatory Rust scaffolding (user scope: Rust optional, tracing-test if used);
- a concrete IndexedDB store backend;
- a fixed workspace package decomposition, names fixed before any design;
- a MAIN-world interception plan (not located on disk at audit time);
- a span/session mapping (not confirmed on disk at audit time).

### User-selected feature requirements — keep as requirements

These stay; their pre-existing implementations remain excluded reading so the
new design is not anchored to concrete interfaces:

- Cache-shaped store with a ContentIndex-like API;
- network-primary capture with DOM fallback and query walks;
- a shared observation router with multiple consumers;
- multiple independent reactive indexes;
- MSW contexts; tracing-test if Rust is used;
- a reusable extension-writing toolkit with a DSL;
- WXT / Vite+ preference.

### Provenance unknown — treat as contamination, do not attribute

Everything not covered above: schema vocabulary, record, identifier, and
trace/event shapes; store interface details beyond the user-named shape;
dependency selections; toolchain choices beyond global Rekon defaults; README
ideas beyond the mission line.

## What this audit did not find

No pre-existing design or doc corpus exists in this repo: no `design/` or
`doc/` directory, no repo `AGENTS.md`, `CLAUDE.md`, `CONTEXT.md`, or
`llms.txt`, and no `~/wiki` or `~/archive` copies. Nothing was rewritten;
`design/tabula-rasa/` is new.

## Exclusion protocol (reusable for later agents)

1. Scope: all pre-existing pageread material is out of bounds — every
   pre-existing source tree (`schema/`, `signals/`, `store/`, root
   `pageread.ts`), every manifest/config, `node_modules/`, the root `README.md`,
   and all VCS history and commit messages.
2. Do not read excluded material, and do not derive requirements, names,
   shapes, or scope from it — even negatively ("the old code did X, so we
   avoid X" is still contamination).
3. Allowed inputs: the approved brief [brief0.gpt6a.md](brief0.gpt6a.md), user
   statements made in the live session, and primary sources fetched fresh
   (spec/vendor documentation for OTel semantic conventions, browser APIs,
   WXT/Vite, Playwright, MSW, and similar). Prefer primary sources over any
   summary, including this one.
4. Research waves and other subagents receive the excluded-path table and this
   protocol verbatim in their prompts; there is no repo-local `AGENTS.md`
   guardrail to rely on.
5. Scratch work goes in `.test-agent/<topic>/` (gitignored); durable outputs
   only under `design/tabula-rasa/`.
6. Acceptance requires an explicit user statement. Never infer it from VCS
   identity, file presence, or commit timing.
7. If excluded files must be touched operationally (install, build), run
   commands only; do not open design-bearing fields or files.

## Companion documents

Created by the parent after this audit; intentionally dangling at commit time:

- [brief0.gpt6a.md](brief0.gpt6a.md) — the new user-grounded ask;
- [design0.gpt6a.md](design0.gpt6a.md) — independent candidate design;
- [README.md](README.md) — navigation for this corpus.

## Audit sources

What this audit itself opened, with narrow purpose; source-tree contents were
not read (names and sizes only):

- `README.md` — classify mission-level seed vs. contamination.
- `package.json`; `pnpm-workspace.yaml`; `.gitignore` — scripts-vs-wording
  split; decomposition evidence; scratch/output conventions.
- Path/size enumeration over `schema/`, `signals/`, `store/` — implementation
  is substantive; no contents read. `pageread.ts` — confirmed empty.
- `jj log` — identity/time line grounding the provenance limits above.
- `~/wiki`, `~/archive` existence checks — no external copies found.
- Session `opencode://ses_ea510cab7ffexH6L4EDk85goSE` — the audit's own record.

## Verification

Line count within the 100–160 budget; relative links enumerated and matched
against the companion list; no code, test, or build tasks run. Single
explicit-path jj commit.
