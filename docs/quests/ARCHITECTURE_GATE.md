# ATLAS PROJECT — ARCHITECTURE GATE

## Purpose

This file is the temporary communication interface between Codex and Hermes when a real Architecture Gate is triggered.

It exists to preserve separation of authority:

- Atlas defines the original product requirement;
- Codex reports relevant repository facts;
- Hermes makes the architectural decision.

This file must NOT be used for routine implementation questions.

If no Architecture Gate exists, this file should remain in the IDLE state.

---

# GATE STATUS

Status: RESOLVED

---

# QUEST

QUEST 1 — Atlas Notes Canonical Document Evolution (Correlation: ATLAS-HERMES-GATE-20260908-001)

---

# ARCHITECTURAL QUESTION

Evolution of the persisted canonical Atlas Notes document envelope, its versioning, canonical JSON representation, deterministic body projection, compatibility invariants, and structural limits for the new node/mark set.

---

# GATE TRIGGER

persistent data model change; data migration; significant structural dependency; expensive or difficult-to-reverse decision; product requirement incompatible with current allowlist

---

# ORIGINAL REQUIREMENT

Evolve the persisted canonical Atlas Notes document so that future quests can safely use:

Structure: paragraph/text, headings H1-H6, bullet list, ordered list, task list, blockquote.
Inline/marks: bold, italic, strike, highlight, inline code, styled inline comment, link/URL, inline equation.
Advanced blocks: horizontal rule, code block, block equation, table, footnote, callout.

Semantic distinctions: highlight is visual formatting, inline comment is styled textual annotation (no collaboration/authorship/threads), callout is structural block, bookmarks/Marcacoes are out of scope.
Must not introduce UI for these features in this Quest.

Compatibility: existing structured notes remain readable, current v1 projection unchanged, NULL legacy notes remain readable, legacy conversion in-memory only until explicit save, structured notes protected against downgrade, server validation/determinism/idempotency/safety limits remain unless explicitly changed.

---

# RELEVANT REPOSITORY FACTS

1. Canonical envelope: { format: atlas-notes, version: 1, doc: { type: doc, content: [...] } }
2. atlas_notes.content_json is nullable D1 TEXT; no separate version column; version inside JSON.
3. Server canonicalizer is pure TypeScript, allows only format atlas-notes version 1; any other version rejected.
4. v1 allowlist: doc, paragraph, non-empty text, heading 1-3, flat bulletList, flat orderedList start=1 type=null, listItem exactly one paragraph, blockquote 1+ paragraphs, bold and italic marks only.
5. Unknown fields, unsupported nodes/marks, invalid attrs, duplicate marks, nested lists, invalid child combos rejected.
6. Canonicalizer orders marks deterministically and merges adjacent text nodes with equivalent marks.
7. Current body projection: concat inline text, separate top-level blocks with LF, list items and blockquote paragraphs with LF, omit visual markers, trim(), ignore bold/italic semantics.
8. Structured writes send content+body; server canonicalizes, derives authoritative projection, rejects divergent body.
9. Stored content re-canonicalized on reads; if projection differs from stored body hydration fails.
10. Legacy rows content_json=NULL; body converted to v1 paragraphs only in memory; explicit save persists; body-only writes accepted for legacy only; structured rows cannot be downgraded.
11. Limits: request 1,310,720 bytes, structured 1,048,576 bytes, depth 8, nodes 20,000, text node 100,000 UTF-16, visible 100,000.
12. Validator has no DOM/Tiptap dependency; editor uses Tiptap 3.31.3; persistence controlled by server allowlist.
13. No accepted DEC-* constraining this evolution.

---

# EXISTING ARCHITECTURAL CONSTRAINTS

None beyond v1 canonicalizer, limits, and invariants listed above. No accepted DEC-*.

---

# OPTION A

Expanding the v1 allowlist without changing envelope version.

## Description

Add new nodes/marks to the single version 1 allowlist.

## Architectural Advantages

Single version to maintain; no version branching.

## Architectural Costs / Risks

Mutates meaning of version 1; breaks determinism of already-persisted v1 documents; old code would silently accept or reject unpredictably; loses ability to distinguish old vs new projection rules; requires implicit reinterpretation of stored data.

---

# OPTION B

