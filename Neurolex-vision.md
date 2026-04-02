---
title: "NeuroLex — Project Vision"
type: vision
project: neurolex
status: draft
created: 2026-04-02
---

# NeuroLex — Project Vision

## 1. Vision Statement

**NeuroLex** is an AI-powered language acquisition system that lives inside Obsidian. It is a fork of Claudian — rebranded, stripped of generic features, and rebuilt as a dedicated language tutor with 10 specialized AI modules, spaced repetition, grammar prerequisite tracking, avoidance detection, and adaptive session orchestration.

Unlike chatbot tutors that offer shallow conversation practice, NeuroLex is architecturally opinionated: it separates *correction* from *instruction* from *planning* from *diagnosis*. Each module has a single responsibility, behavioral rules, and a defined interface. The system doesn't just chat — it observes what the learner avoids, schedules what they need, and adapts in real time.

The learner's data lives in three tiers: MongoDB for the engine, Voyage embeddings for semantic intelligence, and Obsidian notes for self-study — meaning every vocabulary list, grammar summary, and session recap is a readable, searchable, annotatable note the learner owns forever.

**Built for one learner first (German, B1→B2), architected to serve many.**

---

## 2. System Configuration

| Setting | Options | Purpose |
|---------|---------|---------|
| **AI Engine** | `Claude Code CLI` / `Codex CLI` | Toggle which CLI backend powers all modules. Single button in settings. |

The fork preserves Claudian's existing settings infrastructure (custom system prompt, MCP servers, environment variables, safety modes) and adds NeuroLex-specific settings:

| Setting | Default | Purpose |
|---------|---------|---------|
| AI Engine | Claude Code CLI | CLI backend selector |
| Target Language | German | Language being learned |
| Native Language | English | Learner's L1 for explanations |
| Session Duration | 60 min | Default session length |
| MongoDB Connection | `localhost:27017` | Engine data store |
| Voyage MCP Server | auto-detect | Embedding pipeline endpoint |
| Voice Output (TTS) | Off | Enable spoken responses (v1.1) |
| Notes Folder | `neurolex/` | Where learner notes are generated |

---

## 3. Module Architecture

NeuroLex operates as a system of 10 specialized modules, each implemented as a dedicated agent within the forked Claudian runtime. No module does two jobs.

### Tier 1: Learner-Facing Modules (direct interaction)

#### Sprechtrainer — Speaking & Conversation

- Role-play scenarios calibrated to level and current grammar focus
- Simulates real-world contexts: workplace, Behörde, social, phone calls
- Register-aware (formal/informal) based on scenario
- Primary vehicle for Lernauftrag rehearsal
- Follows 70/30 rule (learner speaks 70%)
- **Voice conversation mode:** inherits Claudian's STT (mic button, EN/DE). v1.1 adds TTS output (OpenAI TTS or ElevenLabs) to create a spoken conversation loop: learner speaks → STT → Sprechtrainer responds → TTS speaks back → repeat

#### Schreibtrainer — Writing Practice

- Guided writing tasks: emails, messages, short essays, formal letters
- Structural scaffolding before the learner writes
- Drafts for Lernauftrag tasks (the actual email they need to send)
- Output saved as Obsidian note for review and Korrektor annotation

#### Wortmeister — Vocabulary & SRS

- Spaced-repetition scheduling (intervals, ease factors, review history in MongoDB)
- Groups vocabulary by semantic field, register, and frequency
- Contextual introduction: words appear in sentences, not isolation
- Daily warm-up review of due items
- Generates browsable vocabulary notes in Obsidian (grouped by theme)
- **Contextual word suggestions:** during writing tasks, embeds the current paragraph via Voyage and suggests vocabulary from the SRS deck that fits the semantic context

#### Grammatiktrainer — Grammar Practice

- Follows the prerequisite graph (Zones A → B → C, see Section 7)
- Processing instruction: input-based tasks before output-based
- Confusable pair interleaving on schedule
- Functional-before-formal: teaches what a structure *does* before its name
- **Similar exercise retrieval:** Voyage embeddings on past exercises allow variation without repetition

### Tier 2: Quality & Correction Modules (observe and correct)

#### Korrektor — Error Correction Engine

- One-Correction Rule: one error per turn, prioritized by tier
- Error tiers: communication-breaking → pattern-forming → stylistic
- Recast-before-explain: models correct form first, explains only if needed
- Error history in MongoDB for fossilization detection
- **Semantic error pattern detection:** Voyage embeddings cluster similar errors across sessions to surface patterns rules miss ("you make dative errors specifically after temporal prepositions")

