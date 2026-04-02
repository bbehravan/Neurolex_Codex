import type { LearnerProfile, SessionArtifact, SessionPlan } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildRegister(plan: SessionPlan): string {
  return /formal|interview|application|landlord/.test(plan.curationBrief.toLowerCase()) ? 'formal' : 'everyday';
}

export class KuratorService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildCurationArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/curation-brief-${timestamp}.md`;
    const register = buildRegister(plan);
    const taskAnchor = profile.upcomingTasks?.[0]?.title ?? profile.activeLernauftrag ?? 'general communicative practice';

    const content = [
      '---',
      'title: "NeuroLex Curation Brief"',
      'type: curation-brief',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Curation Brief',
      '',
      '## Application Mode',
      `- ${plan.applicationMode}`,
      '',
      '## Scenario',
      `- ${plan.curationBrief}`,
      `- Task anchor: ${taskAnchor}`,
      `- Register: ${register}`,
      '',
      '## Focus Structures To Recycle',
      ...plan.focusSelections.map((selection) => `- ${selection.structureId} (${selection.title})`),
      '',
      '## Content Constraints',
      '- Keep the task realistic and concrete.',
      '- Force at least one use of each selected focus structure.',
      '- Prefer meaningful communication over isolated grammar display.',
      '',
    ].join('\n');

    return {
      kind: 'curation-brief',
      path,
      content,
    };
  }
}
