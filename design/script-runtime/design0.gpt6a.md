---
type: DesignProposal
title: One reader host, discoverable scripts, composable installations
description: Script-first product direction, ATProto discovery and retrieval, installation lifecycle, and a companion PWA grounded in current web APIs.
resource: /design/script-runtime/design0.gpt6a.md
status: draft
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Human redirects emphasis from extension generation to discoverable installable scripts; installation API research and product restructuring
  - resource: /extension-kit/src/dsl.ts
    title: Existing packaged reader and extension declarations
  - resource: /experiments/reader-loop/src/index.ts
    title: Existing generation, artifact registry and Chrome userScripts adapter
  - resource: /experiments/publishing/src/schemas.ts
    title: Blob-backed reader records currently lack structured discovery targets
  - resource: /design/ontology/design0.gpt6a.md
    title: Sections 1–4 connect versioned procedures, execution attempts and observation provenance
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Sections 1–4 distinguish reader recipes, hosts and content capabilities
  - resource: /home/rektide/archive/bluesky-social/atproto/lexicons/com/atproto/repo/listRecords.json
    title: Paginated collection listing is per repository, not network-wide predicate search
  - resource: https://atproto.com/guides/overview
    title: PDS, relay and AppView roles in publication and discovery
  - resource: https://publicsuffix.org/learn/
    title: Registrable-domain grouping requires suffix data rather than label counting
  - resource: https://developer.mozilla.org/en-US/docs/Web/API/URLPattern
    title: URL-component matching distinct from browser extension match patterns
  - resource: https://developer.chrome.com/docs/extensions/reference/api/userScripts
    title: Script registration, update, execution, unregister and browser lifecycle constraints
  - resource: https://www.w3.org/TR/2026/WD-appmanifest-20261016/
    title: Web app identity, scope, launch, installation and manifest lifecycle
  - resource: https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent
    title: Limited-support nonstandard install-prompt interface
  - resource: https://raw.githubusercontent.com/MicrosoftEdge/MSEdgeExplainers/main/WebInstall/explainer.md
    title: Active navigator.install proposal for same-origin and catalog-driven PWA acquisition
  - resource: https://raw.githubusercontent.com/WICG/install-element/main/README.md
    title: Declarative install element incubation and changing URL/manifest designs
  - resource: https://raw.githubusercontent.com/WICG/get-installed-related-apps/main/README.md
    title: Related-app detection proposal rather than a general installed-app registry
  - resource: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target
    title: Receiving shared links, text and files in an installed PWA
  - resource: https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
    title: Sending content through the system share mechanism
  - resource: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers
    title: Installed PWA file association and launchQueue file delivery
---

# One reader host, discoverable scripts, composable installations

## Direction and standing

**The main product is a reader extension that acquires and runs scripts.**
Authoring creates scripts and recipes for that host. A person can generate a
reader, find someone else's, install a collection, or publish their own. Building
a new browser extension is an optional distribution target for those same inputs.

This emphasis is the human's current direction. The interfaces, record additions
and lifecycle below are proposals to implement it. Existing proofs demonstrate
individual seams; they do not yet constitute a live script-discovery service or
installed-reader manager. No existing package is moved by this document.

## The product components

1. **Reader host:** page access, shared capture/DOM routing, execution adapters,
   installed-reader state, observation ingestion, local content and views.
2. **Reader authoring:** agent requests, script/recipe creation, fixture previews,
   versioned artifacts and publication. It targets the host's capabilities.
3. **Discovery:** searchable reader records from ATProto, with explanatory match
   reasons and source identities; fetch exact selected records and payloads.
4. **Collections:** portable selections of pinned readers and configuration.
   These are a natural first output of the future combination/minting service.
5. **Packaging:** consume a collection to produce an optional bespoke WXT
   extension. A PWA presentation can expose the capabilities available to a web
   origin; wrapping the same list does not confer extension privileges.

The primary loop is:

```text
page context → discover matching readers → retrieve selected artifact
             → install/configure → enable/run → retain observations
             ↘ no suitable reader → ask agent → test → install/publish
```

## Discovery keys: make the scopes explicit

For `https://chat.research.example.co.uk:8443/c/123`, distinguish:

| Key | Example | Meaning |
| --- | --- | --- |
| Origin | `https://chat.research.example.co.uk:8443` | Scheme + hostname + effective port |
| Hostname | `chat.research.example.co.uk` | Exact host, independent of scheme/port |
| Registrable domain | `example.co.uk` | Public-Suffix-List-derived grouping |
| Top-level origin | The top browsing context's origin | Can differ from an observed frame's origin |
| URL/path applicability | e.g. `/c/*` under an explicit origin | Narrower reader execution scope |

**“Root origin” is not a standardized additional origin kind.** It could mean
the top-level document origin or an origin constructed from the domain apex.
Keep `topLevelOrigin` and `registrableDomain` explicit until that UI label is
settled. Do not silently fabricate `https://example.co.uk` from an arbitrary
page's port/scheme or treat sibling subdomains as one execution permission.

