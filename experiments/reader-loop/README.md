---
type: Experiment
title: Page-to-agent reader loop
description: A runnable prompt, returned-script, registry and execution experiment with a Chrome userScripts adapter.
status: experimental
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Commissioned isolated experiments, implemented reader dispatch and operation registry, verified fixture execution
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/userScripts"
    title: User script registration, one-shot execution, API availability and update lifecycle
  - resource: "https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code"
    title: Distinction between packaged extension code and user scripts
  - resource: "/design/reactive-indexes/draft1.gpt6am.md"
    title: Preserve scoped evidence and keep transport seams independent of durable journals
---

# Page-to-agent reader loop

An isolated TypeScript experiment for:

```text
page evidence + task → HTTP agent request → JavaScript artifact
                   → registry → runtime registration → run on current page
```

## Run

From this directory:

```sh
pnpm install
pnpm demo
pnpm test
pnpm check
```

The demo uses **MSW as the agent endpoint and jsdom as the execution target**.
It sends the generated prompt over intercepted HTTP, receives a reader,
executes it on two fixture messages, and preserves the artifact and operation
under `.data/`. It reports both messages and `phase: "completed"`.
It does not contact a live model or control a browser tab.

The tests cover HTTP evidence delivery and artifact persistence after reopening,
inspection while generation is pending, retention after registration failure,
malformed responses, and Chrome adapter error propagation.

## Modules and boundaries

- `src/index.ts`: `AgentTransport`, `ReaderRuntime`, `Registry`, the orchestrator,
  an explicitly experimental HTTP transport, and a Chrome `userScripts` adapter.
- `src/files.ts`: Node file registry; separate operation and artifact records.
- `demo.ts`: fixture wiring. Production must supply a real agent transport and
  browser runtime. The HTTP contract is **not ACP or A2A**.

The operation registry records `awaiting-agent → registering → executing →
completed`, or `failed`. Artifacts survive a failed registration or execution.
Records are copied at memory boundaries; file writes replace a single JSON file
atomically. This supplies an inspectable working model of inflight operations.
It does not provide durable event replay, cross-process leases, cancellation,
automatic restart recovery, or atomic multi-record writes. An unfinished record
after process death means interrupted/unknown, not proof that work is still alive.

## Chrome execution path

Call `chromeUserScripts(chrome.userScripts)` inside an extension with the
`userScripts` permission, applicable host permissions, and the browser's user
scripts setting enabled. One-shot execution requires Chrome 135+. Chrome 138+
uses the extension-specific **Allow User Scripts** toggle; older versions use
Developer mode. API calls may reject even when the API object remains defined.

The adapter registers or updates a script and executes its expression in the
`USER_SCRIPT` world. It has been tested against a structural API double, **not
yet in Chromium**. Registration match patterns govern future injections; callers
must also choose an appropriate current tab for explicit execution. Registration
and execution are separate side effects, not an atomic transaction.

A registered expression will execute on matching future pages, but its return
value is not automatically collected. Automatic future capture needs a packaged
result-delivery wrapper and `configureWorld({messaging: true})` with
`runtime.onUserScriptMessage`. The current one-shot path receives results through
`userScripts.execute`. Extension updates clear registered scripts: the retained
artifact registry is the source for deliberate re-registration.

This is the documented user-supplied-script mechanism, distinct from loading
remote modules as extension implementation code. Browser API availability does
not establish Chrome Web Store acceptance of a particular product.

## Connections

- [Graph experiments](../graphs/README.md): observations from readers can feed
  graph projections; this loop itself makes no RDF mapping decisions.
- [Publishing experiments](../publishing/README.md): `code` plus MIME/runtime/
  match metadata is the publication input. Publishing, registration and execution
  are different operations. No network publication is performed by this demo.
- [AM round two](/design/reactive-indexes/draft1.gpt6am.md): the eventual ingestion
  seam must preserve observation scope and exact inputs. This experiment passes
  capture coverage in the prompt; it is not a resolver or coverage validator.