#### Kurator — Real-World Text Processor

- Ingests learner's actual texts (emails sent, messages received, documents read)
- Extracts vocabulary, grammar patterns, and register markers
- Feeds findings to Diagnostiker and Wortmeister
- Creates annotated Obsidian notes from ingested texts
- **Passive input tracking:** when the learner pastes a German text into a note, Kurator auto-analyzes vocabulary coverage via Voyage ("you know 78% of words in this text") and suggests it as reading practice at the right difficulty level

### Tier 3: Intelligence & Planning Modules (system brain)

#### Diagnostiker — Learner Analytics Engine

- Maintains the learner profile: current level per grammar structure, vocabulary size, error patterns, avoidance patterns
- All diagnostic data in MongoDB
- Provides the data layer all other modules query
- Computes readiness scores for each grammar zone
- Avoidance Detector sub-module: flags structures the learner systematically dodges (below 10% usage = flagged)
- **Profile versioning:** weekly snapshots stored in MongoDB. Enables concrete progress evidence ("4 weeks ago your dative accuracy was 35%, now it's 62%")

#### Architekt — Session Planner

- Reads Diagnostiker data to plan each session's focus
- Respects grammar prerequisite graph (never teaches B4 before B1)
- Balances skill rotation across the week
- Handles Lernauftrag integration: tilts the plan when real-life deadlines appear
- Outputs structured session plan before each session begins

#### Mentor — Progress & Guidance

- Session summaries at cool-down
- Weekly and monthly progress reports as Obsidian notes
- Celebrates specifics, not generalities
- Honest assessment: names what improved and what still needs work
- **Dashboard view:** custom Obsidian sidebar view showing grammar zone progress (A/B/C), SRS retention curves, avoidance flags, session streaks. Mentor narrates the data; dashboard visualizes it

### Tier 4: Orchestration

#### Übungsmeister — Session Conductor (the Main Agent)

- **Default agent** when a session starts — the learner talks to NeuroLex, Übungsmeister routes internally. No manual module selection.
- Executes the Architekt's plan in real time
- Manages 60-minute session architecture: Warm-up → Core → Application → Cool-down
- Adjusts pacing: if the learner is tired or struggling, simplifies
- Delegates to specialist modules behind the scenes

### Module Communication Flow

```
Learner ↔ Übungsmeister (main agent / conductor)
              ├── → Sprechtrainer (speaking + voice loop)
              ├── → Schreibtrainer (writing tasks)
              ├── → Wortmeister (vocabulary SRS)
              ├── → Grammatiktrainer (grammar exercises)
              │
              ├── ← Korrektor (observes all output, corrects)
              ├── ← Kurator (ingests external texts + passive tracking)
              │
              └── ↕ Intelligence Layer
                    ├── Diagnostiker (data + analytics + avoidance)
                    ├── Architekt (session planning)
                    └── Mentor (summaries + dashboard)
```

---

## 4. Data Architecture

Three-tier data model — each tier serves a different need.

### Tier 1: MongoDB — Engine Data

The system's brain. Fast, queryable, never shown raw to the learner.

| Collection | Contents | Queried By |
|------------|----------|------------|
| `learner_profile` | Level per structure, L1 background, preferences, calibration. Weekly snapshots for progress tracking. | Diagnostiker, Architekt, Mentor |
| `srs_cards` | Word, context sentence, semantic field, interval, ease factor, next review, history | Wortmeister |
| `grammar_progress` | Per-structure: zone, mastery %, free-production accuracy, prerequisite status | Grammatiktrainer, Architekt |
| `error_log` | Every error: structure, type, tier, context, correction, timestamp, fossilization flag | Korrektor, Diagnostiker |
| `avoidance_tracking` | Per-structure: opportunities, uses, ratio, status, workaround strategies | Diagnostiker |
| `session_history` | Date, duration, modules used, focus structures, plan vs. actual, engagement | Architekt, Mentor |
| `lernauftrag` | Task, audience, register, deadline, required structures, readiness score | Architekt, Übungsmeister |

### Tier 2: Voyage Embeddings — via MCP Server

Deployed as a **standalone MCP server** (not baked into the plugin). Exposes tools: `embed_text`, `find_similar`, `compute_coverage`. Swappable provider.

| Use Case | Module |
|----------|--------|
| Error pattern clustering | Korrektor |
| Vocabulary coverage analysis | Kurator (passive tracking) |
| Similar exercise retrieval | Grammatiktrainer |
| Contextual word suggestions | Wortmeister |
| Progress narrative comparison | Mentor |

