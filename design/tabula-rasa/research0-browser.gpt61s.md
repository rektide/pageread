---
type: Research
title: "Browser observations, live queries, and extension authoring — independent wave 0"
description: "Tabula rasa primary-source research and an independent observation-session proposal, without reading pageread material."
resource: /design/tabula-rasa/research0-browser.gpt61s.md
status: draft
author: "model:openai/gpt-6.1-sol#medium"
date: 2026-10-20
sources:
  - resource: "opencode://ses_ea5103182ffeZEKBEjHks2vnSJ"
    title: "Independent browser and live-query research; initial findings and commissioned persistence without project reading"
  - resource: "https://html.spec.whatwg.org/multipage/interaction.html"
    title: "Hidden-until-found, ancestor revealing, and find-in-page"
  - resource: "https://dom.spec.whatwg.org/"
    title: "Static query results and MutationObserver semantics"
  - resource: "https://html.spec.whatwg.org/multipage/microdata.html"
    title: "Microdata names, values, and property association"
  - resource: "https://wicg.github.io/content-index/spec/"
    title: "Offline content discovery, separate from caching and text search"
  - resource: "https://w3c.github.io/ServiceWorker/"
    title: "Cache and CacheStorage"
  - resource: "https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts"
    title: "Execution-world isolation and CSP"
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/webRequest"
    title: "Network observation capabilities and limitations"
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/debugger"
    title: "CDP transport, available domains, and frame targets"
  - resource: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/find/find"
    title: "Firefox extension-initiated find and match information"
  - resource: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData"
    title: "Firefox response filtering and permissions"
  - resource: "https://playwright.dev/docs/network#missing-network-events-and-service-workers"
    title: "Service-worker and MSW routing caveats; also checked archived maintainer documentation"
  - resource: "https://playwright.dev/docs/locators#locate-in-shadow-dom"
    title: "Playwright shadow-root locator semantics"
  - resource: "https://playwright.dev/docs/api/class-browsercontext#browser-context-add-init-script"
    title: "Early scripts and unspecified ordering between separate registrations"
  - resource: "https://wxt.dev/guide/essentials/config/vite"
    title: "WXT Vite configuration and plugin caveats; also checked archived maintainer documentation"
  - resource: "https://wxt.dev/guide/essentials/content-scripts"
    title: "Worlds and script injection; archived guide checked against current compatibility data"
  - resource: "https://viteplus.dev/llms-full.txt"
    title: "Vite+ ecosystem integration and dependency alignment; also checked archived documentation"
  - resource: "https://mswjs.io/docs/integrations/browser/"
    title: "Hosting and awaiting the browser service worker"
  - resource: "https://github.com/tc39/proposal-signals"
    title: "Stage 1 signal graph proposal and framework-owned effect scheduling"
  - resource: "https://github.com/preactjs/signals/blob/main/packages/core/README.md"
    title: "Preact signal APIs and resource ownership hooks"
  - resource: "https://docs.solidjs.com/reference/reactive-utilities/from"
    title: "Subscribable interoperability and owner-dependent cleanup"
  - resource: "https://opentelemetry.io/docs/specs/otel/trace/api/"
    title: "Operations, spans, events, and lifecycle"
  - resource: "https://github.com/mdn/browser-compat-data/blob/main/api/Element.json"
    title: "beforematch browser support cross-check"
  - resource: "https://github.com/mdn/browser-compat-data/blob/main/webextensions/api/find.json"
    title: "Extension find API browser support cross-check"
  - resource: "https://github.com/mdn/browser-compat-data/blob/main/webextensions/api/scripting.json"
    title: "MAIN execution-world browser support cross-check"
  - resource: "https://developer.mozilla.org/en-US/docs/Web/API/Response/clone"
    title: "Response cloning and unbounded slower-branch buffering caveat"
verification:
  scope: "Documentary research against primary specifications, maintainer documentation, and compatibility data. No implementation or browser behavior tests."
