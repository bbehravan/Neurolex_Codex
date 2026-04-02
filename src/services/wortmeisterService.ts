import type { LearnerProfile, SessionArtifact, SessionPlan } from '../domain/types';

interface VocabularyItem {
  german: string;
  english: string;
  prompt: string;
}

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(now: Date): string {
  return now.toISOString().replace(/[:]/g, '-');
}

const VOCABULARY_PACKS: Record<string, VocabularyItem[]> = {
  B1: [
    { german: 'mit dem Kollegen', english: 'with the colleague', prompt: 'Say where you are going or speaking with someone.' },
    { german: 'bei der Firma', english: 'at the company', prompt: 'Describe a location using a dative preposition.' },
    { german: 'nach dem Termin', english: 'after the appointment', prompt: 'Add a time phrase to a short answer.' },
  ],
  B4: [
    { german: 'weil', english: 'because', prompt: 'Give a reason and force verb-final order.' },
    { german: 'obwohl', english: 'although', prompt: 'Contrast two ideas in one sentence.' },
    { german: 'dass', english: 'that', prompt: 'Report an opinion with a subordinate clause.' },
  ],
  B5: [
    { german: 'koennten Sie ...?', english: 'could you ...?', prompt: 'Turn a direct request into a polite question.' },
    { german: 'ich haette gern', english: 'I would like', prompt: 'Make a polite service or shopping request.' },
    { german: 'waere es moeglich ...?', english: 'would it be possible ...?', prompt: 'Soften a formal request.' },
  ],
  C1: [
    { german: 'wird vorbereitet', english: 'is being prepared', prompt: 'Describe a process using passive voice.' },
    { german: 'wurde entschieden', english: 'was decided', prompt: 'Report a formal decision.' },
    { german: 'muss erledigt werden', english: 'must be done', prompt: 'State an obligation in passive form.' },
  ],
};

function buildFallbackVocabulary(structureId: string, title: string): VocabularyItem[] {
  return [
    {
      german: title,
      english: `target structure ${structureId}`,
      prompt: 'Say one sentence that uses the target structure accurately.',
    },
  ];
}

function buildTaskAnchors(profile: LearnerProfile): VocabularyItem[] {
  const task = profile.upcomingTasks[0];
  if (!task) return [];

  return [
    {
      german: task.title,
      english: 'upcoming task anchor',
      prompt: `Reuse this phrase while preparing for: ${task.title}`,
    },
  ];
}

function collectVocabulary(profile: LearnerProfile, plan: SessionPlan): VocabularyItem[] {
  const items = plan.focusSelections.flatMap((selection) =>
    VOCABULARY_PACKS[selection.structureId] ?? buildFallbackVocabulary(selection.structureId, selection.title)
  );

  return [...items, ...buildTaskAnchors(profile)].slice(0, 7);
}

export class WortmeisterService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildWarmupArtifact(profile: LearnerProfile, plan: SessionPlan, now = new Date()): SessionArtifact {
    const isoDay = now.toISOString().slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(now);
    const items = collectVocabulary(profile, plan);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/vocabulary-warmup-${timestamp}.md`;
    const content = [
      '---',
      'title: "NeuroLex Vocabulary Warm-up"',
      'type: warmup-vocabulary',
      `date: ${isoDay}`,
      `target_language: ${profile.targetLanguage}`,
      '---',
      '',
      '# NeuroLex Vocabulary Warm-up',
      '',
      '## Goal',
      '- Review high-utility phrases before grammar work starts.',
      '- Say each item aloud, then use it in one short sentence.',
      '',
      '## Review Cards',
      ...items.map((item) => `- ${item.german} -> ${item.english} | Prompt: ${item.prompt}`),
      '',
      '## Exit Ticket',
      '- Produce two short spoken or written lines that reuse at least two warm-up items.',
      '',
    ].join('\n');

    return {
      kind: 'warmup-vocabulary',
      path,
      content,
    };
  }
}