Use URL parsing for normalized hosts/default ports and IDNs. Registrable-domain
grouping should respect private suffix entries so tenants such as
`alice.github.io` and `bob.github.io` do not collapse into one site. IP addresses,
localhost and opaque origins need explicit handling, not a guessed last-two-label
domain. Record the derivation/version on an index when reproducibility matters.

Discovery is deliberately broader than execution. A domain match can suggest a
candidate; its full URL applicability and runtime requirements still decide
whether it can run. Candidate retrieval may OR independent search facets;
runtime requirements within one target clause are ANDed. Alternative target
clauses are ORed. This avoids a broad domain tag bypassing a narrow origin rule.

`URLPattern` is useful for URL components. Chrome/WebExtension match patterns
have a different grammar and capability set. Declare the grammar in records and
write explicit adapters; do not pass one format to the other unchanged.

## ATProto: publish records, build discovery, retrieve artifacts

The current reader lexicon stores a blob, runtime and version. Match patterns
in the reader-loop integration are buried in an evidence string. Promote
applicability into **structured, validated record fields** that an index can query:

- Reader name/description, stable record identity and author DID.
- Runtime and host-interface version, artifact kind, entrypoint and blob ref.
- Target clauses with exact origins/hosts, explicit subdomain behavior, URL
  applicability grammar and optional top-level-context requirements.
- Capability declarations: DOM observation, captured-network interpretation,
  static-document processing, or other concrete host operations.
- Human-facing version and immutable record/blob identity; provenance links.

Normalized domain keys are index-derived from validated declarations; they are
not claims that the author controls those domains. Separate “works on this site”
from publisher identity and any measured compatibility evidence.

There is no universal `search all ATProto records by origin` endpoint.
`com.atproto.repo.listRecords` lists a named collection in one repository. Start
with explicit AT-URI import and paginated known-author catalogs; a network-wide
catalog becomes an AppView/index that consumes reader records and maintains
origin/host/domain keys. It needs backfill, updates, deletion handling and an
honest indexed coverage/freshness account. Clients can choose catalog providers.

Discovery results should include `{uri, cid}`, publisher DID, match reasons and
index coverage. Retrieval resolves the current PDS, fetches the record, checks
the selected CID, then downloads/verifies the blob and retains it locally. If the
record has changed since discovery, report that difference rather than installing
the new bytes under the old selection. A record reference does not guarantee a
PDS will retain an old revision's payload forever; installed copies support local
rollback and offline use.

