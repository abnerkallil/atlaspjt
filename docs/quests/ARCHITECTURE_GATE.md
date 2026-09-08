\# ATLAS PROJECT — ARCHITECTURE GATE



\## Purpose



This file is the temporary communication interface between Codex and Hermes when a real Architecture Gate is triggered.



It exists to preserve separation of authority:



\- Atlas defines the original product requirement;

\- Codex reports relevant repository facts;

\- Hermes makes the architectural decision.



This file must NOT be used for routine implementation questions.



If no Architecture Gate exists, this file should remain in the IDLE state.



\---



\# GATE STATUS



Status: IDLE



Allowed states:



\- IDLE

\- PENDING

\- RESOLVED



\---



\# QUEST



NONE



The authoritative product requirement remains:



`docs/quests/ACTIVE.md`



This file must never replace or reinterpret the active Task Contract.



\---



\# ARCHITECTURAL QUESTION



NONE



State only the architectural question that blocks or materially affects implementation.



Do not include routine implementation questions.



\---



\# GATE TRIGGER



NONE



When activated, identify the concrete Architecture Gate trigger.



Valid examples:



\- persistent data model change;

\- architectural boundary change;

\- significant structural dependency;

\- authentication or security architecture;

\- data migration;

\- major cross-system change;

\- conflict with an ACCEPTED DEC-\*;

\- meaningful architectural trade-off;

\- expensive or difficult-to-reverse decision;

\- product requirement incompatible with current architecture.



\---



\# ORIGINAL REQUIREMENT



Refer to the relevant requirement from:



`docs/quests/ACTIVE.md`



Do not rewrite the requirement in a way that changes its meaning.



If useful, quote only the smallest relevant portion.



\---



\# RELEVANT REPOSITORY FACTS



NONE



Codex should place only facts necessary for the architectural decision here.



Examples:



\- current subsystem used;

\- existing architectural limitation;

\- current persistent model;

\- relevant interfaces;

\- existing dependency;

\- relevant source locations;

\- technical constraint discovered during investigation.



Do not place:



\- broad repository summaries;

\- unrelated implementation details;

\- speculative future work;

\- arguments designed to convince Hermes of Codex's preferred solution.



\---



\# EXISTING ARCHITECTURAL CONSTRAINTS



NONE



List only constraints that actually apply.



Examples:



\- ACCEPTED DEC-\* records;

\- existing subsystem boundaries;

\- compatibility requirements;

\- persistence constraints;

\- security constraints.



\---



\# OPTION A



NONE



\## Description



NONE



\## Architectural Advantages



NONE



\## Architectural Costs / Risks



NONE



\---



\# OPTION B



NONE



\## Description



NONE



\## Architectural Advantages



NONE



\## Architectural Costs / Risks



NONE



\---



\# ADDITIONAL OPTION



Use only when genuinely necessary.



Otherwise:



NONE



\---



\# CODEX RECOMMENDATION



NOT REQUESTED



Codex must not advocate for an option by default.



This section should remain:



NOT REQUESTED



unless Hermes explicitly requests an implementation recommendation.



If Hermes requests one, Codex may provide a concise recommendation while clearly separating:



\- facts;

\- assumptions;

\- implementation preference.



\---



\# DECISION REQUIRED



NONE



State the smallest architectural decision needed to unblock implementation.



Do not ask Hermes to review the entire implementation.



Do not ask Hermes to approve Codex's work generally.



\---



\# HERMES DECISION



Not evaluated.



\---



\## Decision



NONE



\---



\## Rationale



NONE



Maximum three concise reasons by default.



\---



\## Constraints for Codex



NONE



Only include constraints that implementation must preserve.



\---



\## DEC Required



NONE



Allowed values:



\- YES

\- NO



If YES, the durable decision must be recorded in:



`docs/ATLAS\_DECISIONS.md`



\---



\# RESOLUTION RULE



When Hermes completes the architectural evaluation:



1\. set `Status: RESOLVED`;

2\. record the decision;

3\. indicate whether a DEC-\* is required;

4\. Codex may resume dependent implementation;

5\. if a durable DEC-\* was created, Codex must respect it.



After the active quest no longer requires this gate, reset this file to its IDLE state.



Do not use this file as permanent architectural history.



Permanent architectural history belongs in:



`docs/ATLAS\_DECISIONS.md`



\---



\# NON-ARCHITECTURAL RULE



If Hermes determines that the request does not require architectural authority, Hermes should write:



Decision:



NO ARCHITECTURAL DECISION REQUIRED.



Constraints for Codex:



Proceed within the existing architecture.



DEC Required:



NO



Then set:



Status: RESOLVED



Hermes must not invent architecture merely because this file was activated.



\---



\# CORE PRINCIPLE



Codex supplies evidence.



Hermes supplies architectural judgment.



Atlas supplies the product requirement.



These responsibilities must remain separate.