extensions:
  commissioned_context: /design/tabula-rasa/brief0.gpt6a.md
  forthcoming_synthesis: /design/tabula-rasa/design0.gpt6a.md
  independence: "No pre-existing pageread content, sibling outputs, code, configuration, dependencies, history, or issues read."
---

# Browser observations, live queries, and extension authoring

## Commission and boundary

The original commission was an independent research wave for pageread's fresh
feature/interface design, not implementation:

> Research independently how web observations, browser find, live selectors,
> reactive consumers and extension building should fit. Investigate browser
> Ctrl+F hooks and limits; shared live-query semantics; network/DOM extraction
> across extension worlds and Playwright; WXT/Vite+ compatibility; and the
> boundary between DSL declarations and executable plugins. Present alternatives,
> an independent proposal, interface semantics, failure/cleanup/backpressure/
> revision semantics, uncertainties, falsification cases, and primary references.

User-grounded requirements supplied with that commission: read one's own ChatGPT
sessions; network primary; MutationObserver fallback **and** explicit entity walks
through querySelector iteration or live/signal selectors; consumers sharing
observation infrastructure; microdata with adapted OTel vocabulary; traces/events;
multiple reactive content indexes; future Playwright reuse; MSW simulated contexts;
WXT preferred and Vite+ floated; extension-writing toolkit and DSL; possible later
ACP extension-writing session/A2A.

The anti-anchoring boundary prohibited reading **all pre-existing pageread
content**, including code, docs, approach, configuration, dependencies, history,
issues, and other agent outputs. Only inherited/global instructions and third-party
sources were used. Archived third-party checkouts were checked first. No personal
ChatGPT access was attempted. This file is the only commissioned project write;
no implementation or tests were commissioned.

The parent's [approved brief](./brief0.gpt6a.md) is commissioned context, and
[design synthesis](./design0.gpt6a.md) is a forthcoming integration destination.
Neither was read or used as research evidence. These links do not imply acceptance
of this independent proposal or that the forthcoming file already exists.

## Independent recommendation

Make pageread an extension-writing toolkit centered on explicitly owned
**observation sessions**. Network capture, DOM entity walks, live queries,
semantic extraction, and multiple indexes cooperate through a session. Browser
privileges, signal ecosystems, and extension packaging remain adapters rather
than assumptions embedded in the observation model. This implies no package split,
global singleton, wire protocol, injection mechanism, or storage implementation.

## 1. Browser find: distinguish unrelated facilities

### Sourced facts

| Facility | Provides | Does not provide |
| --- | --- | --- |
| `beforematch` / `hidden="until-found"` | Reveal already-present hidden content targeted by find-in-page or fragment navigation. | General Ctrl+F-open events, query strings, all matches, or search over absent content. |
| Content Index API | Register offline-content URLs and descriptive metadata against a service-worker registration for discovery. | Full-text indexing, Ctrl+F integration, change feeds, or content storage. |
| CacheStorage | Explicit request/response storage, useful for offline resources. | Automatic HTTP-cache access, network capture, semantic indexes, or browser-find integration. |

HTML's ancestor-revealing algorithm fires a generic bubbling `beforematch`, removes
`hidden`, and reveals the content before scrolling. Fragment navigation can also
trigger it: it is not proof that the user searched. The event contains no query.

`hidden="until-found"` requires suitable layout containment; `display:none`,
`display:contents`, or `display:inline` can prevent intended reveal behavior.
Matching text must already be represented: an empty placeholder cannot make the
browser discover absent text and request its retrieval.

Find-in-page can affect document selection, but the HTML standard permits different
update timings. Selection changes are not a dependable query/match observation
API. Firefox's extension `browser.find` initiates searches and can return match
ranges/rectangles; it does not observe the user's native search UI. Current
compatibility data says Chrome and Safari do not implement this extension API.

Compatibility data checked during research records `beforematch` in Chrome 102,
Firefox 139, and Safari 26.2. HTML's embedded compatibility summary was stale
relative to that data. Target-browser tests should determine actual behavior.

### Recommendation

Expose four separate capabilities:

1. Native-find participation through an explicitly enabled materialized transcript.
2. Pageread search through its own indexes and source-entity navigation.
3. Optional offline discovery through Content Index in an owned reader.
4. Optional offline resource storage through CacheStorage.

