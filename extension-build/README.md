---
type: ImplementationGuide
title: Building inspectable libraries and a real browser fixture
description: Verified tsdown distribution, WXT module preservation, and extension capture boundaries.
status: implemented
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra#medium"
sources:
  - resource: "opencode://ses_ea4d36447ffewTLi2X0SImAY6W"
    title: Baseline type repairs, module-preserving build, and packaged Chromium capture proof
  - resource: "../design/reactive-indexes/draft0.gpt6am.md"
  - resource: "../design/reactive-indexes/draft1.gpt6am.md"
  - resource: "file:///home/rektide/archive/wxt-dev/wxt/packages/wxt/src/core/builders/vite/index.ts"
  - resource: "https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/basics"
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/userScripts"
---

# Inspectable extension build

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
pnpm test
pnpm test:e2e
```

Build before checks/tests on a fresh checkout: workspace imports deliberately resolve the **distribution**, not exported source files. `pnpm build` builds the five libraries in dependency order, builds the WXT fixture, and executes [distribution verification](verify.ts). The workspace excludes independent `experiments/` packages.

## What the files actually are

- `schema`, `signals`, `store`, `indexer`, `extension-kit`: tsdown 0.15.12, `unbundle: true`, ESM `.js` and declarations per reachable module. For example, `indexer/dist/shapes/conversation.js` and `store/dist/idb.js` remain separate files. Package exports point to `dist/index.js`/`dist/index.d.ts`; verification imports these files in Node.
- [WXT fixture configuration](../extensions/fixture/wxt.config.ts): WXT 0.21.4 / Vite 8.3.4. The background entrypoint declares `type: "module"`. Its Vite build group uses `preserveModules` and strict entry signatures, retaining the background/popup dependency tree under `.output/chrome-mv3/modules/`. Dependencies have package-manager paths inside that tree; they are real packaged files, not bare imports requiring runtime Node resolution. Tree-shaking can leave empty modules or remove unused exports; this is not a byte-for-byte source copy.
- MAIN capture and ISOLATED relay remain independent **IIFE bundles** under `content-scripts/`. WXT's default library-mode content-script builder requests IIFE output. Per-entrypoint packaging alone would not make it unbundled. The ESM preservation hook intentionally targets the background/popup group only.
- Production output is unminified with sourcemaps. Load `extensions/fixture/.output/chrome-mv3` unpacked. `pnpm dev` starts WXT after building libraries; rebuild libraries after changing them.

Chrome supports static imports in a module extension service worker; dynamic `import()` there is unsupported. This is why a static packaged module tree is the appropriate background layout. The [browser proof](../harness/README.md) tests the produced artifact, including its manifest and module imports.

## Reader boundary and evidence

[ReaderSpec](../extension-kit/src/dsl.ts) is a typed packaged-code interface: `match(capture)` and `read(capture, context)` return MIME/URI/body puts and a scoped observation. The [fixture reader](../extensions/fixture/reader.ts) emits an OTel-shaped trace and a thin conversation metadata document. It is a concrete compiled reader, not a general DSL compiler or remotely loaded agent.

[ingest](../extension-kit/src/ingest.ts) first commits one content-addressed aggregate containing source reader/version/provider/account, the capture, coverage scope, and exact input puts. Binary bodies use explicit byte arrays; strings use an explicit UTF-8 representation tag. This makes coverage inspectable with its inputs. Projection puts follow, then the background explicitly refreshes `transcripts`. There is no journal or atomic multi-document projection transaction. The aggregate survives a projection failure; automatic replay/reconciliation is not implemented. Consumers needing a consistent pair should use the aggregate, not assume two independently read projected documents are one transaction.

The current fixture uses one provider/account/conversation and one full response. Its title is duplicated as legacy trace fallback for the existing index. No general precedence resolver has landed. Partial coverage is preserved without an implicit deletion rule. The round-two [design](../design/reactive-indexes/draft1.gpt6am.md) explains the later resolver and publication boundary.

## Runtime script path

Ordinary extension pages/background code cannot treat fetched JavaScript as a new privileged module. That does **not** mean runtime-generated JavaScript is impossible in MV3: Chrome's `userScripts` API explicitly supports user-provided `{ code }` strings via registration and Chrome 135+ one-shot execution. It requires `userScripts`, host permissions, and the user's relevant toggle (Allow User Scripts in Chrome 138+). Availability probes must await `getScripts()` and handle both synchronous and asynchronous failure. USER_SCRIPT messaging uses `configureWorld({ messaging: true })` and dedicated runtime events. Extension updates clear registrations, so artifact persistence belongs outside the browser registration list.

Follow-on agent dispatch can supply a versioned script artifact plus desired match scope to that adapter, with observation results crossing the same plain MIME/URI/bytes boundary. This fixture does not exercise `userScripts`, an agent transport, or ATProto publication. The parent-owned reader-loop experiment owns that next seam. Browser API capability is distinct from store acceptance policy.

## Current capture limits

The page-to-isolated `postMessage` channel is page-origin evidence, not an authenticated source; a page can fabricate it. The background constrains sender origin, response shape/size, and endpoint to the fixture. It does not expose general store operations to website messages. Captured text is displayed through `textContent`.

The fetch hook resolves relative URLs, clones responses without replacing the page's Response identity, and parses SSE CR/LF/CRLF framing across byte boundaries. Its body clipping is currently a string-length limit after buffering, not a bounded streaming byte reader. Request streams/FormData are not captured. XHR and abort/error behavior need broader browser fixtures before promoting the hook beyond the local demo. Search is token-AND per field, not literal browser find.