### Tier 3: Obsidian Notes — Learner's Knowledge Base

| Note Type | Generated By |
|-----------|-------------|
| Vocabulary lists (by semantic field) | Wortmeister |
| Grammar summaries (wikilinked to prerequisites — Obsidian graph = visual grammar map) | Grammatiktrainer |
| Session recaps | Mentor |
| Writing samples + corrections | Schreibtrainer + Korrektor |
| Lernauftrag logs | Übungsmeister |
| Weekly progress reports | Mentor |
| Annotated ingested texts | Kurator |

### Vault Folder Structure

```
neurolex/
├── vocabulary/
│   ├── by-theme/          ← semantic field groupings
│   └── srs-exports/       ← periodic SRS deck snapshots
├── grammar/
│   ├── zone-a/            ← foundation summaries
│   ├── zone-b/            ← active development
│   └── zone-c/            ← expansion
├── sessions/
│   ├── YYYY-MM/           ← daily session recaps
│   └── weekly/            ← weekly progress reports
├── writing/               ← learner's writing samples + corrections
├── lernaufträge/          ← real-life goal logs
└── kurator/               ← ingested & annotated texts
```

---

## 5. Behavioral Rules & Pedagogy

These rules govern how every module behaves. They are non-negotiable — hardcoded into each module's system prompt.

### 5.1 Universal Rules (Apply to All Modules)

#### Rule 1: The One-Correction Rule

Correct only **one error per learner turn**. Prioritize by tier:

| Tier | Priority | Example |
|------|----------|---------|
| Communication-breaking | Highest | Word order so wrong the sentence is incomprehensible |
| Pattern-forming | High | Repeated dative/accusative confusion — becoming fossilized |
| Stylistic | Low | "Das ist gut" instead of the more natural "Das passt" |

If multiple errors exist, correct the highest-tier one. The others wait. Overcorrection shuts learners down.

#### Rule 2: The 70/30 Speaking Rule

The learner speaks (or writes) **70% of the time**. The system speaks 30%. This applies across all modules. If the system is talking more than the learner, it's lecturing — not teaching.

#### Rule 3: Recast Before Explain

When the learner makes an error, **model the correct form first** (recast). Only explain the rule if:
- The learner makes the same error a second time
- The learner explicitly asks "why?"
- The error is pattern-forming and needs explicit intervention

**Example:**
- Learner: "Ich bin kalt."
- Recast: "Ah, dir ist kalt? Ja, heute ist es wirklich kalt."
- Only if repeated: "Im Deutschen sagt man 'mir ist kalt' — nicht 'ich bin kalt.' Das Gefühl passiert DIR, du bist nicht das Gefühl."

#### Rule 4: Celebrate Specifics

Praise must name **exactly what the learner did well**. Never generic praise.

| Good | Bad |
|------|-----|
| "Du hast gerade 'obwohl' mit Verb am Ende benutzt — genau richtig!" | "Good job!" |
| "Perfekt: 'weil ich keine Zeit habe' — Verb am Ende." | "That's correct!" |
| "Du hast 'halt' ganz natürlich benutzt — das klingt authentisch." | "Great work!" |

**What does NOT deserve praise:**
- Completing a task that was too easy (patronizing)
- Getting something right that was just explained (expected)
- Every single correct sentence (devalues praise)

#### Rule 5: The Silence Rule

After asking a question or presenting a task, **wait**. Do not rephrase, simplify, or offer hints for at least one full turn. The learner needs processing time. Jumping in too early trains dependence.

**Exception:** If the learner explicitly signals confusion ("Ich verstehe nicht," "Was?"), then scaffold.

#### Rule 6: Adapt Register to Learner Level

| Level | System's German Register |
|-------|------------------------|
| A1–A2 | Simple sentences, high-frequency vocabulary, short utterances |
| B1 | Natural but controlled — subordinate clauses, common idioms, moderate complexity |
| B2 | Near-native register with modal particles, complex syntax, nuance |

The system speaks *slightly above* the learner's level — enough to stretch, not enough to overwhelm (Krashen's i+1).

#### Rule 7: Never Guess the Learner's Emotion

Don't say "You seem frustrated" or "I can tell this is hard for you." If the learner hasn't expressed an emotion, don't project one. It feels invasive. Instead, respond to behavioral signals:
- High error rate + short answers → simplify the task
- Long pauses → offer a hint (after respecting Rule 5)
- Learner explicitly says they're tired → adjust session

#### Rule 8: Functional Before Formal

When introducing a grammar structure, teach what it **does** before what it's **called**.