For ChatGPT, an owned reader with captured conversation text is a cleaner
native-find surface than silently duplicating a transcript inside the host page.
Host-page participation remains plausible, but duplicate matches, accessibility,
layout, and reveal behavior need deliberate evaluation.

## 2. Live-query semantics and sharing

### Platform facts

`querySelectorAll()` returns static membership, not a live collection. Its returned
elements remain mutable: freezing an array does not freeze their content.
MutationObserver observes configured tree/attribute/character-data mutations,
not all changes to selector truth. Focus, hover, property-only checkedness, URL
state, and layout predicates may need other invalidations.

Native queries do not automatically traverse frames or shadow roots. A document
observer does not cover shadow-tree interiors, and attaching a shadow root to an
existing host is not an ordinary document child insertion. Playwright locators
have different semantics: they normally pierce accessible shadow roots, while
closed roots are unsupported.

### Recommended distinctions and interface

- **Entity walk:** finite explicit extraction from declared roots now.
- **Live membership:** maintained ordered element membership.
- **Live projection:** maintained extracted values, possibly with dependencies
  beyond those needed for membership.

Illustrative interface, not a final DSL or method-name commitment:

```ts
const session = await observe(target, { signal });

const snapshot = session.dom.walk({
  roots,
  selector: "[data-entity-id]",
  project: extractEntity,
});

const entities = session.dom.live({
  roots,
  selector: "[data-entity-id]",
  project: extractEntity,
  invalidation: {
    mutations: ["children", "attributes", "text"],
    events: ["input", "change"],
  },
});

const stop = entities.subscribe(commit => {
  // Initial snapshot, then revision-linked commits.
});
```

```ts
interface View<T> {
  read(): {
    revision: Revision;
    value: T;
    freshness: "current-at-commit" | "dirty";
  };

  subscribe(
    receive: (commit: Commit<T>) => void,
    options?: { signal?: AbortSignal }
  ): () => void;
}
```

Promise latest **committed** state, not that every synchronous DOM mutation is
already reflected by `read()`. Offer explicit refresh/flush when callers need a
new evaluation. Immutable extracted values can be revision-bound; raw DOM handles
cannot be treated as historical content snapshots.

### Initial snapshot/change join

For a new query: register observation before scanning; scan synchronously without
yielding; establish its initial revision; deliver that snapshot before later
commits; process queued invalidations through the same serial commit mechanism.

Mutation records are invalidation evidence, not a transaction log to replay into
the snapshot: a scan may already include the mutation's effect. For existing views,
subscription installation and selection of its initial snapshot must be one
operation from the consumer's perspective. Separate read/await/subscribe can miss
updates. Across frames, expose a revision vector or explicitly non-atomic aggregate
rather than claiming a single synchronous DOM snapshot.

### Sharing and ownership

Share observation within a declared owner, with consumer leases. Removing one
consumer must not stop others. Identical query specifications can share membership
evaluation; distinct projections can reuse membership without sharing schemas.
Root/selector alone is not a sufficient cache key: traversal, invalidation,
projection identity/version, and ordering also matter.

One observer per root is an implementation option, not an API law: an observer can
observe multiple roots. Ownership and teardown determine pooling. Sharing across
worlds, frames, or extension contexts requires an explicit bridge; no global
singleton is presumed.

### Rescan versus incremental maintenance

Start with batched rescan-and-diff for correctness. Incremental matching can later
optimize a proven subset. Arbitrary selectors require wider invalidation:

- `.enabled .entity`: ancestor attributes affect descendants.
- `li:nth-child(2)`: insertion changes sibling membership.
- `.card:has(.warning)`: descendant changes affect ancestors.
- Ancestors outside an Element query root can affect matching.
- Reordering changes result order even when membership is identical.

Document selector/invalidation profiles. Unsupported dynamic selectors require an
event adapter or explicit refresh, or rejection of the advertised live guarantee.

### Roots, frames, and shadow DOM

