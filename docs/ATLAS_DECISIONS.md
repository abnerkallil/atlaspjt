# ATLAS PROJECT — ARCHITECTURAL DECISIONS

## Purpose

This document records durable architectural decisions for the Atlas Project.

It exists to preserve architectural intent across future development.

It must remain concise.

This document is NOT:

- an implementation diary;
- a commit history;
- a record of routine technical choices;
- a place to document every development task;
- a substitute for source code documentation.

Only decisions with lasting architectural relevance belong here.

---

# AUTHORITY

Atlas owns product requirements.

Hermes owns architectural decisions.

Codex owns implementation decisions inside the established architecture.

A DEC-* record should normally represent a decision made or validated by Hermes.

Codex must respect active DEC-* decisions.

Codex must not create DEC-* records for routine implementation choices.

---

# WHEN TO CREATE A DECISION

Create a DEC-* only when the decision is:

- architectural;
- durable;
- relevant to future development;
- difficult or expensive to reverse;
- likely to affect multiple future implementations;
- important enough that future agents should understand why the architecture works this way.

Typical DEC-* subjects:

- persistence strategy;
- canonical data model;
- editor engine;
- synchronization architecture;
- authentication architecture;
- security boundaries;
- major subsystem boundaries;
- significant structural dependencies;
- concurrency model;
- long-term integration strategy.

---

# WHEN NOT TO CREATE A DECISION

Do NOT create DEC-* records for:

- CSS choices;
- button behavior;
- local handlers;
- helper functions;
- local component structure;
- routine refactors;
- test organization;
- variable names;
- file names;
- local implementation techniques;
- ordinary bug fixes;
- routine UI behavior.

These belong to Codex implementation authority.

---

# DECISION STATES

Use one of the following states:

- PROPOSED
- ACCEPTED
- SUPERSEDED
- REJECTED

Only ACCEPTED decisions constrain implementation.

A SUPERSEDED decision must identify the DEC-* that replaced it.

---

# DECISION FORMAT

Use this format for each architectural decision:

---

## DEC-XXX — Short Decision Title

Status: PROPOSED | ACCEPTED | SUPERSEDED | REJECTED

Date: YYYY-MM-DD

### Context

Briefly describe the architectural problem.

Include only the information necessary to understand why a decision was required.

### Decision

State the architectural decision clearly.

### Rationale

Maximum three concise reasons by default.

1.
2.
3.

### Constraints for Codex

List only implementation constraints that must be preserved.

If none:

None.

### Consequences

Describe only meaningful architectural consequences.

Avoid speculative future design.

### Related

Quest: NONE

Supersedes: NONE

Superseded by: NONE

---

# DECISION SCOPE

Each DEC-* should answer the smallest architectural question necessary.

Do not solve unrelated future problems.

Do not expand the decision simply because adjacent architecture exists.

Prefer the smallest durable architectural decision that preserves long-term project integrity.

---

# HERMES DECISION PROCESS

When an Architecture Gate is triggered:

1. read the original active quest;
2. identify the precise architectural question;
3. inspect only relevant project context;
4. evaluate alternatives independently;
5. make the smallest necessary architectural decision;
6. determine whether a DEC-* record is actually required.

If the decision is routine or local:

Do not create a DEC-*.

If no architectural decision is required, Hermes should return:

NO ARCHITECTURAL DECISION REQUIRED.

Proceed within the existing architecture.

---

# CODEX RULE

Codex must:

- respect ACCEPTED DEC-* decisions;
- consult relevant DEC-* records only when the current task touches them;
- escalate conflicts instead of silently overriding a decision.

Codex must NOT:

- read every DEC-* record for every task;
- create DEC-* records for routine implementation;
- reinterpret architectural decisions without an Architecture Gate.

---

# MAINTENANCE

Keep this document concise.

Do not duplicate:

- Task Contracts;
- implementation plans;
- test reports;
- commit messages;
- daily development notes;
- detailed source-code explanations.

The goal is to answer:

"What architectural decisions must future Atlas development preserve?"

---

## DEC-001 — Atlas Notes Canonical Document v2

Status: ACCEPTED

Date: 2026-09-08

### Context

Atlas Notes persists a canonical structured document (envelope atlas-notes version 1) with a strict allowlist (paragraph, heading 1-3, bullet/ordered lists, blockquote, bold/italic) and an LF-based deterministic body projection used for search/preview/counting. Quest 1 requires evolution to support headings H1-H6, bullet/ordered/task lists, blockquote, bold/italic/strike/highlight/inline code/styled inline comment/link/inline equation, plus horizontal rule, code block, block equation, table, footnote, and callout — without introducing UI, bookmarks/Marcacoes, color palettes, comment collaboration, or callout variants. The envelope stores version inside content_json (nullable TEXT, no separate version column). The server canonicalizer is pure TypeScript and DOM-free. Compatibility must preserve persisted v1, NULL legacy rows, in-memory-only legacy conversion, and structured-to-body-only downgrade protection.

