import type { SessionArtifact, SessionRun } from '../domain/types';

interface SpeechSynthesisUtteranceLike {
  lang: string;
  rate: number;
  pitch: number;
}

interface SpeechSynthesisLike {
  speak: (utterance: SpeechSynthesisUtteranceLike) => void;
}

type SpeechSynthesisConstructor = new (text: string) => SpeechSynthesisUtteranceLike;

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(generatedAt: string): string {
  return generatedAt.replace(/[:]/g, '-');
}

export class TtsService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildSpeechText(run: SessionRun): string {
    const focusLine = run.plan.focusSelections
      .map((selection) => `${selection.structureId} ${selection.title}`)
      .join(', ');
    const nextAction = run.summary.nextActions[0] ?? 'Repeat the main application task once more with slower self-correction.';

    return [
      'NeuroLex session recap.',
      `Today you focused on ${focusLine || 'your current target structures'}.`,
      run.summary.wins[0] ?? 'You kept the learning loop moving.',
      `Next action: ${nextAction}`,
      `Reflection prompt: ${run.summary.reflectionPrompt}`,
    ].join(' ');
  }

  buildVoiceGuideArtifact(run: SessionRun): SessionArtifact {
    const isoDay = run.generatedAt.slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(run.generatedAt);
    const speechText = this.buildSpeechText(run);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/voice-guide-${timestamp}.md`;
    const content = [
      '---',
      'title: "NeuroLex Voice Guide"',
      'type: voice-guide',
      `date: ${isoDay}`,
      `session_id: ${run.sessionId}`,
      '---',
      '',
      '# NeuroLex Voice Guide',
      '',
      '## Spoken Script',
      speechText,
      '',
    ].join('\n');

    return {
      kind: 'voice-guide',
      path,
      content,
    };
  }

  speak(
    text: string,
    synthesis: SpeechSynthesisLike | undefined = (globalThis as { speechSynthesis?: SpeechSynthesisLike }).speechSynthesis,
    UtteranceCtor: SpeechSynthesisConstructor | undefined = (globalThis as { SpeechSynthesisUtterance?: SpeechSynthesisConstructor }).SpeechSynthesisUtterance
  ): boolean {
    if (!synthesis || !UtteranceCtor) return false;

    const utterance = new UtteranceCtor(text);
    utterance.lang = 'de-DE';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    synthesis.speak(utterance);
    return true;
  }
}
