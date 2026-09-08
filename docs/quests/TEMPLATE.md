\# ATLAS PROJECT — QUEST TEMPLATE



\## Quest



QUEST-XXX — Short descriptive title



\## Priority



P0 | P1 | P2



\## Complexity



SMALL | MEDIUM | LARGE



\## Hermes Gate



NO | CONDITIONAL | YES



\---



\## Objective



Describe what the feature must achieve from the product perspective.



Keep this concise.



\---



\## Required Behavior



Describe only observable behavior that must exist.



Example:



\- right-click inside the editor opens a contextual menu;

\- selecting "Bold" applies bold formatting to the current selection;

\- clicking outside closes the menu.



Avoid implementation details unless they are genuine constraints.



\---



\## Acceptance Criteria



List only conditions that must be true before the quest can be considered complete.



Example:



\- \[ ] required behavior works;

\- \[ ] relevant edge cases were checked;

\- \[ ] no known acceptance criterion is failing;

\- \[ ] relevant tests/checks pass;

\- \[ ] UI behavior was manually validated when applicable.



A rendered control is not considered implemented unless its behavior works.



\---



\## UX Constraints



Use only when the task has explicit visual or interaction requirements.



Examples:



\- contextual instead of persistent;

\- opens near the cursor;

\- closes with Escape;

\- must follow an attached visual reference;

\- must not alter an existing interaction paradigm.



If there are no relevant UX constraints:



None.



\---



\## Non-Goals



Explicitly list work that must NOT be included in this quest.



Examples:



\- no unrelated refactor;

\- no architecture redesign;

\- no new dependency;

\- no redesign of adjacent screens.



If none:



None.



\---



\## Dependencies



List only real dependencies.



Examples:



\- QUEST-012;

\- DEC-003;

\- existing editor command API.



If none:



None.



\---



\## Complexity Budget



Use the defaults below unless the task has a justified exception.



\### For SMALL



Architecture: NONE  

Hermes: 0  

Documentation: NONE  

Refactor: LOCAL ONLY  

Dependencies: NONE unless technically required



\### For MEDIUM



Architecture: LIMITED  

Hermes: normally 0–1 architectural decisions  

Documentation: UPDATE EXISTING WHEN NECESSARY  

Refactor: RELATED CODE ONLY  

Dependencies: only when justified



\### For LARGE



Architecture: OPEN  

Hermes: AS REQUIRED  

Documentation: ALLOWED  

Refactor: according to approved architecture  

Dependencies: according to architectural decision



\---



\## Validation



Define what Codex must verify before completion.



Prefer targeted validation.



Examples:



\- targeted unit/integration test;

\- manual functional test;

\- UI interaction validation;

\- relevant project checks;

\- final build;

\- final diff review.



Do not require the entire repository test suite unless it is relevant or already mandatory.



\---



\# QUEST AUTHORING RULES



A quest should be as small as possible while still containing enough information to verify the intended result.



Do not turn the Task Contract into:



\- an implementation plan;

\- an architecture document;

\- a development diary;

\- a speculative future design;

\- a long explanation of the project.



Atlas defines WHAT must work.



Codex determines HOW to implement it inside the established architecture.



Hermes participates only when an Architecture Gate exists.



\---



\# COMPLEXITY CLASSIFICATION GUIDE



\## SMALL



Use SMALL when the task is:



\- local;

\- reversible;

\- compatible with current architecture;

\- limited in scope;

\- primarily implementation work.



Typical examples:



\- local UI;

\- formatting command;

\- local bug;

\- styling;

\- modal;

\- button;

\- contextual menu;

\- routine component behavior.



\---



\## MEDIUM



Use MEDIUM when the task:



\- crosses multiple related components;

\- requires broader integration;

\- may expose one architectural question;

\- remains mostly inside established architecture.



Typical examples:



\- tags;

\- search;

\- multi-component feature;

\- significant editor capability;

\- bounded subsystem integration.



\---



\## LARGE



Use LARGE when the task:



\- changes architecture;

\- changes persistent data models;

\- introduces major structural dependencies;

\- changes security/authentication;

\- requires migration;

\- is difficult or expensive to reverse.



Typical examples:



\- synchronization architecture;

\- persistence redesign;

\- editor engine replacement;

\- authentication;

\- database migration;

\- concurrency model;

\- major API architecture.



\---



\# DEFAULT PRINCIPLE



Spend reasoning in proportion to decision risk.



Simple tasks should remain simple.



Prefer the smallest correct change that fully satisfies the observable requirements.

