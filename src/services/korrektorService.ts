import type { LearnerProfile, SessionArtifact, SessionPlan } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildCorrectionPriorities(plan: SessionPlan): string[] {
  return plan.focusSelections.flatMap((selection) => {
    const directRisks = selection.reasons.filter((reason) =>
      /low current mastery|weak free-production accuracy|avoidance|observed pattern/i.test(reason)
    );

    if (directRisks.length === 0) {
      return [`${selection.structureId}: preserve fluency first, then correct one high-value form.`];
    }

    return directRisks.map((reason) => `${selection.structureId}: ${reason}`);
  });
}

function buildSelfCheck(plan: SessionPlan): string[] {
  return plan.focusSelections.map((selection) =>
    `${selection.structureId}: reread the output and confirm at least one accurate use before moving on.`
  );
}

export class KorrektorService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildCorrectionGuideArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/correction-guide-${timestamp}.md`;
    const priorities = buildCorrectionPriorities(plan);
    const selfCheck = buildSelfCheck(plan);

    const content = [
      '---',
      'title: "NeuroLex Correction Guide"',
      'type: correction-guide',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Correction Guide',
      '',
      '## Correction Policy',
      '- Correct the session focus first, not every small slip.',
      '- Preserve momentum during free production before giving dense feedback.',
      '- Prefer one precise correction plus a retry over long explanation blocks.',
      '',
      '## Priority Watch Points',
      ...priorities.map((item) => `- ${item}`),
      '',
      '## Learner Self-Check',
      ...selfCheck.map((item) => `- ${item}`),
      '',
    ].join('\n');

    return {
      kind: 'correction-guide',
      path,
      content,
    };
  }
}
