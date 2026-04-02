import type { LearnerProfile, SessionArtifact, SessionPlan } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildWritingPrompt(profile: LearnerProfile, plan: SessionPlan): string {
  if (profile.activeLernauftrag) {
    return `Write 120-180 words that advance this Lernauftrag: ${profile.activeLernauftrag}`;
  }

  const upcomingTask = profile.upcomingTasks?.[0];
  if (upcomingTask) {
    return `Write a realistic text for the upcoming task "${upcomingTask.title}" and reuse the selected focus structures naturally.`;
  }

  return `Write a short coherent text based on this brief: ${plan.curationBrief}`;
}

export class SchreibtrainerService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildWritingArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/writing-application-${timestamp}.md`;
    const prompt = buildWritingPrompt(profile, plan);

    const content = [
      '---',
      'title: "NeuroLex Writing Application"',
      'type: writing-application',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Writing Application',
      '',
      '## Brief',
      `- ${plan.curationBrief}`,
      '',
      '## Prompt',
      `- ${prompt}`,
      '',
      '## Must Use',
      ...plan.focusSelections.map((selection) => `- ${selection.structureId} (${selection.title})`),
      '',
      '## Writing Checklist',
      '- Use every focus structure at least once in a meaningful sentence.',
      '- Keep the text coherent enough to read as one real message.',
      '- Leave one minute for self-correction before finishing.',
      '',
    ].join('\n');

    return {
      kind: 'writing-application',
      path,
      content,
    };
  }
}