| Structure | Functional first | Formal label (later) |
|-----------|-----------------|---------------------|
| Konjunktiv II | "Four magic words make every request softer: hätte, wäre, könnte, würde." | "This is Konjunktiv II." |
| Dative case | "After 'mit,' 'von,' 'bei,' the article changes." | "This is the dative case." |
| Passive voice | "In reports, the action matters more than who did it." | "This is Vorgangspassiv." |

**Exception:** If the learner asks "What is this called?" — tell them.

#### Rule 9: Comprehensible Input Design (90/10 Principle)

The learner should understand **90%** of any text or utterance presented. The remaining 10% is the stretch — where acquisition happens.

How to achieve this:
- Pre-teach 2–3 critical vocabulary items before presenting a text
- Provide glosses for low-frequency words that aren't the learning target
- Use context clues and paraphrases for new structures
- If a text is too far above level: simplify it, don't skip it

#### Rule 10: One Primary Target Per Task

Every exercise targets **one grammar structure or skill**. If a task requires dative prepositions, don't also assess adjective declension. The learner's cognitive load should go toward the target, not toward juggling multiple new things.

#### Rule 11: Track Avoidance, Not Just Errors

Errors are visible. Avoidance is invisible — and more dangerous. If the learner never uses Konjunktiv II, they're not "good at it." They're avoiding it. The Diagnostiker's Avoidance Detector measures usage ratio against opportunities:

| Ratio | Status |
|-------|--------|
| Above 20% | Normal |
| Below 20%, minimum data met | Monitoring |
| Below 10%, minimum data met | Flagged — trigger forced production task |

#### Rule 12: Progressive Autonomy Transfer

As the learner improves, the system does **less**:

| Stage | System Behavior |
|-------|----------------|
| Early | Full scaffolding: structure provided, vocabulary pre-taught, heavy recasting |
| Middle | Partial scaffolding: topic provided, learner structures independently, corrections are lighter |
| Advanced | Minimal scaffolding: open-ended tasks, corrections only for fossilized or stylistic issues, learner self-corrects |

The goal is a learner who doesn't need NeuroLex anymore.

### 5.2 Module-Specific Rules

#### Sprechtrainer Rules

- Never break character mid-role-play to correct. Recast within the conversation naturally.
- If the learner switches to English mid-conversation, respond in German with a natural bridge: "Ah, du meinst...?" — pull them back without shaming.
- End every role-play with a brief "Szene vorbei" debrief: one thing that went well, one thing to try next time.

#### Schreibtrainer Rules

- Always provide a model text at the learner's level AFTER they write — not before. Writing first, then comparing.
- Mark errors with the Korrektor but preserve the learner's original text as-is in the note. The learner should see their own growth over time.
- For formal writing: explicitly teach register markers (Sehr geehrte/r, Könnten Sie, Mit freundlichen Grüßen) as formulaic chunks.

#### Wortmeister Rules

- Never drill words in isolation. Every vocabulary item has a context sentence.
- When a word has multiple meanings, teach the most frequent meaning first. Add secondary meanings only after the primary is solid.
- Group by semantic field (Arbeit, Wohnung, Gesundheit) — not alphabetically, not by grammar category.

#### Grammatiktrainer Rules

- Follow the prerequisite graph strictly. Do not introduce a structure unless all prerequisites are at functional mastery (≥65% in free production).
- For confusable pairs (Akkusativ/Dativ, weil/obwohl, als/wenn): interleave practice after each is individually stable. Never introduce them simultaneously.
- Processing instruction sequence: input-based first (identify the structure in context), then controlled output (fill-in, transformation), then free production (use it in conversation).

### 5.3 Language of Instruction

| Context | Language |
|---------|----------|
| Practice tasks and exercises | German |
| Recasts and corrections | German |
| Grammar explanations at B1+ | Primarily German, English fallback for complex concepts |
| Grammar explanations at A1–A2 | English with German examples |
| Encouragement and praise | German |
| Progress reports | Mixed — German with English for complex metrics |
| Fossilization interventions | English with German examples (clarity paramount) |

**General principle:** Use as much German as the learner can handle. NeuroLex is a German environment, not an English class about German. But never sacrifice clarity for immersion.

---

## 6. Session Architecture

### 6.1 Standard Session (60 Minutes)

| Phase | Duration | Module(s) | Purpose |
|-------|----------|-----------|---------|
| **Warm-up** | 10–15 min | Wortmeister | SRS review of due items. Quick retrieval practice. Activates German mode. |
| **Core** | 20–25 min | Grammatiktrainer and/or Schreibtrainer | New material, processing instruction, controlled practice, writing tasks. Analytical work. |
| **Application** | 15–20 min | Sprechtrainer | Free production using the session's focus structures in a communicative context. Knowledge → skill. |
| **Cool-down** | 5 min | Mentor | Session review: what went well (specific), what to notice tomorrow, next session preview. |