Introducing a new version while retaining explicit compatibility path for persisted v1.

## Description

Introduce version 2 envelope; readers accept 1 and 2; writers normalize to 2; v1 remains readable forever.

## Architectural Advantages

Preserves exact v1 bytes and projection; no implicit mutation on reads; clear rejection of unsupported future versions; explicit migration point.

## Architectural Costs / Risks

Two versions to maintain in reader; writer must decide normalization policy.

---

# ADDITIONAL OPTION

NONE

---

# CODEX RECOMMENDATION

NOT REQUESTED

---

# DECISION REQUIRED

Resolve: version evolution, canonical representation and invariants, deterministic body projection, compatibility invariants, structural limits.

---

# HERMES DECISION

## Decision

Introduce Atlas Notes canonical envelope version 2 with explicit multi-version read compatibility. Preserve v1 exactly. Adopt ProseMirror/Tiptap persisted shapes where conventional, define Atlas-normalized shapes with editor-boundary adapter for the remainder, and define LF-based deterministic projection that preserves the exact v1 projection for the v1 subset.

This is one coherent Gate about the canonical document. No split per node/mark. No UI/CSS/handlers/component decisions.

## Rationale

1. A versioned envelope preserves exact readability and projection of all persisted v1 documents and avoids implicit storage mutation on reads, which an in-place allowlist expansion cannot guarantee.
2. Adopting Tiptap's conventional shapes with Atlas normalization (strict allowlist, deterministic mark order, merged text, editor adapter) maximizes editor interoperability while keeping server validation DOM-free and deterministic.
3. Keeping existing numeric limits and mapping depth/node counting onto the new nesting levels satisfies the new structures without speculative limit inflation.

## Constraints for Codex

- Do not implement UI, CSS, menus, handlers, component structure, file organization, function names, or tests as architectural constraints; those remain Codex-local.
- No color palettes, comment categories/authorship/status/threads/resolution, callout categories/colors/icons/labels, nor bookmark/Marcacao semantics.
- No speculative types outside the Quest list.
- Canonicalizer remains pure TypeScript, DOM-free, deterministic (mark ordering + adjacent-text merging), strict allowlist, rejects unknown fields/nodes/marks/attrs, duplicate marks, nested lists where forbidden, invalid child combos.
- Structured writes send content+body; server canonicalizes content, derives authoritative body via version-specific projection, rejects BODY_PROJECTION_MISMATCH; stored content re-canonicalized on read and compared to stored body.
- Legacy content_json=NULL conversion stays in-memory only; explicit structured save migrates; structured-to-body-only downgrade remains rejected (STRUCTURED_DOWNGRADE).
- Inline comment is a styled mark, not collaboration; highlight is visual formatting; callout is structural block; do not add collaboration/bookmark semantics.
- Editor-boundary adapter translates between Tiptap runtime nodes/marks and Atlas canonical JSON; Tiptap is not the source of truth.
- Enforce idempotency (operationId keyed as atlas-notes:{operationId}) and determinism.

## Version / Read / Write Compatibility Matrix

Envelope: { format: "atlas-notes", version: 1 | 2, doc: { type: "doc", content: Block[] } } — no other top-level fields.

Readers (canonicalizeAtlasNotesContent, parseStoredContent, hydrateContent, projectAtlasNotesBody):
- Must accept format="atlas-notes" AND version=1 OR version=2. Canonicalize by version-specific allowlist, then project with version-specific projection (v2 projection preserves exact v1 projection for the v1 subset).
- Must reject with INVALID_ENVELOPE (400): wrong format, version missing/not integer, version 0, version >=3, version null/string, or any future version. No silent downgrade, no coercion.
- Must count nodes/depth/bytes using same limits for both versions.
- Must never mutate stored content_json or body on read. Reading v1 returns v1 envelope; reading v2 returns v2 envelope.

