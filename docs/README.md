# Atlas Project — Development Documentation

This directory contains the operational development documentation for the Atlas Project.

## Sources of Truth

Atlas uses separate sources of truth according to responsibility.

### Google Drive — Product and Governance

Google Drive is the source of truth for:

- product vision;
- product requirements;
- product principles;
- UX intent;
- governance of the Atlas / Hermes / Claude Code authority model;
- future product concepts such as Atlas Business.

Primary governance documents:

- `ATLAS — Product & Specification Authority`
- `ATLAS — Quest Handoff Protocol`

Product knowledge should not be duplicated here unless a technical contract requires it.

### GitHub — Development and Operational State

This repository is the source of truth for:

- source code;
- implementation state;
- agent operating instructions;
- technical decisions;
- development quests;
- architecture gates;
- technical contracts.

---

## Operational Documents

### `ATLAS_CAMPAIGN.md`

Development campaign and roadmap.

Read when roadmap context, quest dependencies or priorities are relevant.

### `ATLAS_STATUS.md`

Current development state of the project.

Use for concise operational status.

### `ATLAS_DECISIONS.md`

Accepted durable technical and architectural decisions.

Consult only when a task depends on an existing `DEC-*` decision or may conflict with one.

### `ATLAS_FAILURE_MODES.md`

Known process failure modes and self-correction guardrails.

Do not load for every routine task.

Consult when development begins becoming disproportionately complex, scope expands, excessive coordination appears, or completion lacks behavioral validation.

### `atlas-notes.md`

Current technical contract for Atlas Notes.

Contains persistence, canonical content, compatibility, synchronization and editor constraints.

---

## Quests

`docs/quests/` contains the operational quest interface.

### `quests/ACTIVE.md`

The current development quest.

This is the primary source for active implementation scope.

### `quests/TEMPLATE.md`

Template for a new Task Contract.

### `quests/ARCHITECTURE_GATE.md`

Interface used when a genuine architectural decision requires Hermes.

Hermes is not a routine approval step.

---

## Archive

`docs/archive/` contains historical development records that are no longer operational sources of truth.

Archived documents may explain previous implementation decisions, experiments or process history, but must not override:

1. the current product specification in Google Drive;
2. accepted `DEC-*` decisions;
3. the active quest;
4. the current codebase.

Archive content should only be consulted when historical context is genuinely required.

---

## Authority Model

- **Atlas** — Product & Specification Authority
- **Hermes** — Architecture Authority
- **Claude Code** — Implementation Authority

Atlas defines **WHAT**.

Hermes decides architecture only when a genuine Architecture Gate exists.

Claude Code decides **HOW** to implement within established product and architectural constraints.

---

## Context Principle

Use progressive disclosure.

Load only the documents required for the current decision or task.

Documentation supports development; it must not become development.