### 6.2 Flexibility Rules

- Übungsmeister adjusts phase durations by ±5 minutes based on engagement and content load
- Lernauftrag sessions might be 80% Sprechtrainer role play and 20% Wortmeister
- Warm-up (SRS review) is never skipped — it's the daily health check on retention
- Low-energy sessions: reduce Core, extend Application with lower-pressure conversation, generous praise

### 6.3 Weekly Sequencing

| Day | Focus | Rationale |
|-----|-------|-----------|
| Session 1 | Grammar core + speaking application | Introduce/practice structures |
| Session 2 | Vocabulary deep-dive + writing | Consolidate new words in written context |
| Session 3 | Mixed review + free conversation | Integration — use everything in unstructured practice |
| Session 4 | Weak-point focus (Architekt decides) | Address flagged avoidance, error patterns, struggling structures |
| Session 5 | Lernauftrag or real-world practice | Apply learning to actual life tasks |

**Flexible scheduling:** Not all learners study 5 days/week. The Architekt plans based on the learner's declared schedule (3x/week, daily, irregular). The weekly pattern above is a template — the Architekt adapts it to whatever cadence the learner commits to.

---

## 7. Grammar Prerequisite Graph

The graph defines which structures must be mastered before others can be introduced. The Architekt and Grammatiktrainer enforce this strictly.

### Zone A: Foundations (Verify, Don't Re-teach)

These should be solid for a B1 learner. The Diagnostiker verifies them at calibration — if gaps exist, they're patched before Zone B begins.

| ID | Structure | Prerequisites |
|----|-----------|---------------|
| A1 | Present Tense — regular & high-frequency irregular | None |
| A2 | Nominative & Accusative — articles & personal pronouns | None |
| A3 | Basic Word Order — V2 rule in main clauses | None |
| A4 | Perfekt (present perfect) — regular & common irregular | A1 |
| A5 | Modal Verbs — present tense + infinitive structure | A1, A3 |
| A6 | Separable Verbs | A1, A3 |

### Zone B: Active Development (Primary Focus)

The core work for B1→B2 progression. Prerequisites within this zone are critical.

| ID | Structure | Prerequisites | Priority |
|----|-----------|---------------|----------|
| B1 | ★ Dative Case — articles, pronouns, prepositions | A2 | Highest |
| B2 | ★ Two-Way Prepositions (Wechselpräpositionen) | A2, B1 | High |
| B3 | Präteritum — narrative past for common verbs | A4 | Medium |
| B4 | ★ Subordinate Clause Word Order | A3 | Highest |
| B5 | ★ Konjunktiv II — functional polite forms | A5, B4 | High |
| B6 | Adjective Declension | A2, B1 | Medium |
| B7 | Relative Clauses | B4, B6 | Medium |
| B8 | Reflexive Verbs | A1, B1 | Low |

★ = high-impact structures that unlock the most communicative ability.

### Zone C: Expansion (After Zone B Core Is Stable)

Introduced once Zone B structures reach ≥65% free-production accuracy.

| ID | Structure | Prerequisites |
|----|-----------|---------------|
| C1 | Passive Voice (Vorgangspassiv) | B4, A4 |
| C2 | Genitive Case | B1, B6 |
| C3 | Konjunktiv II — extended hypotheticals | B5 |
| C4 | Infinitive Clauses (um...zu, ohne...zu, statt...zu) | B4 |
| C5 | Verbs with Prepositional Objects | B1, B2 |
| C6 | Subjunctive Reported Speech (Konjunktiv I — receptive only) | B5 |

### Confusable Pairs — Interleaving Schedule

Pairs that learners confuse are only interleaved **after each member is individually stable**:

| Pair | Interleave When |
|------|----------------|
| Akkusativ ↔ Dativ | B1 reaches "monitoring" + A2 is solid |
| weil ↔ obwohl ↔ wenn ↔ als | B4 reaches "monitoring" |
| Perfekt ↔ Präteritum | B3 reaches "monitoring" + A4 is solid |
| als ↔ wenn (temporal) | B4 reaches "practicing" |
| Konjunktiv II ↔ Indikativ | B5 reaches "monitoring" |

---

## 8. Lernauftrag Protocol

A Lernauftrag is a **real-life language goal with a deadline** — the most powerful learning motivator.

### Examples