### Decision

Introduce envelope version 2 as the durable canonical representation. Readers accept format "atlas-notes" version 1 and 2; any other version fails INVALID_ENVELOPE. Writers normalize every new structured save to version 2 (even v1-subset content); persisted v1 remains v1 until an explicit structured save migrates it to v2; no implicit mutation on reads. Adopt ProseMirror/Tiptap JSON shapes for conventional nodes with Atlas normalization (strict allowlist, deterministic mark order, adjacent-text merging, editor-boundary adapter); define Atlas-normalized shapes for highlight/comment/equations/footnote/callout with minimum durable semantics. Define LF-based body projection that preserves exact v1 projection for the v1 subset and specifies rules for every new type. Keep all numeric safety limits unchanged and define depth/node counting for new nesting.

### Rationale

1. Versioned envelope preserves exact v1 bytes and projection and avoids implicit storage mutation on reads — an in-place v1 allowlist expansion cannot guarantee this.
2. Adopting Tiptap's conventional shapes with Atlas normalization and an editor adapter maximizes interoperability while keeping server validation deterministic and DOM-free.
3. Existing limits already accommodate new nesting (table path depth 6 < 8), so no speculative limit inflation is needed.

### Constraints for Codex

- Envelope is { format:"atlas-notes", version:1|2, doc:{ type:"doc", content:Block[] } }; readers accept 1 and 2 only; writers persist 2 only; unsupported versions reject INVALID_ENVELOPE; no read-time rewrite.
- v2 blocks: paragraph, heading 1-6, bulletList/orderedList (attrs start:1 type:null, strict), taskList/taskItem (attrs checked:boolean), blockquote, horizontalRule (atom), codeBlock (attrs language string| null, content text-no-marks), mathBlock (attrs latex), table/tableRow/tableCell/tableHeader (cell content 1+ paragraphs, no colspan/rowspan), footnote (attrs id unique, content 1+ paragraphs), callout (content 1+ paragraphs, no attrs). Inline: text (marks sorted by rank) plus atom mathInline (latex) and footnoteRef (id). Marks: bold(0), italic(1), strike(2), code(3), highlight(4, no attrs), comment(5, no attrs), link(6, attrs href http/https/mailto only, last). Unknown fields/nodes/marks/attrs, duplicate marks, invalid children, nested lists where forbidden → reject. Canonicalize by sorting marks then merging adjacent same-mark text.
- Projection is LF-only: paragraph/heading → inline concat; bullet/ordered/task lists → items joined with LF (checked adds nothing); blockquote/callout → paragraphs with LF; horizontalRule → ""; codeBlock → raw text preserving LF; mathInline/mathBlock → latex; link/highlight/comment/code/strike → visible text only; footnoteRef → ""; footnote definition block → paragraphs with LF; table → cells with tab, rows with LF, cell paragraphs with LF; doc → blocks with LF then trim(). v1 subset projection byte-identical between v1 and v2. Stored body must equal version-specific projection; hydration fails otherwise.
- Preserve legacy invariants: content_json NULL stays readable, legacy conversion in memory only, explicit structured save migrates, structured row downgrade to body-only rejected (STRUCTURED_DOWNGRADE), server derives authoritative body and rejects BODY_PROJECTION_MISMATCH, idempotency via atlas-notes:{operationId}, determinism via TextEncoder JSON byte length and UTF-16 counts.
- No UI, CSS, handlers, component structure, color palettes, comment collaboration/authorship/threads, callout categories/colors/icons, bookmark/Marcacao semantics, or speculative types. Editor-boundary adapter translates Tiptap runtime to canonical JSON; server never depends on DOM/Tiptap.
- Limits unchanged: request 1,310,720, structured 1,048,576, depth 8, nodes 20,000, textNode 100,000, visible 100,000. Depth counted from envelope 0 → doc 1 → block 2 → listItem/taskItem/tableRow 3 → paragraph/cell 4-5 → text/atom 6; nodes = every type-bearing object; marks not counted.

### Consequences

- All future structured saves are version 2; v1 persists only until overwritten, simplifying the write path to one canonical version while reads remain dual-version indefinitely.
- Server validation and projection remain pure TypeScript and deterministic; editor changes require only adapter updates, not persistence changes.
- Footnote definitions, tables, and callouts are searchable via their paragraph text; structural elements (horizontalRule, footnoteRef, task checked) contribute no invented visible tokens.
- No schema migration for D1 (content_json stays TEXT, no version column); version lives in JSON.

### Related

Quest: QUEST 1 — Atlas Notes Canonical Document Evolution (ATLAS-HERMES-GATE-20260908-001)

Supersedes: NONE

Superseded by: NONE
