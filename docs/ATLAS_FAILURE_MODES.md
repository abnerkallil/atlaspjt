# ATLAS PROJECT — KNOWN FAILURE MODES

## Purpose

This document records process failure modes already observed during Atlas development.

These are not ordinary product bugs.

They are recurring agent behaviors that previously caused:

- disproportionate token and reasoning consumption;
- unnecessary architectural work;
- excessive documentation;
- implementation delays;
- scope expansion;
- poor UX fidelity;
- weak functional validation;
- unnecessary coordination between agents.

The purpose of this document is to help Atlas, Hermes and Codex recognize these patterns before repeating them.

---

# IMPORTANT PRINCIPLE

Failure Modes are guardrails, not absolute prohibitions.

A behavior described here may be legitimate when the task genuinely requires it.

The warning condition is:

> The complexity of the process becomes disproportionate to the actual product or architectural risk.

When a known Failure Mode appears, the agent should reassess the current task before continuing.

Do not automatically stop valid work.

Do not automatically escalate.

First determine whether the complexity is justified by concrete evidence.

---

# USAGE POLICY

This document is reference material.

It should NOT be loaded for every routine task.

Consult it when:

- a SMALL task begins becoming complex;
- planning becomes unusually large;
- multiple agents are being involved;
- an Architecture Gate is being considered;
- new documentation is being proposed;
- scope begins expanding;
- implementation is taking disproportionately long;
- a task is being reported complete despite uncertain behavior;
- Atlas, Hermes or Codex suspects process overproduction.

For ordinary implementation that clearly follows the active Task Contract, continue without loading this document.

---

# FM-001 — ARCHITECTURE INFLATION

## Signal

A local or reversible task begins producing:

- architectural alternatives;
- migration strategies;
- subsystem redesign;
- new abstraction layers;
- broad architectural analysis;
- Hermes consultation;

without a concrete Architecture Gate.

Typical example:

A contextual editor feature becomes a discussion about replacing the editor engine, changing the persistent document format or redesigning the note architecture before evidence shows that this is necessary.

## Why This Is a Problem

Atlas previously spent disproportionate reasoning and development budget on features whose observable requirement was much smaller than the process created around them.

Architecture should respond to architectural risk.

Feature existence alone does not justify architectural work.

## Expected Behavior

Return to the active Task Contract.

Ask:

1. Can the requirement be implemented safely inside the existing architecture?
2. Is there concrete repository evidence that a durable architectural boundary must change?

If yes to the first and no to the second:

Proceed with implementation.

## Legitimate Exception

Investigation proves that satisfying the requirement safely requires a durable architectural change.

In that case, activate the Architecture Gate.

---

# FM-002 — DOCUMENTATION AS DEVELOPMENT

## Signal

The task begins generating documentation whose volume or effort approaches or exceeds the implementation itself.

Examples:

- multiple Gate documents;
- staging documents;
- coordination logs;
- implementation handoffs;
- repeated planning documents;
- temporary architectural reports;
- documentation about other documentation.

## Why This Is a Problem

Documentation can become a substitute for delivering working software.

Atlas previously created substantial process artifacts around comparatively small features.

This increased token consumption and slowed implementation without proportionate product value.

## Expected Behavior

Documentation effort must match task complexity.

For SMALL:

- no new process documentation;
- no architecture document;
- no development diary.

For MEDIUM:

- update existing documentation only when necessary.

For LARGE:

- architectural documentation is allowed when justified.

## Legitimate Exception

The document itself is required to preserve a durable architectural or product decision.

---

# FM-003 — APPROVAL LOOP

## Signal

Codex repeatedly asks Hermes whether routine implementation choices are acceptable.

Examples:

- asking Hermes about handlers;
- asking Hermes about local component structure;
- asking Hermes about CSS;
- asking Hermes to approve implementation progress;
- asking Hermes multiple times during one small feature.

## Why This Is a Problem

Hermes becomes a routine supervisor rather than an architectural authority.

Every consultation creates additional context, reasoning and handoff cost.

It also reduces Codex implementation autonomy.

## Expected Behavior

Codex decides routine implementation inside the established architecture.

Hermes participates only when a real Architecture Gate exists.

One architectural question should normally produce one Hermes decision cycle.

## Legitimate Exception

New repository evidence reveals a genuinely new architectural issue that materially changes the previous decision.

---

# FM-004 — BIASED ESCALATION

## Signal

Codex presents its preferred solution to Hermes and asks for approval.

Example:

"I believe Option A is the right architecture because X, Y and Z. Do you agree?"

## Why This Is a Problem

The implementation agent controls the framing of the architectural decision.

Hermes may end up validating Codex's proposal rather than independently evaluating the original requirement and repository facts.

## Expected Behavior

Codex supplies:

- original requirement;
- relevant repository facts;
- existing constraints;
- materially different options;
- trade-offs;
- smallest decision required.

