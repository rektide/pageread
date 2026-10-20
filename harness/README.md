---
type: VerificationGuide
title: Packaged extension browser proof
description: Run and interpret the real MAIN-to-background capture fixture.
status: implemented
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra#medium"
sources:
  - resource: "opencode://ses_ea4d36447ffewTLi2X0SImAY6W"
    title: Real MSW browser interception and packaged-extension persistence smoke
  - resource: "../design/reactive-indexes/draft1.gpt6am.md"
  - resource: "../extension-build/README.md"
---

# Browser proof

`pnpm test:e2e` builds the production extension, starts the Vite fixture, and runs [Playwright](browser/extension.spec.ts). To run just the browser check against an existing build:

```sh
pnpm --filter @pageread/browser-harness test:e2e
```

The Linux harness uses the newest `chromium-N` installation in `PLAYWRIGHT_BROWSERS_PATH` or `~/.cache/ms-playwright`; `PAGEREAD_CHROMIUM=/absolute/path/to/chrome` overrides it. Verified here with cached Chromium 1228 and Playwright 1.64.1, using full Chromium in headless mode with extension flags. Browser profiles are unique under `/tmp/opencode` and removed after each test. No live Chrome MCP profile is used.

## Assertions

1. The actual fixture page starts an MSW browser service worker and fetches relative `/api/conversation` on a button click.
2. The packaged MAIN hook observes the real fetch response. ISOLATED forwards it to the extension worker.
3. A packaged typed reader generates trace and conversation puts. IDB stores an aggregate observation binding exact inputs and coverage, then projected documents and the named `transcripts` snapshot.
4. The actual extension popup reads the worker and displays the conversation. Token search for `orchid` returns a message field.
5. The preserved capture has an absolute URL and the MSW-specific response header. Its scoped observation has both input puts.
6. The browser closes and reopens the same profile; the extension reads the persisted content again and explicitly rebuilds its view.

This is restart readback with explicit refresh, not journal replay, notification continuity, or a forced worker crash between related puts. Unit tests separately exercise byte-split SSE framing and binary-input observation preservation. The current browser fixture covers complete JSON fetch only. The proposed older partial/newer streaming/branch-switch cases in the [design](../design/reactive-indexes/draft1.gpt6am.md) remain future resolver fixtures.

## Manual inspection

Run `pnpm --filter @pageread/browser-harness dev`, load `extensions/fixture/.output/chrome-mv3` unpacked, open `http://127.0.0.1:4173`, and click **Load conversation**. Open the extension popup and refresh. The response JSON contains `view`, token `hits`, and persisted `entries`, so the source envelope and both input documents can be inspected alongside the snapshot.

Build/output details and the follow-on runtime-script boundary live in the [build guide](../extension-build/README.md).