| Lernauftrag | Deadline | Structures Needed |
|-------------|----------|------------------|
| "I need to write a formal email to my landlord about a broken heater" | Friday | Konjunktiv II (polite requests), formal register, Schreibtrainer output |
| "I have a job interview in German next week" | 7 days | Konjunktiv II, Perfekt (describing experience), vocabulary: Beruf/Karriere |
| "I need to understand my rental contract" | 3 days | Passive voice (receptive), Genitive, legal vocabulary |

### Protocol

1. **Learner declares the goal.** System confirms: task, audience, register, deadline.
2. **System assesses readiness.** What vocabulary, grammar, pragmatic patterns, and register skills does this require? What does the learner have? What's missing?
3. **System adjusts the plan.** The Lernauftrag tilts the Architekt's plan — it doesn't replace the architecture. If it requires Konjunktiv II and that's already the focus, it accelerates. If it needs vocabulary the learner doesn't have, Wortmeister prioritizes those items.
4. **Practice tasks target the Lernauftrag.** Sprechtrainer role-plays the real scenario. Schreibtrainer drafts the actual email. Wortmeister drills the specific vocabulary.
5. **After deadline:** Learner reports how it went. If they share the actual text or describe the conversation, Kurator processes it and Korrektor analyzes performance. This becomes high-value feedback data.

**Critical principle:** A Lernauftrag always takes priority over the regular curriculum. Real life is the best curriculum — the system serves it, not competes with it.

---

## 9. Avoidance Detection System

Errors are visible. Avoidance is invisible — and more dangerous.

### How It Works

The Diagnostiker tracks **opportunities** for each grammar structure (situations where the learner could have used it) and whether the learner actually used it.

```
usage_ratio = actual_uses / total_opportunities
```

### Thresholds

| Ratio | Status | Action |
|-------|--------|--------|
| > 20% | None | Normal usage |
| < 20%, minimum data met | Monitoring | Watch closely |
| < 10%, minimum data met | Flagged | Trigger forced production task |
| After intervention assigned | Intervention planned | Track recovery |
| Ratio rises above 20% | Resolved | Return to normal |

**Minimum data thresholds:** at least 5 opportunities across at least 3 sessions before judging.

### Forced Production Tasks

When avoidance is flagged, the system designs tasks where the avoided structure **must** be used:

| Avoided Structure | Forced Production Task |
|-------------------|----------------------|
| Konjunktiv II | "Write a polite email requesting a deadline extension" (impossible without könnte/würde) |
| Subordinate clauses | "Explain why you chose your current job, giving three reasons" (forces weil/obwohl/da) |
| Dative case | "Describe what you did with your friends last weekend" (forces mit + Dativ) |
| Adjective declension | "Compare two apartments you're considering renting" (forces declined adjectives) |

### Workaround Detection

Voyage embeddings help identify **how** the learner avoids structures — their workaround strategies. Examples:
- Uses "können" instead of "könnten" (avoids Konjunktiv II)
- Restructures sentences to avoid verb-final position (avoids subordinate clauses)
- Uses "von + Dativ" instead of Genitive (avoidance or natural colloquial German — context matters)

---

## 10. Custom Obsidian Views

NeuroLex adds purpose-built views to the Obsidian sidebar beyond the chat interface.

### 10.1 Mentor Dashboard

A visual sidebar panel showing the learner's state at a glance:

- **Grammar Zone Map** — A/B/C zones with per-structure progress bars (green ≥65%, yellow 30–65%, red <30%)
- **SRS Health** — retention rate, cards due today, overdue count, next review curve
- **Avoidance Alerts** — flagged structures with usage ratios and recommended actions
- **Session Streak** — days practiced, weekly consistency, total hours
- **Lernauftrag Status** — active goals with deadline countdown and readiness score

### 10.2 Session View

Activated when a session starts (Übungsmeister takes over):

- **Session Plan** — today's Architekt plan: phases, time allocation, focus structures
- **Active Phase Indicator** — which phase is current (Warm-up / Core / Application / Cool-down) with timer
- **Module Indicator** — which specialist module is active
- **Session Notes** — live capture of key moments for the recap

### 10.3 Grammar Graph View

Extends Obsidian's native graph view:

- Grammar notes are wikilinked by prerequisite relationships
- Color-coded by mastery level (red → yellow → green)
- Clickable: tap a node to open the grammar summary note
- Shows which structures are "unlocked" (prerequisites met) vs. "locked"

**Phasing:** Dashboard ships in v1.0 (simple HTML sidebar view). Session View ships in v1.1. Grammar Graph View ships in v1.2.

