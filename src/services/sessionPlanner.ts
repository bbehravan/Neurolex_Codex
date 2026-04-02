import { getGrammarStructure, getNextPriorityStructures } from '../domain/grammarGraph';
import type { LearnerProfile, SessionFocusSelection, SessionPhase, SessionPlan } from '../domain/types';

export interface SessionPlanOptions {
  generatedAt?: string;
  notesFolder?: string;
}

function inferApplicationMode(profile: LearnerProfile): 'writing' | 'speaking' {
  const activeTaskText = normalizeText(profile.activeLernauftrag);
  const upcomingTaskText = normalizeText(
    (profile.upcomingTasks ?? [])
      .map((task) => [task.title, task.notes].filter(Boolean).join(' '))
      .join(' ')
  );
  const combined = `${activeTaskText} ${upcomingTaskText}`.trim();

  if (/write|email|message|application|letter|text|summary|report/.test(combined)) {
    return 'writing';
  }

  return 'speaking';
}

function buildCurationBrief(profile: LearnerProfile, applicationMode: 'writing' | 'speaking'): string {
  const activeTask = profile.activeLernauftrag?.trim();
  const upcomingTask = profile.upcomingTasks?.[0];

  if (activeTask) {
    const register = /formal|interview|landlord|application/.test(activeTask.toLowerCase()) ? 'formal' : 'everyday';
    return `${applicationMode === 'writing' ? 'Writing' : 'Speaking'} task in ${register} register: ${activeTask}`;
  }

  if (upcomingTask) {
    const register = /formal|interview|application/.test(`${upcomingTask.title} ${upcomingTask.notes ?? ''}`.toLowerCase())
      ? 'formal'
      : 'everyday';
    return `${applicationMode === 'writing' ? 'Writing' : 'Speaking'} task for upcoming event "${upcomingTask.title}" in ${register} register.`;
  }

  return applicationMode === 'writing'
    ? 'Write a short realistic text that reuses the focus structures in one coherent situation.'
    : 'Prepare a short spoken interaction that reuses the focus structures in one coherent situation.';
}

