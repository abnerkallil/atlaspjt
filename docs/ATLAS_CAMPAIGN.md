# ATLAS PROJECT — STRATEGIC CAMPAIGN

## Purpose

This document is the strategic roadmap of the Atlas Project.

It defines:

- long-term project direction;
- quest sequencing;
- quest dependencies;
- milestones;
- priority relationships;
- MVP boundaries;
- FUT-* items;
- strategic constraints.

This document is NOT the operational specification for the task currently being implemented.

The authoritative current Task Contract is:

`docs/quests/ACTIVE.md`

The current operational state of the project is:

`docs/ATLAS_STATUS.md`

Architectural decisions belong to the project's DEC-* records.

---

# DOCUMENT ROUTING

This document should be read only when strategic context is relevant.

Codex should consult `ATLAS_CAMPAIGN.md` when:

- quest dependencies must be resolved;
- roadmap sequencing matters;
- priority is unclear;
- MVP versus FUT-* scope matters;
- the active quest explicitly depends on campaign context.

Hermes should consult `ATLAS_CAMPAIGN.md` only when strategic sequencing materially affects an architectural decision.

Do not require this document to be read for routine implementation work.

---

# CAMPAIGN AUTHORITY

The campaign owns strategic sequencing.

It does NOT own:

- low-level implementation details;
- current Task Contract acceptance criteria;
- routine code decisions;
- detailed development history;
- commit logs;
- implementation diaries;
- temporary debugging information.

---

# PRIORITY MODEL

Project priorities follow:

P0 > P1 > P2

Higher-priority work should take precedence unless a dependency prevents execution.

---

# QUEST DEPENDENCIES

Quest dependencies must be respected.

A dependent quest must not be treated as ready when a required predecessor is unresolved.

Dependencies should describe real execution constraints, not speculative relationships.

---

# DECISION DEPENDENCIES

DEC-* decisions must be resolved before implementation that materially depends on them.

Do not create DEC-* requirements for routine implementation details.

---

# MVP PROTECTION

FUT-* items represent future capabilities.

FUT-* work must not divert implementation effort from the MVP unless explicitly promoted into active scope.

Do not introduce architecture for FUT-* capabilities prematurely.

---

# DETERMINISTIC CORE

Advanced AI capabilities must not replace the deterministic core before that core has been validated.

AI-related future work should integrate with a stable deterministic foundation rather than substitute for unfinished core behavior.

---

# CAMPAIGN MAINTENANCE

Keep this document strategic.

When updating it:

- preserve quest dependencies;
- preserve priority relationships;
- preserve relevant milestones;
- preserve MVP versus FUT-* boundaries;
- remove obsolete strategic information when confirmed obsolete.

Do not add:

- detailed implementation logs;
- daily progress notes;
- acceptance criteria for the current task;
- test results;
- debugging notes;
- commit-by-commit history;
- low-level implementation instructions.

Detailed current work belongs in:

`docs/quests/ACTIVE.md`

Current operational state belongs in:

`docs/ATLAS_STATUS.md`