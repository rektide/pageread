---
type: ExperimentReport
title: Reader and RDF dataset publication experiment
description: Isolated runnable TypeScript proof of blob-backed custom ATProto records, named-graph roundtrips, and separate schema publication plans.
resource: /experiments/publishing/README.md
status: experimental
generated:
  at: "2026-10-20"
  by: "model:openai/gpt-6-astra"
sources:
  - resource: "opencode://ses_ea538b494ffej4MXIdPDIIDTLU"
    title: Connected the actual retained reader-loop artifact to publication and verified byte/runtime/match-evidence readback
  - resource: "opencode://ses_ea4d321acffe570t5fjBe7tkO8"
    title: Built and verified isolated publication tools, corrected SDK textual blob decoding and Oxigraph lexical normalization, researched schema authority and MV3 execution boundaries
  - resource: "https://atproto.com/specs/lexicon"
    title: Official schema language, unknown-field handling, validation options, publication and full NSID authority rules
  - resource: "https://github.com/bluesky-social/atproto/blob/cd736b3dbbec957cf4eaa7e67fa5b8be8f8ae04e/lexicons/com/atproto/lexicon/schema.json"
    title: Archived official schema meta-lexicon inspected locally
  - resource: "https://github.com/bluesky-social/atproto/blob/cd736b3dbbec957cf4eaa7e67fa5b8be8f8ae04e/lexicons/com/atproto/repo/putRecord.json"
    title: Official putRecord validation and compare-and-swap contract
  - resource: "https://github.com/bluesky-social/atproto/blob/cd736b3dbbec957cf4eaa7e67fa5b8be8f8ae04e/lexicons/com/atproto/repo/uploadBlob.json"
    title: Blob upload and subsequent record-reference requirements
  - resource: "https://developer.chrome.com/docs/extensions/develop/migrate/remote-hosted-code"
    title: MV3 remote-code restrictions and special execution contexts
  - resource: "https://developer.chrome.com/docs/extensions/reference/api/userScripts"
    title: Current userScripts permission, host matching, execution worlds and Chrome 138 toggle
  - resource: "/experiments/README.md"
    title: Parent integration target and artifact/observation/publication boundaries
  - resource: "/experiments/graphs/README.md#portable-interface-for-publishing--native-follow-up"
    title: Actual exported N-Quads contract used in read-only integration smoke
verification:
  date: "2026-10-20"
  environment: "Node v26.6.0, pnpm 12.7.0, Linux"
  scope: "Typecheck, build, 11 Node tests, dataset and reader MSW mock-PDS smoke; no live publication"
---

# Publishing dataset and reader artifacts

This package publishes **data records** containing a blob reference and metadata.
It also emits separate **lexicon schema publication plans**. All CLI publishing
is against an in-memory MSW mock PDS; no credentials or public writes are used.

## Run

From this directory (independent package and lockfile):

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dry-run
node src/cli.ts dry-run reader
pnpm smoke
node src/cli.ts smoke reader
node src/cli.ts schemas
```

Use Node with native TypeScript stripping (tested version above). Source runs
directly; `dist/publish.mjs` is the build artifact. No root workspace or core
library dependency is involved.

An exported dataset can be inspected without a network call:

```sh
node src/cli.ts dry-run dataset /path/to/export.nq application/n-quads
node src/cli.ts dry-run dataset /path/to/export.trig application/trig
node src/cli.ts dry-run reader /path/to/reader.js
```

The CLI always uses synthetic fixture provenance, including when given a file;
it is a payload inspection/smoke interface, not a metadata-authoring interface.
Use the API to supply actual source evidence, date and mapping version.

Dataset smoke output:

```json
{
  "mode": "MSW mock PDS only",
  "uri": "at://did:plc:abcdefghijklmnopqrstuvwx/com.example.pageread.experimental.dataset/fixture",
  "cid": "bafyreihnmi72mqlpfr7l4dx5niuy3iputaimxc5cbxrss4mew5mssadpiy",
  "validationStatus": "valid",
  "bytes": 249,
  "trace": ["uploadBlob", "putRecord", "getRecord", "getBlob"]
}
```

`dry-run` shows the complete validated record plus UTF-8 payload. Its blob ref
is computed locally, **not uploaded**. An actual upload must return matching
CID, MIME and size before `putRecord` runs. The mock computes real raw-blob and
DAG-CBOR record CIDs through official ATProto libraries.

## Record proposals and API

[schemas.ts](src/schemas.ts) contains two proposed lexicon documents. The CLI
uses explicit provisional `com.example.pageread.experimental.*` NSIDs under
the reserved example domain. These are fixtures, not a domain authority claim.
`Names` is an explicit parameter to all preparation/schema functions; an
integration must choose its own dataset and reader collection NSIDs.

| Record | Payload | Metadata |
| --- | --- | --- |
| Dataset | `application/n-quads` or `application/trig` blob | Distinct quad count, populated graph identities (`DefaultGraph`, `NamedNode`, `BlankNode`), mapping version, source URI, evidence, created date |
| Reader | `text/javascript` script or `application/zip` package blob | Artifact kind, version, entrypoint, runtime declaration, source URI, evidence, created date |

Every record carries `$type`; modern blobs serialize as
`{$type:"blob",ref:{$link:"…"},mimeType:"…",size:249}`. The validator receives
the SDK's `BlobRef` class. JSON readback is converted using `jsonToLex`.

Integration sketch (the caller supplies authentication and provenance):

```ts
import { prepareDataset, publish, readback } from './src/publish.ts';

