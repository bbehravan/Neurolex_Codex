import type { LearnerProfile, SessionPlan, SessionSummary } from '../domain/types';
import { buildSessionPlan } from './sessionPlanner';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function countMasteredStructures(profile: LearnerProfile): number {
  return Object.values(profile.grammarProgress).filter((progress) => progress.masteryPercent >= 65).length;
}

function buildWins(profile: LearnerProfile, plan: SessionPlan): string[] {
  const mastered = countMasteredStructures(profile);
  const wins = [
    `Strong foundation already established in ${mastered} tracked grammar structure${mastered === 1 ? '' : 's'}.`,
  ];

  if (profile.activeLernauftrag) {
    wins.push(`The session stayed anchored to the active Lernauftrag: ${profile.activeLernauftrag}`);
  }

  if (plan.focusSelections.some((selection) => selection.exerciseRecommendations.length > 0)) {
    wins.push('Each focus structure now has a concrete practice strategy instead of a generic drill.');
  }

  return wins;
}

function buildWatchItems(plan: SessionPlan): string[] {
  const watchItems = plan.focusSelections.flatMap((selection) =>
    selection.reasons
      .filter((reason) =>
        /low current mastery|weak free-production accuracy|avoidance|observed pattern/i.test(reason)
      )
      .map((reason) => `${selection.structureId}: ${reason}`)
  );

  return watchItems.length > 0
    ? watchItems
    : ['No acute risk signal detected beyond the current focus plan.'];
}

function buildNextActions(plan: SessionPlan): string[] {
  const actions = plan.focusSelections.flatMap((selection) =>
    selection.exerciseRecommendations.map((recommendation) => `${selection.structureId}: ${recommendation}`)
  );

  return actions.length > 0
    ? actions.slice(0, 4)
    : ['Run one short guided practice cycle for the highest-priority unlocked structure.'];
}

function buildReflectionPrompt(profile: LearnerProfile, plan: SessionPlan): string {
  if (profile.activeLernauftrag) {
    return `Where did today’s work make the active Lernauftrag feel easier: ${profile.activeLernauftrag}`;
  }

  const primaryFocus = plan.focusSelections[0];
  if (primaryFocus) {
    return `Which part of ${primaryFocus.title} felt most stable, and where did it still break down under pressure?`;
  }

  return 'What felt more automatic today, and what still needs a slower, more guided repetition?';
}

export class MentorService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildSummary(profile: LearnerProfile, plan?: SessionPlan, generatedAt?: string): SessionSummary {
    const resolvedGeneratedAt = generatedAt ?? new Date().toISOString();
    const resolvedPlan = plan ?? buildSessionPlan(profile, {
      generatedAt: resolvedGeneratedAt,
      notesFolder: this.getNotesRoot(),
    });

    return {
      learnerId: profile.learnerId,
      generatedAt: resolvedGeneratedAt,
      targetLanguage: profile.targetLanguage,
      focusStructures: resolvedPlan.focusStructures,
      wins: buildWins(profile, resolvedPlan),
      watchItems: buildWatchItems(resolvedPlan),
      nextActions: buildNextActions(resolvedPlan),
      reflectionPrompt: buildReflectionPrompt(profile, resolvedPlan),
    };
  }

  buildSessionRecapArtifact(profile: LearnerProfile, plan?: SessionPlan, now = new Date()): {
    summary: SessionSummary;
    path: string;
    content: string;
  } {
    const generatedAt = now.toISOString();
    const resolvedPlan = plan ?? buildSessionPlan(profile, {
      generatedAt,
      notesFolder: this.getNotesRoot(),
    });
    const summary = this.buildSummary(profile, resolvedPlan, generatedAt);
    const isoDay = generatedAt.slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = generatedAt.replace(/[:]/g, '-');
    const path = `${this.getNotesRoot()}sessions/${monthKey}/session-recap-${timestamp}.md`;

    const focusLines = summary.focusStructures.length > 0
      ? summary.focusStructures.map((structureId) => `- ${structureId}`).join('\n')
      : '- No focus structures selected';
    const focusRationale = resolvedPlan.focusSelections.length > 0
      ? resolvedPlan.focusSelections.map((selection) =>
        `- ${selection.structureId} (${selection.title})\n${selection.reasons.map((reason) => `  - ${reason}`).join('\n')}`
      ).join('\n')
      : '- No focus rationale captured';
    const wins = summary.wins.map((item) => `- ${item}`).join('\n');
    const watchItems = summary.watchItems.map((item) => `- ${item}`).join('\n');
    const nextActions = summary.nextActions.map((item) => `- ${item}`).join('\n');

    const content = [
      '---',
      'title: "NeuroLex Session Recap"',
      'type: session-recap',
      `date: ${isoDay}`,
      `learner_level: ${profile.currentLevel}`,
      `target_language: ${profile.targetLanguage}`,
      `ai_engine: ${profile.aiEngine}`,
      `notes_folder: ${resolvedPlan.notesFolder}`,
      '---',
      '',
      '# NeuroLex Session Recap',
      '',
      '## Snapshot',
      `- Learner ID: ${summary.learnerId}`,
      `- Target language: ${summary.targetLanguage}`,
      `- Session duration: ${profile.preferredSessionMinutes} min`,
      `- Active Lernauftrag: ${profile.activeLernauftrag || 'none'}`,
      '',
      '## Focus Structures',
      focusLines,
      '',
      '## Application Strategy',
      `- Mode: ${resolvedPlan.applicationMode}`,
      `- Brief: ${resolvedPlan.curationBrief}`,
      '',
      '## Focus Rationale',
      focusRationale,
      '',
      '## Wins To Carry Forward',
      wins,
      '',
      '## Watch Items',
      watchItems,
      '',
      '## Next Session Actions',
      nextActions,
      '',
      '## Reflection Prompt',
      summary.reflectionPrompt,
      '',
    ].join('\n');

    return { summary, path, content };
  }
}