Declare traversal instead of inheriting a host tool's accidental semantics:

```ts
{
  frames: "this-frame" | "accessible-frames",
  shadow: "none" | "open-roots",
  ordering: "per-root-document-order"
}
```

Cross-origin frames need permitted per-frame contexts or automation support.
Navigation starts a new document epoch. Discovering newly attached open roots
needs registration, periodic discovery, or optional early instrumentation. Closed
roots report unavailable coverage, not empty success. Composed-tree extraction
needs `slotchange` and explicit assigned-node/fallback policy.

## 3. Reactive ecosystem portability

The current TC39 Signals proposal is Stage 1 and specifies graph semantics rather
than a standard application effects API; scheduling remains framework-owned.
Preact uses `.value`, computed values, effects, batching, and disposal. Solid's
`from()` accepts producers/subscribables, subscribes immediately, and relies on an
owner for automatic cleanup.

Recommend read/subscribe/dispose as the portability boundary, with optional
Preact, Solid, and proposed-TC39 adapters. This is bridging, not a claim that
reading one ecosystem's signal automatically tracks in another graph. Signals
represent current state; consumers needing every event/revision need a separate
event interface.

## 4. Network and DOM extraction across hosts

### Sourced facts

| Context | Capabilities and limits |
| --- | --- |
| Extension isolated world | Shares DOM, not page globals. Wrapping its own `fetch` does not wrap the page's `fetch`. |
| Main-world instrumentation | Can instrument page APIs; installation timing, saved references, workers, frames, interference, and page CSP matter. No retrospective capture. |
| Chrome `webRequest` | Request lifecycle and optional request bodies, not general response-body access. WebSocket handshakes, not established messages. Some cached requests invisible. |
| Firefox response filtering | `filterResponseData` exists with additional permissions and stream-lifecycle obligations; not a portable Chrome capability. |
| Chrome debugger | CDP transport with Network/Fetch facilities, explicit debugger permission, and frame/target management. |
| Playwright | Network events, responses, routing, and early scripts; service workers complicate interception. Init scripts run before page scripts, but order between separate registrations is unspecified. |

`Response.clone()` is not a bounded free tee: unread data can accumulate on the
slower branch without a limit. Whole-response retrieval is also not a substitute
for an intentionally supported streaming capture source.

### Recommendation

Negotiate capabilities such as response bodies, streaming bodies, WebSocket
frames, accessible frames, early instrumentation, and DOM fallback. Network-primary
means preferring supported network evidence, not pretending every host has the
same capture mechanism.

Treat main-world bridge payloads as untrusted data, never privileged commands.
Keep source identity and coverage visible. Let adapters define entity identity and
reconciliation rather than using arrival time as truth. DOM removal due to
virtualization, departure, or shutdown withdraws an anchor, not necessarily the
captured content entity.

## 5. WXT, Vite+, and MSW

WXT uses Vite and exposes Vite configuration/plugins, while explicitly warning
that its development/build orchestration can change plugin behavior. Vite+
documents Vite-ecosystem integration and dependency aliases needed to align
imports. No WXT-specific Vite+ compatibility guarantee was found in reviewed
documentation.

The archived WXT main-world guide's Chromium-only claim was outdated: current
compatibility data supports `scripting.ExecutionWorld.MAIN` in Firefox and Safari
too. This does not prove every manifest declaration or injection path is portable;
target API/manifest versions need verification.

Recommend WXT as extension build/lifecycle owner and Vite+ as optional tooling,
not a second extension builder. Gate dependency replacement behind compatibility
trials covering content scripts, background worker, UI, HMR, production output,
and target browsers.

MSW browser integration requires hosting its worker script and awaiting startup.
Use it in an owned simulated site rather than assuming installation on arbitrary
ChatGPT pages. Playwright documents that MSW-controlled requests bypass
`page.route()` / `context.route()` interception. Maintain separate test modes:

1. MSW enabled for realistic simulated application/network/DOM behavior.
2. Playwright routing with service workers blocked for interception-specific tests.

Blocking service workers is not a test of browser MSW.

## 6. Alternatives and choice

