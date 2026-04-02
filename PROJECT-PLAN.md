# NeuroLex Project Plan

## Purpose

This document turns the product vision in [Neurolex-vision.md](/home/bahman/Neurolex%20Codex/Neurolex-vision.md) into an actionable implementation plan for the first build cycle.

## Product Goal

Build an Obsidian plugin called **NeuroLex** that delivers a structured German-learning experience through:

- a conductor agent (`Uebungsmeister`) that runs sessions
- specialist agents for speaking, writing, vocabulary, grammar, correction, curation, diagnostics, planning, and progress
- MongoDB-backed learner state
- Voyage-backed embedding workflows
- Obsidian notes and custom sidebar views for learner-facing outputs

## Recommended MVP

The full vision is ambitious. To reduce delivery risk, the first MVP should prove the learning loop before adding every module and view.

### MVP scope

- Obsidian plugin shell based on the Claudian fork
- rebrand to NeuroLex
- configurable CLI engine toggle: `Claude Code CLI` or `Codex CLI`
- core learner profile persistence
- session planning for one learner profile
- one complete session flow:
  - warm-up vocabulary review
  - grammar-focused core task
  - speaking or writing application task
  - session recap
- initial module set:
  - `Diagnostiker`
  - `Architekt`
  - `Mentor`
  - `Wortmeister`
  - `Grammatiktrainer`
  - `Korrektor`
  - `Uebungsmeister`
- note generation for:
  - session recaps
  - vocabulary lists
  - grammar summaries

### Defer until after MVP

- TTS voice loop
- full `Kurator`
- full `Schreibtrainer`
- full `Sprechtrainer` role-play depth
- grammar graph view
- advanced eval harness
- multi-learner support

## Workstreams

### 1. Fork and platform foundation

- fork Claudian at a stable revision
- preserve the existing build, chat, streaming, settings, and MCP infrastructure
- remove clearly unrelated generic features only after the fork builds cleanly
- rename plugin IDs, names, assets, and CSS tokens

### 2. NeuroLex domain model

- define TypeScript types for:
  - learner profile
  - grammar progress
  - SRS card
  - error log
  - avoidance tracking
  - session plan
  - session summary
  - Lernauftrag
- encode the Zone A/B/C prerequisite graph in code
- encode the behavioral rules as reusable prompt fragments or agent policies

### 3. Data and service layer

- decide whether MongoDB is reached through MCP only or via a direct driver abstraction
- create repository/service interfaces so the UI and agents do not depend directly on storage
- define a Voyage service abstraction for:
  - embeddings
  - similarity lookup
  - coverage analysis
  - error clustering

### 4. Agent system

- create one prompt file per agent
- define tool access boundaries for each module
- implement `Uebungsmeister` as the only learner-facing entry point
- support plan-driven delegation to specialist modules

### 5. Obsidian experience

- settings tab for engine, language, notes folder, and service connections
- sidebar dashboard for learner state
- note generation utilities and folder conventions
- session-oriented UX that shows current phase and recap output

### 6. Quality and evaluation

- unit tests for prerequisite graph enforcement
- unit tests for SRS scheduling
- synthetic tests for avoidance detection thresholds
- prompt-behavior tests for Korrektor and Architekt

## Delivery Phases

## Current Status

Status as of 2026-04-02:

- Phase 0: complete
- Phase 1: complete
- Phase 2: complete
- Phase 3: complete
- Phase 4: next
- Current recommendation:
  move into voice, dedicated views, and stronger evaluation coverage

### Phase 3 implementation target

- add `Kurator` to frame realistic application scenarios
- branch the application phase into `Schreibtrainer` or `Sprechtrainer`
- make application mode and task framing respond directly to Lernauftrag and upcoming-task language
- ensure `Uebungsmeister` packages the curation brief and application artifact together with the existing session outputs

### Phase 2 implementation target

- `Uebungsmeister` should orchestrate one complete note-driven session package
- the package should include:
  - session plan
  - vocabulary warm-up note
  - grammar core note
  - correction guide
  - session recap
- the first learner-facing command should generate the full package into the vault in one pass
- vocabulary and grammar notes must be saved as standalone artifacts inside the session tree

## Phase 0: Bootstrap

- fork Claudian into this repo
- verify local build
- rebrand the plugin shell
- commit base project structure

## Phase 1: Core data + planning loop

- add domain models
- implement learner profile persistence
- implement prerequisite graph logic
- implement `Diagnostiker`
- implement `Architekt`
- implement `Mentor`

**Exit criteria**

- given a learner profile, the system can create a valid session plan
- session recap notes can be generated into the vault structure

## Phase 2: First complete session

- implement `Wortmeister`
- implement `Grammatiktrainer`
- implement `Korrektor`
- implement `Uebungsmeister`
- wire a simple warm-up -> core -> application -> cool-down flow

**Exit criteria**

- one end-to-end session completes successfully
- vocabulary and grammar outputs are saved as notes

## Phase 3: Production depth

- add `Schreibtrainer`
- add `Sprechtrainer`
- add `Kurator`
- implement Lernauftrag-driven plan adjustment

## Phase 4: Voice, views, and stronger evals

- add TTS support
- add session view
- add grammar graph view
- expand eval coverage

## Immediate Next Steps

1. Fork the Claudian source into this repository.
2. Add a `README.md` that reflects the NeuroLex product and MVP direction.
3. Create the initial source layout:
   - `src/`
   - `src/agents/`
   - `src/domain/`
   - `src/services/`
   - `src/views/`
   - `src/settings/`
   - `tests/`
4. Implement shared domain types before any agent logic.
5. Encode the grammar prerequisite graph as test-backed data.
6. Build `Diagnostiker` and `Architekt` first, because every other module depends on them.

## Open Decisions

These are the most important planning decisions still unresolved at implementation level:

- exact Claudian version or tag to fork from
- direct MongoDB driver vs. MCP-only database access
- how agent prompts are stored and loaded inside the plugin
- whether module orchestration is pure prompt routing, code-driven state machine, or hybrid
- what the first learner calibration flow looks like in the UI

## Suggested Definition of Done for the first milestone

The first milestone is complete when:

- the repo contains a working NeuroLex-branded Obsidian plugin shell
- a sample learner profile can be created and stored
- the prerequisite graph is encoded and tested
- `Architekt` can generate a structured session plan
- `Mentor` can generate a recap note
- the project can be built locally without manual patching