Writers (prepareAtlasNotesForSave, parseAtlasNotesSaveRequest, saveNote):
- Structured saves after this DEC persist version=2 exclusively (normalization). Any structured write — even if its content is within the v1 subset — is canonicalized and stored as version 2. This avoids dual-version proliferation and keeps one canonical write path.
- Persisted v1 documents remain v1 until an explicit structured save overwrites them; that save stores version 2 (explicit migration on write, not on read).
- New notes with structured content are created as version 2.
- Legacy rows (content_json=NULL): body-only writes remain accepted; once a structured save occurs, row becomes version 2 and thereafter body-only writes are rejected with STRUCTURED_DOWNGRADE.
- Explicitly saved v1-shaped document is normalized to version 2 (does not remain v1).
- Writers must still derive body via projectAtlasNotesBody for the canonicalized version and enforce equality (BODY_PROJECTION_MISMATCH if client body diverges).

Failure mode for unsupported future versions:
- On write or read, any envelope with version !=1 and !=2 fails as INVALID_ENVELOPE (400). Caller must handle; server never guesses or converts.

Implicit-mutation avoidance:
- No read path rewrites content_json or body. Migration occurs only when Codex sends a structured save.

## Canonical Node-and-Mark Representation Table (v2)

General invariants:
- Unknown fields rejected (UNKNOWN_FIELD). Unknown node/mark rejected. Invalid attrs rejected. Duplicate mark type on one text node rejected. Empty doc.content rejected. text.text must be non-empty string (length 1..100,000 UTF-16, no lone surrogates rejection via canonicalizer). Canonicalizer sorts marks by rank and merges adjacent text nodes with sameMarks (same ordered mark set including attrs equality for link).
- Depth root is content (depth 0) -> doc depth 1 -> blocks depth 2 -> nested paragraph/cell/row depths increment by 1 per content nesting. See limits section.
- Nodes counted = every object with a `type` field (doc + all blocks + inline nodes + text nodes).

Envelope:
| Field | Value |
| format | "atlas-notes" |
| version | 2 (writers) ; readers accept 1 and 2 |
| doc | { type:"doc", content: Block[] } with 1+ blocks |