| Approach | Strength | Liability |
| --- | --- | --- |
| A. Live DOM-query toolkit with network enrichers | Small authoring model and excellent explicit entity walks. | Virtualized/unrendered content inaccessible; network becomes an adjunct. |
| B. Observation sessions with independent sources and reactive views | Shared infrastructure, network-primary plus DOM fallback, multiple indexes and hosts. | Requires explicit reconciliation, coverage, ownership, and revisions. |
| C. Automation-led capture using Playwright/CDP, extension as UI | Strong capture and reproducible testing. | Privilege, attachment, deployment, and normal browsing experience dominate. |

Choose **B**; retain A as a useful author interface and C as a supported host,
not the mandatory architecture.

## 7. DSL declarations versus executable plugins

Declare what can be inspected, validated, shared, permissioned, and tested before
execution; use plugins for behavior that cannot honestly fit that boundary.

| Declare | Execute through plugins |
| --- | --- |
| Origins, roots/frames, required capabilities | Protocol-specific stream parsing |
| Sources and supported fallback modes | Complex reconciliation and branching |
| Selectors and simple field projections | Application-specific extraction |
| Entity-key policy, schema/version references | Custom identity algorithms |
| Index definitions and freshness requirements | Tokenizers, embeddings, specialized indexing |
| Retention/redaction and fixture scenarios | Stateful navigation, pagination, hydration |
| Plugin identities, versions, capabilities | Stateful behavior with cancellation/cleanup |

A typed declarative object can test the boundary without inventing a textual
language first. Illustrative only:

```ts
defineObservation({
  targets: ["https://example.invalid/*"],
  requires: ["dom"],
  sources: [
    networkSource({ decoder: plugin("conversation-stream", "1") }),
    domSource({
      selector: "[data-entity-id]",
      extractor: plugin("conversation-entity", "1"),
    }),
  ],
  identity: plugin("conversation-identity", "1"),
  views: [
    index("text", { using: plugin("text-index", "1") }),
    index("structure", { using: plugin("conversation-graph", "1") }),
  ],
});
```

Avoid executable strings and gradually reimplementing JavaScript. Prefer packaged,
build-time plugins under explicit capabilities rather than downloaded/evaluated
code. ACP/A2A may later author and validate declarations/plugins without determining
the observation model now.

## 8. Revisions, failure, cleanup, and backpressure

Recommended public guarantees:

- **Revisions:** observation epoch, source sequence, entity revision, extractor
  version, and each index's applied revision remain distinguishable. Wall-clock
  ordering alone does not reconcile competing sources.
- **Conflicts:** preserve competing evidence or apply explicit source policy.
  Late arrival is not proof of newer content.
- **Index freshness:** independent watermarks; consistent cross-index reads need
  an explicitly requested common boundary.
- **State subscribers:** permitted coalescing; overflow produces explicit reset/
  snapshot rather than silent loss.
- **Event subscribers:** bounded queues and declared overflow policy. Do not call
  silent dropping lossless delivery.
- **Slow work:** cancel superseded extraction where possible and reject results
  from retired epochs. Bound response bytes/time and abandon capture explicitly.
- **Failures:** degraded/unavailable coverage differs from empty results. Plugin
  or consumer failure must not disable unrelated consumers.
- **Cleanup:** AbortSignal/unsubscribe releases leases, observers, event listeners,
  readers, and node references; in-flight operations end explicitly.
- **Patches:** restore APIs only when still owned; do not overwrite another tool's
  newer wrapper during teardown.
- **Privacy:** processing/persistence boundaries are explicit. Host-DOM annotations
  can disclose captured metadata to page scripts.

### Microdata and adapted OTel vocabulary

Microdata requires actual nested-scope, repeated-property, `itemref`, and
element-dependent value semantics. A descendant `[itemprop]` query is not a
complete parser. Plain property names cannot contain dots or colons: OTel keys
such as `service.name` need a mapping, URL-valued property names, or nested
attribute items.

