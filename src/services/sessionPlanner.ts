import { getNextPriorityStructures } from '../domain/grammarGraph';
import type { LearnerProfile, SessionPhase, SessionPlan } from '../domain/types';

function buildDefaultPhases(activeLernauftrag?: string): SessionPhase[] {
  const applicationObjective = activeLernauftrag
    ? `Apply today's work to the active Lernauftrag: ${activeLernauftrag}`
    : 'Use the focus structures in a communicative speaking or writing task.';

  return [
    {
      key: 'warmup',
      title: 'Warm-up',
      durationMinutes: 10,
      module: 'Wortmeister',
      objective: 'Review due vocabulary and activate German mode.',
    },
    {
      key: 'core',
      title: 'Core',
      durationMinutes: 25,
      module: 'Grammatiktrainer',
      objective: 'Practice one primary target structure with controlled progression.',
    },
    {
      key: 'application',
      title: 'Application',
      durationMinutes: 20,
      module: activeLernauftrag ? 'Schreibtrainer' : 'Sprechtrainer',
      objective: applicationObjective,
    },
    {
      key: 'cooldown',
      title: 'Cool-down',
      durationMinutes: 5,
      module: 'Mentor',
      objective: 'Summarize progress, note one win, and preview the next session.',
    },
  ];
}

export function buildSessionPlan(profile: LearnerProfile): SessionPlan {
  const masteryById = Object.fromEntries(
    Object.entries(profile.grammarProgress).map(([structureId, progress]) => [
      structureId,
      progress.masteryPercent,
    ])
  );

  const focusStructures = getNextPriorityStructures(masteryById)
    .slice(0, 2)
    .map(structure => structure.id);

  return {
    learnerId: profile.learnerId,
    generatedAt: new Date().toISOString(),
    aiEngine: profile.aiEngine,
    targetLanguage: profile.targetLanguage,
    focusStructures,
    notesFolder: 'neurolex/',
    phases: buildDefaultPhases(profile.activeLernauftrag),
  };
}