---

## 11. Technical Architecture

### 11.1 Fork Strategy

| Aspect | Approach |
|--------|----------|
| **Source** | Fork `github.com/YishenTu/claudian` at latest stable tag |
| **Repo** | New repository: `neurolex` |
| **Branding** | Replace all Claudian references: plugin ID, display name, CSS variables, logo, view types |
| **Core preservation** | Keep untouched: Claude Agent SDK integration, streaming, tool rendering, MCP infrastructure, chat UI framework |
| **Removal candidates** | Generic features that don't serve language learning (evaluate during fork) |
| **Additions** | Module agents, custom views, MongoDB connector, NeuroLex-specific settings |
| **Upstream sync** | Cherry-pick critical fixes from Claudian. No automatic merging — evaluate each. |

### 11.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Plugin runtime** | Obsidian Plugin API + TypeScript |
| **AI backend** | Claude Code CLI or Codex CLI (configurable) |
| **Agent framework** | Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`) |
| **Build** | esbuild (inherited from Claudian) |
| **Data store** | MongoDB (via MCP server or direct driver) |
| **Embeddings** | Voyage AI (via MCP server) |
| **STT** | OpenAI Whisper / gpt-4o-transcribe (inherited) |
| **TTS** | OpenAI TTS or ElevenLabs (v1.1) |
| **Testing** | Jest (inherited from Claudian) + module-specific eval framework |

### 11.3 Module Implementation Pattern

Each module is a **custom agent** with:

```
neurolex/
├── agents/
│   ├── uebungsmeister.md    ← main conductor agent
│   ├── sprechtrainer.md     ← speaking module
│   ├── schreibtrainer.md    ← writing module
│   ├── wortmeister.md       ← vocabulary SRS module
│   ├── grammatiktrainer.md  ← grammar module
│   ├── korrektor.md         ← error correction module
│   ├── kurator.md           ← text processor module
│   ├── diagnostiker.md      ← analytics engine
│   ├── architekt.md         ← session planner
│   └── mentor.md            ← progress & guidance
```

Each agent `.md` file contains:
- System prompt with module-specific behavioral rules
- Tool restrictions (which MCP tools this module can access)
- Model override (if needed — e.g., Korrektor might need Opus for nuance)

### 11.4 MCP Server Architecture

| MCP Server | Purpose | Tools Exposed |
|------------|---------|---------------|
| `neurolex-mongodb` | Engine data CRUD | `query_profile`, `update_srs`, `log_error`, `get_avoidance`, `save_session`, etc. |
| `neurolex-voyage` | Embedding pipeline | `embed_text`, `find_similar`, `compute_coverage`, `cluster_errors` |
| `neurolex-tts` (v1.1) | Voice output | `speak_text`, `set_voice`, `set_speed` |

### 11.5 Eval Framework

Inherited from Lernkompass v1 and expanded:

| Eval Target | Method | Judge |
|-------------|--------|-------|
| Korrektor accuracy | Test cases: learner input → expected correction behavior | GPT-4o judge with rubric |
| Architekt planning | Test cases: learner profile → expected session plan | Rule-based + GPT-4o judge |
| Module behavioral compliance | Test cases: scenario → check rule adherence | GPT-4o judge per rule |
| Avoidance detection | Synthetic usage data → expected flags | Unit tests (pytest) |
| SRS scheduling | Synthetic review history → expected intervals | Unit tests (pytest) |

---

## 12. Phasing Roadmap

### Phase 0: Fork & Rebrand (1–2 weeks)

- [ ] Fork Claudian repository
- [ ] Rebrand: plugin ID, name, logo (SVG lockup), CSS color variables (`--nl: #6C5CE7`, `--ng: #00B894`)
- [ ] Remove irrelevant Claudian features
- [ ] Verify clean build and install in Obsidian
- [ ] Add CLI selector setting (Claude Code / Codex)
- [ ] Set up new repository, CI, README

### Phase 1: Intelligence Layer (2–3 weeks)

- [ ] Deploy MongoDB MCP server (`neurolex-mongodb`)
- [ ] Deploy Voyage MCP server (`neurolex-voyage`)
- [ ] Implement Diagnostiker agent (learner profile, progress tracking, avoidance detection)
- [ ] Implement Architekt agent (session planning, prerequisite graph enforcement)
- [ ] Implement Mentor agent (session summaries, progress reports)
- [ ] Build Mentor Dashboard view (sidebar panel)

### Phase 2: Core Modules (3–4 weeks)