Oxigraph can index these facts and collection membership too: reader → target,
reader revision → publisher/blob, installation → selected revision, attempt →
used reader. ATProto records and graph indexes have separate ownership: the
discovery graph is a projection, while local installation choices are user state.
This extends the [ontology's procedure/attempt distinction](../ontology/design0.gpt6a.md#3-terms-that-carry-the-design).

## Installation lifecycle belongs to the host

Three different installations exist: the browser installs the extension; the
host installs a reader; the OS/browser installs a PWA. Each needs its own receipt.

An installed-reader record should contain a stable local installation ID, pinned
record/blob references or a local artifact revision, retained bytes, selected
configuration/scope, desired enabled state and observed runtime registration.
Installation, enablement, successful registration and active execution are
different facts. A missing permission can leave a reader installed but blocked.

The first lifecycle tools should support:

- **Discover/inspect/retrieve:** explain matches; retain the selected revision.
- **Install/configure/enable/disable:** manage host state and browser registration.
- **Run/stop:** identify attempts and dispose observers/subscriptions/resources.
- **Check updates/apply update/rollback:** distinguish available, installed and
  active revisions; retain the predecessor before changing selection.
- **Uninstall:** remove registration and installation state. Deleting captured
  content or historical artifacts is a separate explicit operation.
- **Explain status:** show desired state, actual browser state, last attempt,
  current revision and failures, including interrupted/unknown work.

`userScripts.unregister()` prevents future injection; it does not undo code
already run in a page. Long-lived readers therefore need a host protocol for
stopping and disposing their current instance. Updating registration similarly
does not hot-replace every already-running reader. The current expression-returning
reader experiment is sufficient for one-shot execution, not this full lifecycle.

Use stable registration IDs per installation rather than generating a new ID
for every version. Store selection separately from registration so extension
updates, restarts and disabled APIs can be explained and deliberately repaired.
No automatic pruning or silent update policy is implied by this design.

## Collections and the eventual minting service

A collection is a versioned, publishable document containing pinned reader
references, configuration, declared ordering/dependencies and required host
capabilities. A manifest that selects readers is a useful artifact even without
building a new extension. Record an exact resolved selection separately from a
mutable “follow this collection” choice.

The service can later offer three outputs from a selection:

1. **Install this collection into Pageread** — the main route.
2. **Build a bespoke extension** — a reproducible packaged module tree plus
   extension permissions/update identity, using the retained WXT machinery.
3. **Publish a small web app/workbench** — import/query/transform workflows that
   its origin can actually execute, with a Web App Manifest.

The service must compose declared interfaces and resource ownership, not merely
concatenate scripts. Separate reader versions can demand incompatible host APIs;
multiple readers can interpret the same page; disposal and publication policy
need a named owner. Licensing and declared capabilities belong in the selection
metadata rather than being rediscovered during packaging.

## Web installation specifications and APIs

| Mechanism | Fit here | Standing/limit |
| --- | --- | --- |
| [Web Application Manifest](https://www.w3.org/TR/appmanifest/) | PWA `id`, `name`, icons, `start_url`, `scope`, display and shortcuts | Standards-track; browser owns install/uninstall UX. Navigation scope is not cross-origin access. |
| [Service Worker](https://www.w3.org/TR/service-workers/) | Offline application shell and cache/update lifecycle | A worker's `install` event is worker installation, not proof the user installed a PWA. |
| [beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent) | Offer install UI when the browser supplies an event | Nonstandard, limited support; cannot assume every visit produces an event. |
| [Web Install API](https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/WebInstall/explainer.md) | Catalog-driven PWA acquisition, including other origins | Active proposal; current explainer uses `navigator.install`. Does not install extensions or arbitrary script artifacts. |
| [install element](https://github.com/WICG/install-element) | Browser-rendered declarative PWA installation action | Incubating; install-URL trial and manifest-URL successor designs differ. Avoid fixing current proposal syntax into our durable records. |
| [Get Installed Related Apps](https://github.com/WICG/get-installed-related-apps) | Detect supported, explicitly associated companion apps | Limited related-app detection, not an inventory of arbitrary installed scripts or extensions. |
| [Web Share Target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target) | Receive links, text, exported captures and datasets into an installed PWA | Limited support; paired with ordinary upload/paste fallbacks. |
| [File Handling](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/file_handlers) | Open `.trig`, `.nq`, JSON bundles or reader collections | Limited support; manifest associations plus `launchQueue`, ordinary file input fallback. |
| [Chrome userScripts](https://developer.chrome.com/docs/extensions/reference/api/userScripts) | Register/update/run/unregister acquired reader code | Extension API with permission/browser-setting requirements, not a general web installation standard. |

Related mechanisms include manifest protocol handlers/deep links, launch handling,
and browser extension permission/runtime events. They are adapters around the
artifact and installation model, not alternative definitions of its identity.

## A useful standalone PWA

The strongest small PWA is a **reader catalog and knowledge workbench**:

- Find scripts for a URL, inspect versions and curate/share collections.
- Receive a shared URL, text or exported page/dataset; retain an inbox.
- Open local bundles and run Oxigraph queries offline.
- Run static-document transformations against imported evidence.
- Compose an agent request from supplied evidence, retain the returned reader,
  and publish a selected artifact using the user's authenticated session.
- Hand a collection or artifact link to the extension through a defined bridge.

Its own origin cannot inspect arbitrary other tabs, inherit their authenticated
DOM, or observe their network traffic. Receiving a URL is not receiving the page's
content. A site fetch requires normal fetch/CORS rules; richer page capture is
supplied by the extension or a separately authorized browser host. PWA-local and
extension-local storage are separate; installation does not merge them.

The existing graph playground is an excellent starting surface for that
workbench. Give it a useful import/export/catalog workflow before treating PWA
packaging as the product itself.

## Restructuring the next work

1. Make script artifacts, structured targets and a host ABI the shared contract.
2. Implement local install/status/update/disable/dispose with the current
   userScripts seam; browser-test acquisition from a mock ATProto record.
3. Add direct record import and known-author catalogs, then the independent
   origin/domain AppView. Test suffix boundaries, frames and stale record CIDs.
4. Add collection manifests; use them in both the host and future package builder.
5. Add a PWA workbench around existing graph/import/export capabilities.

These are capability boundaries, not a demand for five new packages. The
existing `extension-build` remains packaging infrastructure; `ReaderSpec` is
the more important author-facing concept. Do not make authors generate a new
manifest and service worker just to add a reader.

## Connections and open choices

- [Reader-loop experiment](/experiments/reader-loop/README.md) supplies generation
  and registration seams; needs installation identity and live-reader disposal.
- [Publishing experiment](/experiments/publishing/README.md) proves record/blob
  fidelity; needs structured targets and discovery contracts.
- [Build kit](/extension-build/README.md) becomes the secondary packaging target.
- [AM resolver design](../reactive-indexes/draft1.gpt6am.md) governs observations
  emitted by scripts, not which scripts a user installs.
- [Capability-driven inquiry](../tabula-rasa/design0.gpt6a.md#3-vocabulary-and-public-surfaces)
  already separates recipes and hosts; this direction changes product emphasis.

Open choices: the UI meaning of “root origin”; precise host ABI and reader
packaging formats; update/follow policy; catalog providers and publisher sets;
the naming authority for public lexicons; and whether the first PWA is catalog-
first or imported-content-first. These do not block adopting the script-first
product direction.