const prepared = await prepareDataset(
  names, exportedNquads, 'application/n-quads',
  { createdAt, sourceUri, evidence }, 'my-mapping-v1',
);
const written = await publish(authenticatedAgent, repoDid, rkey, prepared);
const fetched = await readback(authenticatedAgent, repoDid, rkey, prepared);
```

The reader-loop's `{id,mimeType,runtime,code,matches,generatedBy,operationId}`
artifact can be mapped without importing that package:

```ts
const reader = await prepareReader(
  names, new TextEncoder().encode(artifact.code), artifact.mimeType,
  { createdAt, sourceUri, evidence: JSON.stringify({
    id: artifact.id, matches: artifact.matches,
    generatedBy: artifact.generatedBy, operationId: artifact.operationId,
  }) },
  { version: '0.0.0', entrypoint: 'script-body',
    runtime: artifact.runtime, artifactKind: 'script' },
);
```

This mapping retains generation/match evidence as bounded text, not dedicated
queryable lexicon fields. It does not translate ESM into user-script syntax.

The mapping is also runnable against the actual retained artifact:

```sh
# First run pnpm demo in ../reader-loop; use its printed artifact path.
pnpm integration:reader ../reader-loop/.data/artifacts/reader-<operation-id>.json
```

This read-only file integration publishes through the mock PDS and asserts exact
code bytes, the `chrome-user-script` runtime and retained match evidence on
readback. The parent verified it with the generated 170-byte fixture reader.
It does not execute the downloaded script or require imports from reader-loop.

`authenticatedAgent` is an official `@atproto/api` `Agent`; an OAuth session or
authenticated fetch handler can own signing, renewal and transport. This
experiment implements neither login nor credential persistence. Default
`swapRecord: null` means create only; pass a previous record CID explicitly to
replace an existing record. `validate: true` requires a real PDS to know or
resolve the custom lexicon. We do not silently downgrade validation when the
provisional vocabulary cannot resolve.

`readback` compares record data, verifies its DAG-CBOR CID, streams the blob
under a byte cap and verifies its raw CID/size. It returns bytes, never executes
them. The generated `getBlob` SDK method decodes `text/javascript` to a string
despite its declared binary output type; our reader uses the same Agent's
authenticated `fetchHandler` to retain raw bytes. The failing test predecessor
is preserved in commit `82938b0b`; correction is `0a379eb1`.

## Dataset fidelity and bounds

The first implementation used `Store.load`/`dump`. An actual probe showed that
Oxigraph normalizes typed `"007"` to `"7"` and relabels blank nodes. The retained
implementation instead uses Oxigraph's streaming `parse` interface to validate
and inventory quads while publishing the supplied UTF-8 text unchanged. This
preserves lexical forms, language tags, datatypes, named/default graphs and
explicit blank-node labels in the payload. If the caller already exported from
an Oxigraph Store, earlier normalization has already happened.

Tests import the downloaded N-Quads and TriG into a real Oxigraph Store and
query both default and named graphs, typed and language-tagged literals, and
blank-node graphs. Blank-node labels are document-local, never global IDs.
The blob CID is byte identity, not RDF dataset canonicalization/isomorphism.
TriG prefixes/formatting can yield different CIDs for equivalent datasets.

Limits: 1 MiB UTF-8 input/blob; 10,000 parsed quad occurrences; 128 populated
graphs; 32 KiB JSON-encoded metadata budget; individual field bounds in the
lexicons. Distinct quad count deduplicates parsed RDF terms; the occurrence
limit also bounds duplicate-heavy inputs. `graphs` inventories only graphs
with quads: empty named graph declarations are retained in input TriG bytes
but absent from this inventory. N-Quads cannot represent empty graph membership.
Relative-IRI input needs its own TriG base declaration; no ambient page URL is
silently supplied as a base.

The API is bounded after accepting a string/byte buffer. CLI file loading and
UTF-8 encoding allocate before that check; this is a small-input experiment,
not a streaming filesystem ingestion service. Network deadlines belong to the
injected transport. The ZIP option stores opaque bytes and declarations; it
does not inspect archives or verify that an entrypoint exists.

## Schema publication is a different operation

`schemaPlans(names, repo)` / `node src/cli.ts schemas` emits validated lexicon
JSON stamped with `$type: com.atproto.lexicon.schema`, the **schema** collection,
and `rkey` equal to the lexicon's complete NSID. No dataset blob is involved.
It emits the required DNS name/value as information, without changing DNS or
performing schema writes. The mock supports data records, not schema deployment.

Official spec/source inspection corrects several skill-guide examples:

- `com.example.pageread.experimental.dataset` resolves through
  `_lexicon.experimental.pageread.example.com`, not `_lexicon.example.com`.
  Remove only the final name segment and reverse **all** remaining segments;
  there is no parent-domain fallback.
- `com.atproto.lexicon.schema` is deliberately minimal and only requires a
  `lexicon` integer. A successful PDS validation does not recursively prove
  valid `defs`, authority, compatibility, or `id == rkey`. Our local `Lexicons`
  validation and plan construction handle the first and last of these.
- Unexpected object fields are allowed for evolution. We rely on the official
  validator and do not claim that it rejects all unknown fields.
- `Lexicons` mutates schema refs into internal `lex:` URIs; schema plans validate
  a clone so the emitted schema keeps portable `#graph` references.

