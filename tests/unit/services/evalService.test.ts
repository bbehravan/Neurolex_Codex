import type { SessionRun } from '@/domain/types';
import { EvalService } from '@/services/evalService';

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
      {
        structureId: 'B4',
        title: 'Subordinate Clause Word Order',
        reasons: ['Observed pattern: verb-final word order breaks under pressure'],
        exerciseRecommendations: ['Run timed speaking reps.'],
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
    watchItems: ['B4: Observed pattern: verb-final word order breaks under pressure'],
    nextActions: ['B4: Run timed speaking reps.'],
    reflectionPrompt: 'What improved?',
  },
  artifacts: [
    { kind: 'session-plan', path: 'plan.md', content: '' },
    { kind: 'warmup-vocabulary', path: 'warmup.md', content: '' },
    { kind: 'grammar-core', path: 'grammar.md', content: '' },
    { kind: 'curation-brief', path: 'curation.md', content: '' },
    { kind: 'speaking-application', path: 'speaking.md', content: '' },
    { kind: 'correction-guide', path: 'correction.md', content: '' },
    { kind: 'session-recap', path: 'recap.md', content: '' },
    { kind: 'voice-guide', path: 'voice.md', content: '' },
  ],
};

describe('EvalService', () => {
  test('builds evaluation scores and an evaluation artifact from a session run', () => {
    const service = new EvalService('neurolex/');
    const evaluation = service.buildEvaluation(run);
    const artifact = service.buildEvaluationArtifact(run);

    expect(evaluation.completenessScore).toBe(80);
    expect(evaluation.adaptationScore).toBe(100);
    expect(evaluation.coverageScore).toBeGreaterThan(0);
    expect(artifact.kind).toBe('session-eval');
    expect(artifact.path).toBe('neurolex/sessions/2026-04/session-eval-2026-04-02T12-00-00.000Z.md');
    expect(artifact.content).toContain('# NeuroLex Session Evaluation');
  });
});
