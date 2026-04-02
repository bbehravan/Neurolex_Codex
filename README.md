# NeuroLex

NeuroLex is an Obsidian plugin for AI-powered language acquisition.

This repository is being built as a focused fork of Claudian, reworked into a dedicated language tutor with:

- structured session orchestration
- specialized tutoring modules
- grammar prerequisite tracking
- spaced repetition support
- learner analytics and avoidance detection
- Obsidian-native notes and dashboard views

## Current status

This repo has been bootstrapped from Claudian `1.3.72` and now completes the first NeuroLex MVP foundation:

- learner profile persistence and calibration
- prerequisite-aware session planning
- recap generation through `Mentor`
- one end-to-end note-driven session package through `Uebungsmeister`

Current repository priorities:

- preserve the stable Obsidian plugin shell from Claudian
- rebrand the plugin to NeuroLex
- deepen the first MVP learning loop before advanced voice and dashboard features
- move from Phase 2 into richer learner-facing production modules

## MVP direction

The first NeuroLex milestone focuses on a working planning-and-session core:

- `Diagnostiker` for learner state
- `Architekt` for session planning
- `Mentor` for recap output
- `Wortmeister` for warm-up review
- `Grammatiktrainer` for structured grammar practice
- `Korrektor` for correction policy
- `Uebungsmeister` as the learner-facing conductor

## Repository layout

Key areas in this repo:

- [Neurolex-vision.md](/home/bahman/Neurolex%20Codex/Neurolex-vision.md): product vision
- [PROJECT-PLAN.md](/home/bahman/Neurolex%20Codex/PROJECT-PLAN.md): implementation roadmap
- `src/`: plugin source code
- `src/domain/`: NeuroLex learning model and grammar graph
- `src/services/`: NeuroLex planning services
- `tests/unit/`: unit coverage for new learning logic

## Development

```bash
npm install
npm run test -- --selectProjects unit
npm run build
```

## Notes

- The upstream Claudian architecture is intentionally preserved for now so the fork stays buildable while NeuroLex-specific features are introduced incrementally.
- Branding, module wiring, and learner-facing UX will continue to evolve as the implementation moves from bootstrap into MVP delivery.