Hermes supplies architectural judgment.

Codex recommendation remains `NOT REQUESTED` unless Hermes explicitly asks for it.

## Legitimate Exception

Hermes explicitly requests Codex's implementation recommendation after independently understanding the architectural problem.

---

# FM-005 — UX SUBSTITUTION

## Signal

An explicit interaction or visual requirement is replaced by a different paradigm because it is easier to implement.

Example:

Requested:

Contextual formatting menu activated by right-click.

Delivered:

Permanent formatting toolbar.

## Why This Is a Problem

The code may technically expose similar commands while failing the actual product requirement.

Implementation convenience must not redefine product behavior.

## Expected Behavior

Atlas owns observable UX requirements.

Codex may choose HOW to implement them.

Codex may not replace them.

Hermes may report architectural conflict but may not silently redesign the product requirement.

## Legitimate Exception

The original behavior is technically impossible or creates a material architectural/security conflict.

The conflict must be surfaced to Atlas rather than silently substituted.

---

# FM-006 — SPECULATIVE FUTURE-PROOFING

## Signal

The current implementation introduces complexity primarily for features that do not exist yet.

Examples:

- abstraction for hypothetical future providers;
- migration infrastructure without a migration requirement;
- generic architecture for FUT-* capabilities;
- extensibility layers without current consumers;
- implementation choices optimized for speculative roadmap scenarios.

## Why This Is a Problem

Future flexibility has immediate implementation, maintenance and reasoning cost.

Atlas previously allowed future possibilities to influence MVP implementation too early.

## Expected Behavior

Implement for the current validated requirement.

Respect FUT-* boundaries.

Do not introduce architecture for future capabilities until current requirements justify it.

## Legitimate Exception

A small design choice now would prevent a clearly identified, near-term and expensive incompatibility later.

The justification must be concrete.

---

# FM-007 — CONTEXT FLOODING

## Signal

An agent loads broad project context for a narrow task.

Examples:

- full Campaign for a CSS change;
- complete decision history for a local bug;
- historical coordination logs for an editor command;
- broad repository scans when a small set of files is sufficient.

## Why This Is a Problem

More context is not automatically better context.

Irrelevant information:

- consumes tokens;
- increases reasoning surface;
- exposes speculative future requirements;
- encourages unnecessary abstraction;
- increases the chance of conflicting instructions.

## Expected Behavior

Use progressive disclosure:

IDENTITY  
→ CURRENT WORK  
→ RELEVANT KNOWLEDGE  
→ RELEVANT SOURCE CODE

Context must be earned by relevance.

## Legitimate Exception

The task genuinely depends on cross-system or historical architectural context.

---

# FM-008 — VALIDATION THEATER

## Signal

A task is declared complete because:

- the build passes;
- the component renders;
- buttons exist;
- TypeScript compiles;
- lint passes;

while required user behavior was not actually exercised.

## Why This Is a Problem

Technical validity is not the same as product correctness.

Atlas previously received UI controls that rendered successfully while several commands did not function.

## Expected Behavior

Implementation is not completion.

Validate observable acceptance criteria.

For UI work, when the environment allows:

1. run the application;
2. perform the interaction;
3. verify every required command;
4. compare relevant UX behavior;
5. fix discrepancies before completion.

## Legitimate Exception

The environment cannot execute the relevant behavior.

In that case, explicitly report what could not be verified.

Do not claim that unverified behavior passed.

---

# FM-009 — PROCESS FRAGMENTATION

## Signal

A straightforward task is divided into many agent stages such as:

- recognition;
- analysis;
- architecture;
- first handoff;
- second handoff;
- staging;
- review;
- coordination;
- another review;
- implementation.

Each stage rereads context and produces another artifact.

## Why This Is a Problem

Breaking prompts into smaller messages does not necessarily reduce total work.

Repeated agent transitions may increase:

- context reconstruction;
- tool calls;
- token use;
- documentation;
- coordination overhead.

## Expected Behavior

For SMALL tasks prefer:

INSPECT  
→ IMPLEMENT  
→ TEST  
→ VALIDATE  
→ COMMIT

For MEDIUM tasks add only genuinely necessary coordination.

For LARGE tasks deeper staged work is acceptable.

## Legitimate Exception

The task contains genuinely independent high-risk stages that should not be executed together.

---

# FM-010 — SCOPE EXPANSION DURING INVESTIGATION

## Signal

While inspecting the repository, an agent discovers adjacent improvements and silently adds them to the active quest.

Examples:

- unrelated cleanup;
- modernization;
- neighboring UI redesign;
- broader refactor;
- additional features;
- performance work unrelated to acceptance criteria.

## Why This Is a Problem

Investigation should improve implementation understanding, not redefine scope.

Uncontrolled expansion increases risk and makes completion harder to evaluate.

