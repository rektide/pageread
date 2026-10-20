---
type: DesignBrief
title: A fresh ask for pageread
description: User-grounded capabilities and open decisions for an independent page-reading toolkit design.
resource: /design/tabula-rasa/brief0.gpt6a.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea512e94affeKEPqju0qHMPIrE"
    title: Independent design commission, inherited user requirements, and separation of requests from earlier assistant commitments
---

# A fresh ask for pageread

Design a way to **read a person's ChatGPT conversations as addressable,
inspectable content**, then make the same facilities useful for writing readers
for other sites. A reader should work both by walking what exists now and by
joining what changes next. Content, collections, and their changes should be
available to people, extensions, and an agent helping write another extension.

This brief restates the user's requests. It does not inherit the current
implementation's interfaces, packages, dependencies, or storage decisions.
The [independent design](./design0.gpt6a.md) is one proposed answer, not an
additional source of requirements. The [bias audit](./bias-audit0.glm53fx.md)
records what was excluded and what needs reopening.

## Requested capabilities

| Request | What the design must make possible | What it does not settle |
| --- | --- | --- |
| Read ChatGPT sessions | Discover conversations and projects; retrieve message content; follow ongoing changes. Explain which portions have actually been observed. | A private API contract, complete account export, or a particular conversation-to-trace mapping. |
| Microdata with adapted OTel semantics | Describe page entities using a microdata-compatible vocabulary; represent/extract events and traces; use applicable OTel conventions. | That OTel is already an HTML vocabulary, that all content is telemetry, or that every message is a span. |
| Network primary, DOM fallback | Prefer useful network evidence; also walk selected entities and observe page changes. | A particular interception mechanism or permission to treat missing DOM content as deleted. |
| Iterable, live, signal-like selectors | Obtain initial matches and follow changes; support multiple consumers without duplicating observers for every query. | TC39, Preact, Solid, a new signals implementation, or one observer spanning isolated browser realms. |
| Shared event routing | Route observations to interested readers; allow content/index backends to emit changes too. | A universal global singleton, durable replay for every source, or one delivery policy for state and events. |
| MIME-bearing, Cache-shaped content storage | Store and retrieve differently typed content through a familiar web-shaped interface. | Native Cache Storage, IndexedDB, a file system, HTTP caching semantics, or an obligatory server. |
| ContentIndex-like discovery | Describe and enumerate content through an index-shaped facade. | That the browser's Content Index API stores the content or supplies text search. |
| Independently creatable indexes | Support transcript, project, and message-oriented collections; publish separate reactive streams. | Three hard-coded indexes, a fixed hierarchy, one physical database per index, or a single flat transcript. |
| Extension toolkit and DSL | Make a bespoke ChatGPT reader and make additional readers expressible, testable, and buildable. | A new text language, a parser generator, an all-declarative extractor, or a specific plugin package graph. |
| Agent authoring access | Let an extension-building ACP session use stored content and create indexes; leave room for A2A later. | That either protocol already defines a content-store API, or that protocol transport owns the domain model. |
| Verification | Reuse Playwright infrastructure; use MSW for simulated contexts. Use substantial tracing-test coverage if Rust is introduced. | That Rust is required, that mocks prove real-site compatibility, or that a new browser harness must replace the existing one. |

The message-index wording leaves room for **both a conversation's messages and
an individual message's content parts** to be independently indexed. Do not
silently reduce the request to only one granularity. Relationships may overlap:
a conversation can appear in an account list, a project, and a user-created view.

## Preferences and investigations

- **WXT** is the user's proposed extension builder; investigate its fit with
  **Vite+** rather than treating their compatibility as established.
- **TC39 signals, Preact, and Solid** were named as relevant approaches. Examine
  their multi-consumer and subscription semantics before choosing a bridge.
- The browser's **Ctrl+F-related hook** was recalled uncertainly. Identify the
  actual browser feature and distinguish it from content storage, discovery,
  and application text search.
- Sketch possible **Rust crate responsibilities** if useful to an agent-facing
  host. Keep them hypothetical until there is a reason to introduce Rust.

## Questions the independent design must answer

1. What can a consumer address: an entity, a representation, a collection,
   a particular observation, a trace, or some combination? How do they relate?
2. What makes an observation trustworthy enough to update content? How are
   branch selection, streaming, conflicting sources, and unknown facts retained?
3. How does a new consumer obtain a snapshot and join the change stream without
   a gap? What happens after disconnect, suspension, overflow, or restart?
4. Which stream contracts are shared across DOM queries, content, and indexes?
   Which capabilities differ honestly between transient and durable sources?
5. What does an index own? Can several indexes refer to the same content without
   creating divergent copies? How does a caller create and remove membership?
6. What is the relationship between microdata, OTel semantic attributes, actual
   telemetry, and telemetry reconstructed from a historical page?
7. Which parts of a reader belong in the DSL, and where can an executable parser
   express site-specific behavior? Can an agent inspect and test that boundary?
8. What can the browser's native find feature do? What requires pageread's own
   searchable reader view or search interface?
9. Which callable operations should an extension-writing session receive,
   independent of whether ACP, MCP, A2A, or an in-process host transports them?
10. What concrete failure cases would disprove the proposed design?

## Required design output

Give one coherent recommendation with explicit interfaces for observation,
live queries, semantic extraction, content storage, named indexes, event output,
extension authoring/building, and agent access. Include a ChatGPT walkthrough,
at least one plausible alternative at consequential forks, and a verification
path. Define semantics and ownership before assigning packages or crates.

Label facts, human choices, and proposed decisions distinctly. In particular,
"locked in" in an earlier assistant response is not evidence of user acceptance.
Do not introduce time estimates.

## Independence protocol

The independent designers may read this brief, global operating guidance, and
third-party primary sources. They must not read pre-existing pageread code,
README material, dependency/configuration choices, history, or other accounts
of its implementation. Same-wave researchers do not read each other's output.
The scout alone examines those materials to identify exclusions and bias kinds.

An inherited conversation cannot be un-read: the parent has already seen the
earlier assistant's proposed architecture. The honest claim is **a fresh
derivation from the requested capabilities, with code and current-design
exclusion**, not perfect ignorance. Document where independent research changes
the answer.
