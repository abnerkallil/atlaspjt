\# ATLAS PROJECT — ARCHITECTURAL DECISIONS



\## Purpose



This document records durable architectural decisions for the Atlas Project.



It exists to preserve architectural intent across future development.



It must remain concise.



This document is NOT:



\- an implementation diary;

\- a commit history;

\- a record of routine technical choices;

\- a place to document every development task;

\- a substitute for source code documentation.



Only decisions with lasting architectural relevance belong here.



\---



\# AUTHORITY



Atlas owns product requirements.



Hermes owns architectural decisions.



Codex owns implementation decisions inside the established architecture.



A DEC-\* record should normally represent a decision made or validated by Hermes.



Codex must respect active DEC-\* decisions.



Codex must not create DEC-\* records for routine implementation choices.



\---



\# WHEN TO CREATE A DECISION



Create a DEC-\* only when the decision is:



\- architectural;

\- durable;

\- relevant to future development;

\- difficult or expensive to reverse;

\- likely to affect multiple future implementations;

\- important enough that future agents should understand why the architecture works this way.



Typical DEC-\* subjects:



\- persistence strategy;

\- canonical data model;

\- editor engine;

\- synchronization architecture;

\- authentication architecture;

\- security boundaries;

\- major subsystem boundaries;

\- significant structural dependencies;

\- concurrency model;

\- long-term integration strategy.



\---



\# WHEN NOT TO CREATE A DECISION



Do NOT create DEC-\* records for:



\- CSS choices;

\- button behavior;

\- local handlers;

\- helper functions;

\- local component structure;

\- routine refactors;

\- test organization;

\- variable names;

\- file names;

\- local implementation techniques;

\- ordinary bug fixes;

\- routine UI behavior.



These belong to Codex implementation authority.



\---



\# DECISION STATES



Use one of the following states:



\- PROPOSED

\- ACCEPTED

\- SUPERSEDED

\- REJECTED



Only ACCEPTED decisions constrain implementation.



A SUPERSEDED decision must identify the DEC-\* that replaced it.



\---



\# DECISION FORMAT



Use this format for each architectural decision:



\---



\## DEC-XXX — Short Decision Title



Status: PROPOSED | ACCEPTED | SUPERSEDED | REJECTED



Date: YYYY-MM-DD



\### Context



Briefly describe the architectural problem.



Include only the information necessary to understand why a decision was required.



\### Decision



State the architectural decision clearly.



\### Rationale



Maximum three concise reasons by default.



1\.

2\.

3\.



\### Constraints for Codex



List only implementation constraints that must be preserved.



If none:



None.



\### Consequences



Describe only meaningful architectural consequences.



Avoid speculative future design.



\### Related



Quest: NONE



Supersedes: NONE



Superseded by: NONE



\---



\# DECISION SCOPE



Each DEC-\* should answer the smallest architectural question necessary.



Do not solve unrelated future problems.



Do not expand the decision simply because adjacent architecture exists.



Prefer the smallest durable architectural decision that preserves long-term project integrity.



\---



\# HERMES DECISION PROCESS



When an Architecture Gate is triggered:



1\. read the original active quest;

2\. identify the precise architectural question;

3\. inspect only relevant project context;

4\. evaluate alternatives independently;

5\. make the smallest necessary architectural decision;

6\. determine whether a DEC-\* record is actually required.



If the decision is routine or local:



Do not create a DEC-\*.



If no architectural decision is required, Hermes should return:



NO ARCHITECTURAL DECISION REQUIRED.



Proceed within the existing architecture.



\---



\# CODEX RULE



Codex must:



\- respect ACCEPTED DEC-\* decisions;

\- consult relevant DEC-\* records only when the current task touches them;

\- escalate conflicts instead of silently overriding a decision.



Codex must NOT:



\- read every DEC-\* record for every task;

\- create DEC-\* records for routine implementation;

\- reinterpret architectural decisions without an Architecture Gate.



\---



\# MAINTENANCE



Keep this document concise.



Do not duplicate:



\- Task Contracts;

\- implementation plans;

\- test reports;

\- commit messages;

\- daily development notes;

\- detailed source-code explanations.



The goal is to answer:



"What architectural decisions must future Atlas development preserve?"