## Expected Behavior

Use the active Task Contract as the boundary.

If an unrelated issue is discovered:

- do not implement it automatically;
- report it separately if materially important;
- continue the active task.

## Legitimate Exception

The discovered issue directly prevents correct completion of the active requirement.

---

# FM-011 — GENERAL REVIEW INSTEAD OF TARGETED DECISION

## Signal

Hermes receives one architectural question and begins reviewing or redesigning the entire subsystem.

## Why This Is a Problem

A targeted Architecture Gate turns into open-ended architecture work.

This increases reasoning cost and may introduce decisions unrelated to the blocker.

## Expected Behavior

Hermes answers the smallest architectural question necessary to unblock implementation.

Do not redesign adjacent systems.

Do not solve unrelated future problems.

## Legitimate Exception

The architectural issue cannot be safely resolved independently because several boundaries are inseparable.

---

# FM-012 — DUPLICATE SOURCES OF TRUTH

## Signal

The same operational information is independently maintained in multiple places.

Examples:

- Drive and GitHub both contain separate editable copies of ACTIVE;
- local folder contains authoritative documents not present in cloud;
- architectural decisions are independently maintained in multiple files;
- different agents rely on different copies of the same specification.

## Why This Is a Problem

The project can no longer reliably answer:

"Which version is authoritative?"

Divergence creates incorrect decisions and unnecessary reconciliation work.

## Expected Behavior

Current source model:

### Google Drive

Source of truth for Atlas product and governance knowledge.

### GitHub

Source of truth for:

- source code;
- operational development state;
- Codex instructions;
- Hermes instructions;
- current quest;
- architectural decisions.

### Atlas Cloud

Coordination and product-specification environment.

Local copies are never authoritative.

## Legitimate Exception

Read-only mirrors or backups are allowed when they are clearly identified as non-authoritative.

---

# FM-013 — IMPLEMENTATION PLAN OVERPRODUCTION

## Signal

Before coding begins, a SMALL task receives a detailed implementation plan containing:

- specific file-by-file instructions;
- speculative functions;
- proposed classes;
- detailed internal APIs;
- predicted refactors;
- extensive implementation sequencing.

## Why This Is a Problem

Atlas begins doing Codex's job before Codex has inspected the current repository.

The implementation plan may be based on assumptions rather than actual code.

It also consumes reasoning before implementation value has been produced.

## Expected Behavior

Atlas defines:

- objective;
- observable behavior;
- acceptance criteria;
- UX constraints;
- scope;
- complexity;
- validation.

Codex inspects the repository and determines implementation.

## Legitimate Exception

The exact technical structure is itself an established architectural constraint.

---

# FM-014 — TOOL / BUILD LOOP OVERUSE

## Signal

The agent repeatedly runs expensive broad checks after small edits.

Examples:

FULL BUILD  
→ edit  
→ FULL BUILD  
→ minor edit  
→ FULL TEST SUITE  
→ another edit  
→ FULL BUILD

when targeted checks could provide faster feedback.

## Why This Is a Problem

Validation cost becomes disproportionate to change size.

Repeated broad commands can consume significant agent time and token budget.

## Expected Behavior

Prefer:

1. targeted inspection;
2. targeted validation;
3. feature validation;
4. required project checks;
5. final build when relevant.

Use broad checks when they provide meaningful confidence.

## Legitimate Exception

The project explicitly requires a full check or the change affects broad system behavior.

---

# FM-015 — COMPLETION BY NARRATIVE

## Signal

The completion report describes the implementation convincingly but lacks evidence that acceptance criteria were actually validated.

## Why This Is a Problem

A detailed explanation can create the appearance of completeness without proving working behavior.

## Expected Behavior

Completion reports should be concise and evidence-oriented.

Include:

- what changed;
- what was actually validated;
- relevant tests/checks;
- unresolved limitations.

Do not substitute explanation volume for verification.

## Legitimate Exception

None.

Claims of validated behavior must correspond to actual validation.

---

# SELF-CORRECTION RULE

When Atlas, Hermes or Codex detects a likely Failure Mode:

1. identify the suspected FM-*;
2. determine whether current complexity is justified;
3. return to the active Task Contract;
4. remove unnecessary process work;
5. continue from the smallest correct next action.

Do not create a new report merely to document that a Failure Mode was detected.

For routine cases, self-correct silently.

Mention the Failure Mode only when:

- it affects scope;
- it requires user awareness;
- it blocks work;
- it explains why an escalation is being rejected.

---

# CORE PHILOSOPHY

The Atlas development process exists to produce correct software safely.

The process itself is not the product.

Prefer:

working behavior  
over process volume;

relevant context  
over maximum context;

targeted decisions  
over general reviews;

implementation autonomy  
over routine approval;

validated outcomes  
over persuasive completion narratives;

the smallest correct change  
over speculative sophistication.