function buildDefaultPhases(
  sessionMinutes: number,
  applicationMode: 'writing' | 'speaking',
  curationBrief: string
): SessionPhase[] {
  const applicationObjective = curationBrief;

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
      module: applicationMode === 'writing' ? 'Schreibtrainer' : 'Sprechtrainer',
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

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

interface FocusDiagnostics {
  score: number;
  reasons: string[];
  exerciseRecommendations: string[];
}

function pushUnique(target: string[], value: string): void {
  if (!target.includes(value)) {
    target.push(value);
  }
}

function buildExerciseRecommendations(
  profile: LearnerProfile,
  structureId: string
): string[] {
  const structure = getGrammarStructure(structureId);
  const progress = profile.grammarProgress[structureId];
  const diagnosticNote = normalizeText(progress?.diagnosticNote);
  const freeProductionAccuracy = progress?.freeProductionAccuracy ?? 0;
  const usageRatio = progress && progress.opportunities > 0 ? progress.uses / progress.opportunities : 0;
  const avoidanceSignal = (profile.avoidanceSignals ?? []).find((signal) => signal.structureId === structureId);
  const taskMatch = (profile.upcomingTasks ?? []).find((task) => task.structures.includes(structureId));
  const recommendations: string[] = [];

  if (/word order|verb-final|verb final|subordinate clause/.test(diagnosticNote) || structureId === 'B4') {
    pushUnique(recommendations, 'Build clause frames from chunks and force the finite verb to the sentence-final slot before free production.');
  }
  if (/pressure|speech|spoken|under pressure/.test(diagnosticNote)) {
    pushUnique(recommendations, 'Run timed speaking reps, then repeat the same idea once more slowly with self-correction.');
  }
  if (/request|polite|direct command/.test(diagnosticNote) || structureId === 'B5') {
    pushUnique(recommendations, 'Rewrite blunt requests into softer Konjunktiv II forms before a short role-play.');
  }
  if (/case|dative|article|preposition/.test(diagnosticNote) || structureId === 'B1' || structureId === 'B2' || structureId === 'B6') {
    pushUnique(recommendations, 'Use short substitution drills that swap articles, pronouns, or prepositions inside the same sentence frame.');
  }
  if (avoidanceSignal?.status === 'flagged' || usageRatio < 0.1) {
    pushUnique(recommendations, 'Start with low-stakes retrieval and one constrained output before asking for open-ended production.');
  }
  if (freeProductionAccuracy < 50) {
    pushUnique(recommendations, 'Finish with a short free-production task that requires at least three correct uses of the target structure.');
  }
  if (taskMatch) {
    pushUnique(recommendations, `Rehearse the structure inside the upcoming task "${taskMatch.title}".`);
  }
  if (recommendations.length === 0) {
    pushUnique(recommendations, `Use a guided practice cycle based on ${structure.summary.toLowerCase()}.`);
  }

  return recommendations.slice(0, 3);
}

function analyzeFocusStructure(
  profile: LearnerProfile,
  structureId: string
): FocusDiagnostics {
  const structure = getGrammarStructure(structureId);
  const progress = profile.grammarProgress[structureId];
  const mastery = progress?.masteryPercent ?? 0;
  const freeProductionAccuracy = progress?.freeProductionAccuracy ?? 0;
  const usageRatio = progress && progress.opportunities > 0 ? progress.uses / progress.opportunities : 0;
  const diagnosticNote = progress?.diagnosticNote?.trim();
  const priorityBase = structure.priority === 'highest'
    ? 120
    : structure.priority === 'high'
      ? 90
      : structure.priority === 'medium'
        ? 60
        : 30;
  const weakProductionPenalty = Math.max(0, 65 - freeProductionAccuracy) * 1.2;
  const lowMasteryPenalty = Math.max(0, 65 - mastery);
  const avoidancePenalty = usageRatio < 0.1 ? 20 : usageRatio < 0.2 ? 10 : 0;
  const diagnosticNoteBoost = diagnosticNote ? 18 : 0;

  const taskContextText = normalizeText(
    [
      profile.activeLernauftrag,
      ...(profile.upcomingTasks ?? []).flatMap((task) => [task.title, task.notes]),
    ].filter(Boolean).join(' ')
  );
  const lernauftragBoost = (
    (structureId === 'B5' && /email|request|formal|landlord|interview|application/.test(taskContextText))
    || (structureId === 'B4' && /why|because|reason|explain|interview|argument/.test(taskContextText))
    || (structureId === 'B1' && /with|friend|weekend|appointment|mit |colleague|company/.test(taskContextText))
  ) ? 45 : 0;
  const avoidanceSignals = profile.avoidanceSignals ?? [];
  const upcomingTasks = profile.upcomingTasks ?? [];
  const avoidanceSignal = avoidanceSignals.find((signal) => signal.structureId === structureId);
  const avoidanceSignalBoost = avoidanceSignal?.status === 'flagged'
    ? 55
    : avoidanceSignal?.status === 'monitoring'
      ? 20
      : 0;
  const taskMatch = upcomingTasks.find((task) => task.structures.includes(structureId));
  const taskBoost = taskMatch ? 35 : 0;

  const reasons: string[] = [];
  if (structure.priority === 'highest' || structure.priority === 'high') {
    reasons.push(`High communicative impact (${structure.priority} priority).`);
  }
  if (mastery < 65) {
    reasons.push(`Low current mastery (${mastery}%).`);
  }
  if (freeProductionAccuracy < 65) {
    reasons.push(`Weak free-production accuracy (${freeProductionAccuracy}%).`);
  }
  if (usageRatio < 0.1) {
    reasons.push('Strong avoidance signal in recent usage.');
  } else if (usageRatio < 0.2) {
    reasons.push('Usage is low enough to monitor for avoidance.');
  }
  if (avoidanceSignal) {
    reasons.push(`Stored avoidance status: ${avoidanceSignal.status}.`);
  }
  if (lernauftragBoost > 0) {
    reasons.push('Directly supports the active Lernauftrag.');
  }
  if (taskMatch) {
    reasons.push(`Supports upcoming task: ${taskMatch.title}.`);
  }
  if (diagnosticNote) {
    reasons.push(`Observed pattern: ${diagnosticNote}`);
  }

  return {
    score: priorityBase + lowMasteryPenalty + weakProductionPenalty + avoidancePenalty + avoidanceSignalBoost + lernauftragBoost + taskBoost + diagnosticNoteBoost,
    reasons,
    exerciseRecommendations: buildExerciseRecommendations(profile, structureId),
  };
}

function pickFocusSelections(profile: LearnerProfile): SessionFocusSelection[] {
  const masteryById = Object.fromEntries(
    Object.entries(profile.grammarProgress).map(([structureId, progress]) => [
      structureId,
      progress.masteryPercent,
    ])
  );

  const unlocked = getNextPriorityStructures(masteryById);

  return unlocked
    .sort((left, right) => {
      const scoreDelta = analyzeFocusStructure(profile, right.id).score - analyzeFocusStructure(profile, left.id).score;
      if (scoreDelta !== 0) return scoreDelta;

      const leftProgress = profile.grammarProgress[left.id];
      const rightProgress = profile.grammarProgress[right.id];
      const masteryDelta = (leftProgress?.masteryPercent ?? 0) - (rightProgress?.masteryPercent ?? 0);
      if (masteryDelta !== 0) return masteryDelta;

      return left.id.localeCompare(right.id);
    })
    .slice(0, 2)
    .map((structure) => {
      const diagnostics = analyzeFocusStructure(profile, structure.id);
      return {
        structureId: structure.id,
        title: structure.title,
        reasons: diagnostics.reasons,
        exerciseRecommendations: diagnostics.exerciseRecommendations,
      };
    });
}

export function buildSessionPlan(
  profile: LearnerProfile,
  options: SessionPlanOptions = {}
): SessionPlan {
  const applicationMode = inferApplicationMode(profile);
  const curationBrief = buildCurationBrief(profile, applicationMode);
  const focusSelections = pickFocusSelections(profile);
  const focusStructures = focusSelections.map((selection) => selection.structureId);

  return {
    learnerId: profile.learnerId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    aiEngine: profile.aiEngine,
    targetLanguage: profile.targetLanguage,
    applicationMode,
    curationBrief,
    focusStructures,
    focusSelections,
    notesFolder: options.notesFolder ?? 'neurolex/',
    phases: buildDefaultPhases(profile.preferredSessionMinutes, applicationMode, curationBrief),
  };
}