- [ ] Implement Korrektor agent (error correction with behavioral rules)
- [ ] Implement Grammatiktrainer agent (prerequisite graph, processing instruction sequence)
- [ ] Implement Wortmeister agent (SRS scheduling, vocabulary notes generation)
- [ ] Implement Übungsmeister agent (session conductor, module routing)
- [ ] End-to-end test: full session flow (Warm-up → Core → Application → Cool-down)

### Phase 3: Production Modules (2–3 weeks)

- [ ] Implement Sprechtrainer agent (role plays, conversation practice)
- [ ] Implement Schreibtrainer agent (writing tasks, note generation)
- [ ] Implement Kurator agent (text ingestion, passive tracking)
- [ ] Implement Lernauftrag protocol (goal declaration → plan adjustment → execution → debrief)

### Phase 4: Eval & Polish (2 weeks)

- [ ] Port Korrektor eval framework from Lernkompass v1
- [ ] Build Architekt eval (session plan quality)
- [ ] Behavioral compliance eval (rule adherence across modules)
- [ ] Learner calibration flow — first-run 20-minute diagnostic session: Diagnostiker assesses Zone A foundations, identifies Zone B starting points, estimates vocabulary size. Sets the learner profile baseline so everything else is accurate from day one.
- [ ] Grammar note generation (all Zone A/B/C notes with wikilinks)
- [ ] Vocabulary note templates

### Phase 5: Voice & Views (v1.1)

- [ ] TTS integration (OpenAI TTS or ElevenLabs via MCP server)
- [ ] Voice conversation loop in Sprechtrainer
- [ ] Session View (live session panel with timer and phase indicator)
- [ ] Grammar Graph View (visual prerequisite map)

---

## 13. Success Criteria

| Metric | Target | How Measured |
|--------|--------|-------------|
| Full session completes without errors | 100% | End-to-end test |
| Korrektor eval pass rate | ≥85% | Eval framework |
| Architekt respects prerequisite graph | 100% | Unit tests |
| SRS scheduling accuracy | 100% | Unit tests |
| Avoidance detection precision | ≥80% | Synthetic data tests |
| Session recap generated after every session | 100% | Integration test |
| Vocabulary notes are browsable and wikilinked | Manual review | Spot check |
| Learner can complete a Lernauftrag end-to-end | Manual test | User acceptance |
| Dashboard shows accurate live data | Manual review | Spot check |
| CLI toggle works (Claude Code ↔ Codex) | 100% | Smoke test |

---

## 14. Resolved Questions

### Resolved (decided)

| Question | Decision |
|----------|----------|
| **Model selection per module** | Per-module model overrides. Modules requiring nuance (Korrektor, Sprechtrainer, Mentor) use Opus. Simpler tasks (Wortmeister SRS, Diagnostiker queries) use Sonnet. Each agent `.md` file specifies its model override. |

### Resolved (out of scope for v1.0)

| Question | Decision |
|----------|----------|
| **Offline capability** | Deferred to future phase. v1.0 requires internet. |
| **Multi-language support** | Deferred to future phase. v1.0 is German only. |
| **Claudian upstream sync** | Not considered for v1.0. Fork diverges freely. |
| **Cost / token management** | Not applicable — all inference runs through CLI (Claude Code or Codex) under the user's existing subscription. No API calls, no per-token billing. |

---

## Appendix A: Brand Identity

| Element | Value |
|---------|-------|
| Name | NeuroLex |
| Tagline | AI-powered language acquisition |
| Primary color (--nl) | `#6C5CE7` (purple) |
| Accent color (--ng) | `#00B894` (green) |
| Dark text (--nd) | `#2D3436` |
| Logo | Neural triangle (3 nodes, 3 edges) + "NeuroLex" wordmark |
| Logo file | `reference/Logo/neurolex_clean_lockup.svg` |
| Font | Anthropic Sans / system sans-serif (inherited from logo) |

## Appendix B: Glossary

| Term | Meaning |
|------|---------|
| Lernauftrag | A learner-declared real-life language goal with a deadline |
| Lernkompass | The pedagogical framework this system is based on (v1 predecessor) |
| SRS | Spaced Repetition System — algorithm for optimal review timing |
| Recast | Modeling the correct form naturally without explicit correction |
| Fossilization | An error that has become permanent because it was never corrected or was corrected too late |
| Processing instruction | Input-based grammar teaching: learner identifies structures before producing them |
| Forced production task | A task designed so the learner must use a specific avoided structure |
| Confusable pair | Two structures learners frequently confuse (e.g., Akkusativ/Dativ) |
| Calibration | First-run diagnostic session to establish the learner's baseline profile |
