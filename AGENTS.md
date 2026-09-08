\# Atlas Project — Agent Instructions



This repository belongs to the Atlas Project.



These instructions apply to any AI agent working inside this repository.



\## Project Context



Before starting any meaningful task, read:



1\. `docs/ATLAS\_CAMPAIGN.md`

2\. `docs/ATLAS\_STATUS.md`



These files define the development roadmap and the current state of the project.



Do not assume project status from previous conversations or memory when the repository contains more recent information.



\---



\## Quest System



Atlas development follows the gamified quest system defined in:



`docs/ATLAS\_CAMPAIGN.md`



Every implementation task should be associated with a relevant quest whenever possible.



Respect quest dependencies.



Do not begin a quest whose required dependencies are incomplete.



Priority order is:



`P0 > P1 > P2`



When choosing between available tasks, higher-priority work takes precedence.



\---



\## Architectural Decisions



Items identified as `DEC-\*` represent architectural or product decisions.



A `DEC-\*` must be resolved before implementing functionality that depends on it.



Do not silently choose an answer for an unresolved decision.



If a task depends on an unresolved `DEC-\*`, identify it as a blocker.



\---



\## Future Features



Items identified as `FUT-\*` represent future functionality.



Future features must not divert effort from the current MVP unless explicitly promoted into the active roadmap.



Avoid premature abstractions or infrastructure created only for hypothetical future features.



\---



\## Deterministic Core



The deterministic core of Atlas has priority over advanced AI functionality.



Do not replace deterministic logic with probabilistic or AI-driven behavior before the deterministic implementation has been validated.



AI should enhance the project where useful, not become an unnecessary dependency for logic that can be implemented reliably.



\---



\## Investigate Before Modifying



Before modifying existing code:



1\. Locate the relevant implementation.

2\. Understand how it currently works.

3\. Inspect related files, types, tests and dependencies.

4\. Check whether similar functionality already exists.

5\. Follow existing project conventions when appropriate.



Do not create duplicate implementations of functionality that already exists.



Prefer modifying or extending the existing implementation when it is appropriate.



\---



\## Scope Discipline



Prefer the smallest coherent change that completely solves the current task.



Avoid:



\- unrelated refactors;

\- speculative abstractions;

\- unnecessary dependencies;

\- premature frameworks;

\- rewriting working systems without a concrete reason;

\- changing unrelated behavior while completing a quest.



Keep each quest focused on its intended objective.



\---



\## Validation



Before considering implementation work complete, run the relevant validations.



Depending on the affected area, this may include:



\- tests;

\- lint;

\- type checking;

\- formatting checks;

\- builds;

\- targeted runtime verification.



Do not claim a quest is complete when relevant validation has not been performed.



If a validation cannot be executed, explicitly report:



\- which validation was not performed;

\- why;

\- what remains uncertain.



\---



\## Project Status



After completing meaningful project work, verify whether:



`docs/ATLAS\_STATUS.md`



needs to be updated.



The status file must reflect the real state of the repository.



Do not mark quests, decisions or milestones as complete unless they are actually complete and appropriately validated.



When relevant, record:



\- completed quests;

\- newly available quests;

\- blockers;

\- resolved decisions;

\- validation results;

\- important discoveries.



\---



\## Safety



Do not perform destructive repository operations unless explicitly required.



Avoid actions such as:



\- `git reset --hard`;

\- force pushing;

\- deleting unrelated files;

\- discarding existing user work;

\- overwriting configuration without investigation;

\- exposing credentials or secrets.



Treat unexpected existing modifications as potentially belonging to the user.



\---



\## Resource Efficiency



Treat credit consumption and process efficiency as quality metrics, without reducing correctness or safety.



Default rules:



\- Open zero visible browser or Atlas preview tabs unless the user explicitly requests one.

\- Prefer build, targeted tests, type checking and non-browser HTTP requests for validation.

\- Batch independent read-only checks and avoid polling unchanged state.

\- During iteration, run the smallest relevant validation; run broader validation once at the appropriate gate.

\- Stop development servers and other retained processes as soon as their verification is complete.

\- Keep Hermes exchanges concise, technically sanitized and limited to decision or review boundaries.

\- For Atlas coordination, use Muse Spark explicitly. Do not use Bonsai or LM Studio unless the user later authorizes that model again.

\- Record each Hermes exchange in the project coordination log, including its session reference and result.



For each meaningful gate, report at minimum whether any visible tabs were opened and whether any retained process remains running.



\---



\## Definition of Done



A quest is considered complete only when:



1\. its intended behavior has been implemented;

2\. required dependencies have been respected;

3\. relevant `DEC-\*` items have been resolved;

4\. relevant validations have been performed successfully, or limitations have been documented;

5\. no known regression has been introduced;

6\. `docs/ATLAS\_STATUS.md` has been updated when appropriate.