Real schema deployment still needs an operator-controlled NSID authority,
DNS-to-DID binding, prior-schema compatibility consideration and end-to-end
resolution verification. None of those have been demonstrated against a live
service here.

## Representation comparison

The implemented representation is one snapshot blob plus a small graph
inventory: one upload and one record write, whole-dataset preservation and
bounded metadata. It fits the adjacent graph experiment's N-Quads/TriG export
seam without coupling to its implementation.

An inline RDF-term/quad record iteration would make small facts directly
indexable, but needs explicit term variants, literal lexical value/datatype/
language rules, blank-node scope and a cross-record snapshot identity. Per-quad
writes also lose atomic whole-dataset publication and quickly multiply records.
For larger snapshots, a manifest of chunk blob refs could retain snapshot
identity, but needs deterministic chunking and explicit graph/blank-node scope.
Neither alternate encoding is implemented; the snapshot proof establishes the
first useful seam without prematurely fixing a quad lexicon.

### Adjacent graph experiment integration

After `pnpm export` in `experiments/graphs`, run from this package:

```sh
pnpm integration
# Optional explicit N-Quads path:
node src/integration.ts ../graphs/exports/dataset.nq
```

Verified against the actual adjacent export: **58 quads, eight named graphs plus
the default graph, 7,669 bytes**, `uploadBlob → putRecord → getRecord → getBlob`.
The downloaded bytes equal the supplied export exactly, and a fresh Oxigraph
Store contains both named and default graph quads. The record carries mapping
`fixture-projection/1`. No graph files are modified. Its six exact source
documents remain in `bundle.json`; this snapshot publication does not upload
that bundle or reconstruct document text from RDF. Its earlier Oxigraph lexical
normalization remains an upstream limitation. The script is an explicit
integration command; the package's independent test suite does not require the
adjacent export to exist.

## Reader publication versus execution

A reader record says what source/package bytes were published and what runtime
the author declared. It does not make those bytes executable in an extension.

- Normal MV3 extension code is bundled; fetching JavaScript/WASM from ATProto
  does not exempt it from the remote-hosted-code restriction. `scripting` is
  not a generic downloaded-string execution interface.
- Chrome's `userScripts` is the relevant special mechanism for user-provided
  scripts: `userScripts` permission, host permissions, matching rules, execution
  world and enabled API are separate runtime requirements. Current docs specify
  the per-extension **Allow User Scripts** toggle for Chrome 138+, versus
  Developer Mode on earlier versions. The older RHC article's Developer Mode
  statement is therefore version-specific.
- `userScripts.register({js:[{code:…}]})` accepts script strings; that does not
  imply it accepts our example's ESM `export` syntax. A runtime adapter must
  deliberately produce compatible user-script source or package an ESM reader.
  Chrome user-script messaging also requires its separate world configuration.
- A sandboxed iframe can evaluate code in its own restricted environment, but
  that does not confer access to the captured page DOM or extension APIs.

This package performs no import, eval, script registration or execution.
The [reader-loop experiment](../reader-loop/README.md) owns generation and
execution exploration; the [experiment index](../README.md#integration-target)
connects both to the eventual extension flow. A successful mock publication is
evidence for this transport seam, not a completed browser pipeline.

## Verification and remaining gaps

Eleven Node tests cover real SDK requests through MSW, N-Quads/TriG imports,
reader byte roundtrip, lexical fidelity, compare-and-swap, authentication
failure, local payload mutation, upload metadata mismatch, corrupted readback,
schema shape/authority planning and resource rejection. `pnpm check` and
`pnpm build` pass independently.

The mock implements blob/record storage and selected XRPC contracts, not signed
repository commits, MSTs, indexing, federation, quotas or a PDS validation
resolver. MIME sniffing/allowlists and live PDS availability for these payload
types remain unverified. No browser WASM bundle or extension integration is
claimed; this is a Node TypeScript package. No live network writes, schema
authority registration, archive execution or private-chat publication occurred.
