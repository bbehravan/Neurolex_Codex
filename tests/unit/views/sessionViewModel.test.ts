import type { SessionRun } from '@/domain/types';
import { buildSessionViewModel } from '@/views/sessionViewModel';

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
    focusSelections: [],
    notesFolder: 'neurolex/',
    phases: [],
  },
  summary: {
    learnerId: 'primary-learner',
    generatedAt: '2026-04-02T12:00:00.000Z',
    targetLanguage: 'German',
    focusStructures: ['B1', 'B4'],
    wins: ['Win'],
    watchItems: ['Watch'],
    nextActions: ['Act'],
    reflectionPrompt: 'Reflect',
  },
  evaluation: {
    completenessScore: 100,
    adaptationScore: 100,
    coverageScore: 100,
    notes: ['ok'],
  },
  artifacts: [
    { kind: 'session-plan', path: 'plan.md', content: '' },
  ],
};

describe('buildSessionViewModel', () => {
  test('builds a compact session view model from a session run', () => {
    const model = buildSessionViewModel(run);

    expect(model.title).toBe('NeuroLex Session View');
    expect(model.applicationMode).toBe('speaking');
    expect(model.metrics.some((metric) => metric.label === 'Completeness')).toBe(true);
    expect(model.artifactPaths).toContain('plan.md');
  });
});
