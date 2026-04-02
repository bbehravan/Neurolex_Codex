import type { SessionRun } from '@/domain/types';
import { TtsService } from '@/services/ttsService';

const run: SessionRun = {
  sessionId: 'session-2026-04-02T12-00-00.000Z',
  generatedAt: '2026-04-02T12:00:00.000Z',
  plan: {
    learnerId: 'primary-learner',
    generatedAt: '2026-04-02T12:00:00.000Z',
    aiEngine: 'codex',
    targetLanguage: 'German',
    applicationMode: 'speaking',
    curationBrief: 'Speaking task in formal register: Explain reasons clearly in a job interview.',
    focusStructures: ['B1', 'B4'],
    focusSelections: [
      {
        structureId: 'B1',
        title: 'Dative Case',
        reasons: ['Low current mastery (18%).'],
        exerciseRecommendations: ['Use short substitution drills.'],
      },
    ],
    notesFolder: 'neurolex/',
    phases: [],
  },
  summary: {
    learnerId: 'primary-learner',
    generatedAt: '2026-04-02T12:00:00.000Z',
    targetLanguage: 'German',
    focusStructures: ['B1', 'B4'],
    wins: ['Strong foundation already established.'],
    watchItems: ['B4: Observe word order.'],
    nextActions: ['B4: Run timed speaking reps.'],
    reflectionPrompt: 'What improved?',
  },
  artifacts: [],
};

describe('TtsService', () => {
  test('builds a voice guide artifact from a session run', () => {
    const service = new TtsService('neurolex/');
    const artifact = service.buildVoiceGuideArtifact(run);

    expect(artifact.kind).toBe('voice-guide');
    expect(artifact.path).toBe('neurolex/sessions/2026-04/voice-guide-2026-04-02T12-00-00.000Z.md');
    expect(artifact.content).toContain('# NeuroLex Voice Guide');
  });

  test('speaks when a synthesis engine is provided', () => {
    const speak = jest.fn();
    const service = new TtsService('neurolex/');

    class MockUtterance {
      lang = '';
      rate = 1;
      pitch = 1;
      constructor(public readonly text: string) {}
    }

    const result = service.speak(
      'Hallo',
      { speak },
      MockUtterance as unknown as new (text: string) => { lang: string; rate: number; pitch: number }
    );

    expect(result).toBe(true);
    expect(speak).toHaveBeenCalled();
  });
});
