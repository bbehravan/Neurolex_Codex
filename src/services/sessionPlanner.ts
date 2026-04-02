import { getGrammarStructure, getNextPriorityStructures } from '../domain/grammarGraph';
import type { LearnerProfile, SessionFocusSelection, SessionPhase, SessionPlan } from '../domain/types';

export interface SessionPlanOptions {
  generatedAt?: string;
  notesFolder?: string;
}

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

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

interface FocusDiagnostics {
  score: number;
  reasons: string[];
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

  const lernauftragText = normalizeText(profile.activeLernauftrag);
  const lernauftragBoost = (
    (structureId === 'B5' && /email|request|formal|landlord|interview/.test(lernauftragText))
    || (structureId === 'B4' && /why|because|reason|explain|interview/.test(lernauftragText))
    || (structureId === 'B1' && /with|friend|weekend|appointment|mit /.test(lernauftragText))
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
    .map((structure) => ({
      structureId: structure.id,
      title: structure.title,
      reasons: analyzeFocusStructure(profile, structure.id).reasons,
    }));
}

export function buildSessionPlan(
  profile: LearnerProfile,
  options: SessionPlanOptions = {}
): SessionPlan {
  const focusSelections = pickFocusSelections(profile);
  const focusStructures = focusSelections.map((selection) => selection.structureId);

  return {
    learnerId: profile.learnerId,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    aiEngine: profile.aiEngine,
    targetLanguage: profile.targetLanguage,
    focusStructures,
    focusSelections,
    notesFolder: options.notesFolder ?? 'neurolex/',
    phases: buildDefaultPhases(profile.preferredSessionMinutes, profile.activeLernauftrag),
  };
}
