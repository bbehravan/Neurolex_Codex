import { getNextPriorityStructures } from '../domain/grammarGraph';
import type { LearnerProfile, SessionPhase, SessionPlan } from '../domain/types';

function buildDefaultPhases(sessionMinutes: number, activeLernauftrag?: string): SessionPhase[] {
  const applicationObjective = activeLernauftrag
    ? `Apply today's work to the active Lernauftrag: ${activeLernauftrag}`
    : 'Use the focus structures in a communicative speaking or writing task.';

  const scale = sessionMinutes / 60;
  const warmupMinutes = Math.max(5, Math.round(10 * scale));
  const coreMinutes = Math.max(15, Math.round(25 * scale));
  const applicationMinutes = Math.max(10, Math.round(20 * scale));
  const cooldownMinutes = Math.max(5, sessionMinutes - warmupMinutes - coreMinutes - applicationMinutes);

  return [
    {
      key: 'warmup',
      title: 'Warm-up',
      durationMinutes: warmupMinutes,
      module: 'Wortmeister',
      objective: 'Review due vocabulary and activate German mode.',
    },
    {
      key: 'core',
      title: 'Core',
      durationMinutes: coreMinutes,
      module: 'Grammatiktrainer',
      objective: 'Practice one primary target structure with controlled progression.',
    },
    {
      key: 'application',
      title: 'Application',
      durationMinutes: applicationMinutes,
      module: activeLernauftrag ? 'Schreibtrainer' : 'Sprechtrainer',
      objective: applicationObjective,
    },
    {
      key: 'cooldown',
      title: 'Cool-down',
      durationMinutes: cooldownMinutes,
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
    phases: buildDefaultPhases(profile.preferredSessionMinutes, profile.activeLernauftrag),
  };
}
