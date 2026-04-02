import type { LearnerProfile, SessionArtifact, SessionPlan } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

function buildSpeakingPrompt(profile: LearnerProfile, plan: SessionPlan): string {
  if (profile.activeLernauftrag) {
    return `Speak for 60-90 seconds while advancing this Lernauftrag: ${profile.activeLernauftrag}`;
  }

  const upcomingTask = profile.upcomingTasks?.[0];
  if (upcomingTask) {
    return `Role-play the upcoming task "${upcomingTask.title}" and use the focus structures under mild time pressure.`;
  }

  return `Prepare a short spoken response based on this brief: ${plan.curationBrief}`;
}

export class SprechtrainerService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildSpeakingArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/speaking-application-${timestamp}.md`;
    const prompt = buildSpeakingPrompt(profile, plan);

    const content = [
      '---',
      'title: "NeuroLex Speaking Application"',
      'type: speaking-application',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Speaking Application',
      '',
      '## Brief',
      `- ${plan.curationBrief}`,
      '',
      '## Prompt',
      `- ${prompt}`,
      '',
      '## Speaking Moves',
      '- First response: speak without stopping for 45 seconds.',
      '- Second response: repeat the same idea more slowly and self-correct one error.',
      '- Final response: add one extra detail that forces another use of the focus structures.',
      '',
      '## Must Use',
      ...plan.focusSelections.map((selection) => `- ${selection.structureId} (${selection.title})`),
      '',
    ].join('\n');

    return {
      kind: 'speaking-application',
      path,
      content,
    };
  }
}
