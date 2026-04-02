import type { LearnerProfile, SessionArtifact, SessionFocusSelection, SessionPlan } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildControlledDrills(selection: SessionFocusSelection): string[] {
  const firstRecommendation = selection.exerciseRecommendations[0]
    ?? 'Use one guided pattern before free production.';

  return [
    `Complete three short model sentences focused on ${selection.title}.`,
    `Rewrite two sentences while keeping the same meaning but forcing ${selection.structureId}.`,
    firstRecommendation,
  ];
}

function buildProductionTask(profile: LearnerProfile, selection: SessionFocusSelection): string {
  if (profile.activeLernauftrag) {
    return `Write or say 4-6 lines that advance the Lernauftrag while using ${selection.structureId} at least three times: ${profile.activeLernauftrag}`;
  }

  return `Produce a short communicative response using ${selection.title} in a realistic everyday situation.`;
}

function buildSuccessCriteria(selection: SessionFocusSelection): string[] {
  return [
    `Use ${selection.structureId} correctly at least three times.`,
    'Keep one response fully self-corrected after noticing an error.',
    'Finish with one freer sentence that sounds natural, not translated word-for-word.',
  ];
}

export class GrammatiktrainerService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildCoreArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const primaryFocus = plan.focusSelections[0];
    const secondaryFocus = plan.focusSelections[1];
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/grammar-core-${timestamp}.md`;

    const controlledDrills = primaryFocus
      ? buildControlledDrills(primaryFocus)
      : ['Calibration needed before a grammar core can be generated.'];
    const successCriteria = primaryFocus
      ? buildSuccessCriteria(primaryFocus)
      : ['Generate a valid focus structure first.'];
    const productionTask = primaryFocus
      ? buildProductionTask(profile, primaryFocus)
      : 'No production task available.';

    const content = [
      '---',
      'title: "NeuroLex Grammar Core"',
      'type: grammar-core',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Grammar Core',
      '',
      '## Primary Focus',
      primaryFocus
        ? `- ${primaryFocus.structureId} (${primaryFocus.title})`
        : '- Calibration needed',
      secondaryFocus
        ? `- Secondary support: ${secondaryFocus.structureId} (${secondaryFocus.title})`
        : '- Secondary support: none',
      '',
      '## Why This Focus',
      ...(primaryFocus?.reasons.map((reason) => `- ${reason}`) ?? ['- No rationale available.']),
      '',
      '## Controlled Drills',
      ...controlledDrills.map((drill) => `- ${drill}`),
      '',
      '## Application Task',
      `- ${productionTask}`,
      '',
      '## Success Criteria',
      ...successCriteria.map((criterion) => `- ${criterion}`),
      '',
    ].join('\n');

    return {
      kind: 'grammar-core',
      path,
      content,
    };
  }
}
