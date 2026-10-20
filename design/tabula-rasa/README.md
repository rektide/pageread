---
type: DesignModule
title: Independent pageread design
description: A user-grounded reset, independent research, and a proposed feature/interface design without consulting the existing implementation.
resource: /design/tabula-rasa/README.md
status: draft
generated: { by: "model:openai/gpt-6-astra#xhigh", at: "2026-10-20" }
sources:
  - resource: "opencode://ses_ea512e94affeKEPqju0qHMPIrE"
    title: Commission, independent design, research integration, and navigation
  - resource: /design/tabula-rasa/brief0.gpt6a.md
    title: User-grounded commission and independence protocol
  - resource: /design/tabula-rasa/design0.gpt6a.md
    title: Proposed content, observation, index, and authoring interfaces
  - resource: /design/tabula-rasa/research0-browser.gpt61s.md
    title: Primary-source browser and live-query research
  - resource: /design/tabula-rasa/research0-content.gpt61s.md
    title: Primary-source content, OTel, and persistent stream research
  - resource: /design/tabula-rasa/review1-browser.gpt61s.md
    title: Independent browser-contract review of the initial candidate
  - resource: /design/tabula-rasa/review1-content.gpt61s.md
    title: Independent content/publication-contract review of the initial candidate
---

# Independent pageread design

This inquiry asks what pageread should expose to readers, extension authors,
and their agents, deriving the answer from requested capabilities rather than
the existing scaffold. It is a design candidate, not an accepted migration plan.

- [Fresh ask](./brief0.gpt6a.md): requested capabilities, open decisions, and the
  research exclusion protocol. Start here when commissioning another design.
- [Bias audit](./bias-audit0.glm53fx.md): the scout's excluded paths and categories
  of decisions that need independent justification.
- [Astra's design](./design0.gpt6a.md): the proposed interfaces, their semantics,
  a ChatGPT walkthrough, alternatives, and verification obligations.

## Independent research — wave 0

Two Sol-medium researchers worked independently from the human capabilities and
primary sources, with a whole-repository reading ban:

- [Browser observation and authoring](./research0-browser.gpt61s.md): browser
  find, live selectors, signals, extension worlds, WXT/Vite+, and Playwright/MSW.
- [Semantic content and reactive indexes](./research0-content.gpt61s.md): current
  OTel conventions, microdata, exact content revisions, named indexes, replay,
  and ACP/A2A boundaries.

Their proposals emphasize different lifetimes: the browser reading session and
the retained content catalog. The parent design connects these at an explicit
interpretation/publication boundary. Sources support platform claims; the
proposed architecture remains a choice.

## Contract review — wave 1

The same two researchers independently reviewed the first candidate, reading
only the new brief, candidate, and their own prior research:

- [Browser contract review](./review1-browser.gpt61s.md): per-response decoder
  identity, live-query ownership/disposal, and synchronous DOM snapshot extraction.
- [Content contract review](./review1-content.gpt61s.md): membership revisions,
  batch-local references, state replay, pin/follow behavior, projection progress,
  and persistence guarantees.

The design's [review disposition](./design0.gpt6a.md#15-review-disposition)
records the resulting corrections. The original candidate was checkpointed before
revision; the reviews describe that candidate, not the revised text. This work
used two waves of two Sol-medium researchers, plus the FX contamination scout.

## Evidence boundary

The audit has a different evidence boundary from the design: its author inspected
the existing repository; the independent researchers and design author did not
read the current implementation. Earlier conversation framing remains visible to
the parent and is explicitly reconsidered in the brief.

Verification here is documentary: primary-source research, independent contract
review, and local-link/frontmatter/fence checks. Implementation, actual ChatGPT
behavior, native browser-find interaction, and WXT–Vite+ compatibility remain
subjects of the proposed verification plan.