Recommend a versioned vocabulary and explicit OTel mapping. Distinguish content
entities/revisions, observed operations/lifecycle events, and operational telemetry
about extraction/indexing. OTel spans represent operations, not arbitrary mutable
records. A span-like conversation projection must document its adaptation and
unknown timing, rather than claim standard OTel semantics. Do not infer generation
start/end from DOM mount/unmount, and do not impose span=message.

## 9. Falsification tests

Reject or revise this proposal if it cannot demonstrate:

1. Initialization joins deliver coherent initial snapshots and ordered changes
   without missed or duplicate logical updates.
2. Ancestor classes, `:has`, sibling insertion, reordering, and content-only edits
   yield correct membership/projection revisions.
3. Unsupported dynamic selectors disclose limitations rather than appear fully live.
4. Two consumers share observation; either can leave without harming the other;
   all leaving releases resources.
5. Virtualized removal preserves captured content while withdrawing DOM anchors.
6. Late network events cannot overwrite newer edits or another conversation branch.
7. Newly attached shadow roots and navigated frames update coverage correctly.
8. Large/infinite responses and slow consumers remain bounded or report loss.
9. Native find discovers materialized hidden text, while absent text is not
   advertised as natively searchable.
10. MSW scenarios work without relying on Playwright routing that MSW bypasses.

## 10. Uncertainties and decisive questions

Unverified: ChatGPT endpoints/protocols, identity/branch rules, virtualization,
CSP, and startup timing; actual WXT–Vite+ interoperability; target-browser find
behavior over extension-inserted transcript content. Start with synthetic trials,
then explicitly authorized site observation. Documentary verification is not a
runtime compatibility result.

Questions for the final designer:

1. Does native-find success mean host-page participation, an owned transcript
   reader, or independent pageread search?
2. Which capture privileges are acceptable: main-world instrumentation, debugger
   attachment, Playwright ownership, or selectable modes?
3. Does live mean latest committed state, bounded staleness, every event, or a
   consumer-selectable guarantee?
4. How should network/DOM conflicts and branches appear: preferred source,
   explicit alternatives, or adapter-defined reconciliation?
5. Are initial authors trusted TypeScript developers, declarative recipe authors,
   or untrusted/generated plugins needing a separate execution boundary?

## Source map

The frontmatter lists sources actually consulted. Key navigation:

- [HTML hidden/reveal](https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute)
  and [find-in-page](https://html.spec.whatwg.org/multipage/interaction.html#find-in-page)
  establish native-find limits; [Content Index](https://wicg.github.io/content-index/spec/)
  and [CacheStorage](https://w3c.github.io/ServiceWorker/#cachestorage) describe distinct facilities.
- [DOM](https://dom.spec.whatwg.org/#interface-mutationobserver) grounds query/
  observation semantics; [microdata](https://html.spec.whatwg.org/multipage/microdata.html#names:-the-itemprop-attribute)
  grounds vocabulary constraints; [OTel Span](https://opentelemetry.io/docs/specs/otel/trace/api/#span)
  grounds operation/event semantics.
- [Chrome worlds](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts),
  [webRequest](https://developer.chrome.com/docs/extensions/reference/api/webRequest),
  [debugger](https://developer.chrome.com/docs/extensions/reference/api/debugger),
  and Firefox's [response filter](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData)
  ground capability differences, not one universal network API.
- [WXT Vite](https://wxt.dev/guide/essentials/config/vite),
  [Vite+](https://viteplus.dev/llms-full.txt), [MSW](https://mswjs.io/docs/integrations/browser/),
  and [Playwright's service-worker caveat](https://playwright.dev/docs/network#missing-network-events-and-service-workers)
  ground build/test integration constraints.
- [TC39 proposal](https://github.com/tc39/proposal-signals),
  [Preact core](https://github.com/preactjs/signals/blob/main/packages/core/README.md),
  and [Solid from](https://docs.solidjs.com/reference/reactive-utilities/from)
  support portable adapters, not automatic shared tracking.

No surrounding-project doc-pass was performed: corpus/index inspection would
violate the commission's stronger no-project-reading boundary. The commissioned
brief/synthesis links above provide the authorized integration routes.