Blocks (doc.content elements) — v2 allowlist:
| Type | Canonical shape | Children / attrs | Notes |
| paragraph | { type:"paragraph", content?: Inline[] } | 0+ inlines; empty means empty paragraph (projects "") | Inline defined below |
| heading | { type:"heading", attrs:{ level: 1\|2\|3\|4\|5\|6 }, content?: Inline[] } | level 1-6 (v1 was 1-3; v2 extends to 6) | |
| bulletList | { type:"bulletList", content: ListItem[] } | 1+ listItem | flat only |
| orderedList | { type:"orderedList", attrs:{ start:1, type:null }, content: ListItem[] } | attrs strictly start=1 type=null (preserve v1 invariant); 1+ listItem | Allowlist may be widened by future DEC; for now keep strict to avoid speculative change |
| taskList | { type:"taskList", content: TaskItem[] } | 1+ taskItem | New; ProseMirror/Tiptap shape adopted |
| listItem | { type:"listItem", content:[Paragraph] } | exactly one paragraph, no nested lists | |
| taskItem | { type:"taskItem", attrs:{ checked:boolean }, content:[Paragraph] } | attrs.checked required boolean; exactly one paragraph, no nested lists | Minimum durable semantics; no collapsed/expanded attrs |
| blockquote | { type:"blockquote", content: Paragraph[] } | 1+ paragraphs | |
| horizontalRule | { type:"horizontalRule" } | no attrs, no content | Atom block |
| codeBlock | { type:"codeBlock", attrs:{ language:string\|null }, content?: TextNoMarks[] } | attrs.language string matching /^[a-z0-9._+#-]{1,32}$/i or null (empty/whitespace -> null; unknown language allowed if matches pattern; else reject); content 0+ text nodes with no marks, preserving \n inside text.text; adjacent text merged | Tiptap shape adopted with Atlas normalization |
| mathBlock | { type:"mathBlock", attrs:{ latex:string } } | attrs.latex non-empty string 1..10,000 UTF-16, stored verbatim (trim not applied beyond canonicalizer's no-op except reject if trim is empty); no content; block equation | Atlas-normalized; editor adapter translates Tiptap math extension |
| table | { type:"table", content: TableRow[] } | 1+ tableRow | |
| tableRow | { type:"tableRow", content: (TableCell\|TableHeader)[] } | 1+ cells | |
| tableCell | { type:"tableCell", content: Paragraph[] } | 1+ paragraphs | No colspan/rowspan/align attrs (rejected if present) |
| tableHeader | { type:"tableHeader", content: Paragraph[] } | 1+ paragraphs | Header cell, same content model as tableCell |
| footnote | { type:"footnote", attrs:{ id:string }, content: Paragraph[] } | attrs.id matching /^[A-Za-z0-9_-]{1,64}$/, unique per doc; 1+ paragraphs | Definition block; Atlas-normalized |
| callout | { type:"callout", content: Paragraph[] } | 1+ paragraphs | Minimum structural block; no attrs (category/color/icon rejected) |

Inline content (paragraph.content and heading.content elements):
Inline[] is ordered array of:
- Text: { type:"text", text:string, marks?: Mark[] } — marks optional, sorted by rank
- Atom inline nodes:
  - { type:"mathInline", attrs:{ latex:string } } — latex non-empty 1..5,000 UTF-16; inline equation
  - { type:"footnoteRef", attrs:{ id:string } } — id must reference a footnote definition id present in same doc; inline reference; 1:1 or many:1 allowed but every footnoteRef id must have a footnote definition, and definitions without refs are allowed (orphan footnote still projects)

Marks (applied only to Text nodes; not to atom inlines; duplicate types forbidden on one Text):
| Mark | Shape | Rank | Notes |
| bold | { type:"bold" } | 0 | |
| italic | { type:"italic" } | 1 | |
| strike | { type:"strike" } | 2 | New |
| code | { type:"code" } | 3 | Inline code; Tiptap code mark |
| highlight | { type:"highlight" } | 4 | Visual formatting only; no attrs (any attrs rejected) |
| comment | { type:"comment" } | 5 | Styled inline annotation; no attrs, no authorship/threads |
| link | { type:"link", attrs:{ href:string } } | 6 (last) | href 1..2048 chars, must be http://, https://, or mailto: after trim; reject javascript:, data:, vbscript:, file:; must be parseable URL; only href attr allowed; must be last in sorted order for determinism |

Mark determinism: canonicalizeMarks sorts by rank above; link href equality considered in sameMarks check (marks equal only if type and attrs href equal). Adjacent Text nodes with sameMarks merged by concatenating text.

Attribute strictness: any extra attrs on any node/mark not listed above rejected as UNKNOWN_FIELD.

Editor-boundary adapter:
- For conventional shapes (paragraph, heading, bulletList/orderedList/listItem, taskList/taskItem, blockquote, horizontalRule, codeBlock, table family) Atlas canonical JSON adopts the ProseMirror/Tiptap persisted JSON shape, but Atlas server allowlist is the gate (rejects anything outside this table even if Tiptap would produce it).
- For non-conventional shapes (highlight, comment, mathInline/mathBlock, footnoteRef/footnote, callout) Atlas defines normalized shapes above; Codex's editor adapter must translate between Tiptap extension JSON and Atlas canonical (e.g., Tiptap highlight with color -> Atlas highlight without color; Tiptap comment extension -> Atlas comment mark; Tiptap math/katex extension -> Atlas mathInline/mathBlock with latex).
- Adapter runs client-side before prepareAtlasNotesForSave; server never runs Tiptap.

Multi-version canonicalization implementation guidance (Codex-local):
- Implement canonicalizeAtlasNotesContentV1 (current) and canonicalizeAtlasNotesContentV2 (this table) and dispatch on envelope.version.
- Share helpers; do not mutate v1 allowlist.

## Deterministic Body Projection Table (LF-based, searchable, no invented visible text)

Global rule: projectAtlasNotesBody(envelope) = canonicalize(envelope).doc.content.map(projectBlock).join("\n").trim(). Stable, LF (\n) only, no \r, no visual markers. Empty blocks project to "".

projectInline(inlines: Inline[] | undefined): string
- Iterate in order:
  - Text -> text.text
  - mathInline -> attrs.latex
  - footnoteRef -> "" (no marker; definition carries text)
- Marks (bold/italic/strike/code/highlight/comment/link) ignored — only text.text and latex emitted.
- Undefined or empty -> "".

projectBlock(block: Block): string
| Block | Projection |
| paragraph | projectInline(content) |
| heading (1-6) | projectInline(content) — same as paragraph; no # markers |
| bulletList | content.map(item => projectInline(item.content[0].content)).join("\n") — no -, *,  bullets |
| orderedList | same as bulletList (no numbers) |
| taskList | same as bulletList; attrs.checked contributes nothing beyond text — no [ ], [x] markers |
| blockquote | content.map(p => projectInline(p.content)).join("\n") — no > markers |
| callout | same as blockquote: content.map(p => projectInline(p.content)).join("\n") — no label/icon/color metadata |
| horizontalRule | "" (empty string) |
| codeBlock | join content text nodes with "" preserving their internal \n verbatim; if content undefined -> ""; no language prefix |
| mathBlock | attrs.latex |
| table | rows.map(row => row.content.map(cell => cell.content.map(p => projectInline(p.content)).join("\n")).join("\t")).join("\n") — i.e., paragraphs inside one cell joined with \n, cells in a row joined with \t, rows joined with \n |
| footnote (definition block) | content.map(p => projectInline(p.content)).join("\n") — projects definition text; if multiple footnotes, doc join will separate them with \n |
| doc | blocks.map(projectBlock).join("\n").trim() |

Guarantees:
- For any envelope that is valid v1, projectAtlasNotesBody produces byte-identical result under v1 rules and v2 rules (v1 projection preserved exactly). Verified by: paragraph, heading 1-3, bulletList, orderedList, blockquote, bold, italic projection unchanged; new types do not alter v1 code paths.
- Task checked state does not invent markers.
- HorizontalRule contributes only structural LF separation (via doc join), not visible "---".
- Code block preserves lines exactly (internal \n not collapsed; no trim inside code).
- Link and inline comment project visible text only (href/comment metadata ignored).
- Inline and block equations project stored latex source (searchable when latex contains searchable tokens).
- Table row/cell separation uses \t for cells and \n for rows (both LF-family, searchable, deterministic, no invented cell borders).
- Footnote reference projects empty; definition projects its paragraph text (searchable).
- Callout metadata projects nothing; only child paragraph text (searchable).

Equality invariant:
- stored body must equal projectAtlasNotesBody(stored content_json) using the projection for that stored version. Hydration fails otherwise. Server derivation on write uses same version-specific projection.

Character counting:
- characterCount = body.length (UTF-16 units, same as visibleLength). New types that project to non-empty strings count toward limit; structural empties (horizontalRule, footnoteRef) do not.

## Structural-Limit Rules

All numerical limits remain unchanged:

- requestBytes: 1,310,720
- structuredBytes: 1,048,576 (JSON byte length of envelope via TextEncoder)
- depth: 8
- nodes: 20,000
- textNodeLength: 100,000 per text node
- visibleLength: 100,000 per projected body

Rationale for not changing: new nesting levels stay within depth 8; worst-case new structure (doc 1 -> table 2 -> tableRow 3 -> tableCell 4 -> paragraph 5 -> text 6) depth 6 < 8; callout/blockquote/codeBlock remain shallower; therefore no limit increase justified.

Depth counting (applies to v1 and v2):
- content (envelope) depth 0
- doc depth 1
- block at doc.content depth 2
- listItem / taskItem / tableRow depth 3
- paragraph inside listItem/taskItem/tableCell depth 4 (or 3 for blockquote/callout/footnote paragraphs)
- tableCell/tableHeader depth 4
- paragraph inside tableCell depth 5
- text / mathInline / footnoteRef inside paragraph depth 6
Exceeding depth 8 at any node fails with STRUCTURE_TOO_DEEP.

Node counting:
- Every object with type: "doc", every Block type, every Inline type (text, mathInline, footnoteRef). Marks are not nodes. Fails TOO_MANY_NODES if >20,000.

Other limits apply as before (textNodeLength, structuredBytes, visibleLength, requestBytes). CodeBlock internal \n counts toward text length and visible length via projection; mathBlock/mathInline latex counts via projection and also as attrs string length (not textNode).

## DEC Required

YES

If YES, durable decision must be recorded in docs/ATLAS_DECISIONS.md

---

## Resolution Rule

This Gate is RESOLVED. Codex may resume implementation respecting the constraints above.

---

# NON-ARCHITECTURAL RULE

Not applicable — architectural decision was required.

---

# CORE PRINCIPLE

Atlas supplies product requirement. Codex supplies evidence. Hermes supplies architectural judgment. These responsibilities must remain separate.
