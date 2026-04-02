import type { LearnerProfile } from '@/domain/types';
import { UebungsmeisterService } from '@/services/uebungsmeisterService';

const profile: LearnerProfile = {
  learnerId: 'primary-learner',
  aiEngine: 'codex',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  currentLevel: 'B1',
  preferredSessionMinutes: 60,
  activeLernauftrag: 'Explain reasons clearly in a job interview.',
  avoidanceSignals: [
    { structureId: 'B4', status: 'flagged', note: 'avoids subordinate clauses in speech' },
  ],
  upcomingTasks: [
    {
      title: 'Job interview',
      deadline: '2026-04-10',
      structures: ['B4', 'B5'],
      notes: 'formal answers',
    },
  ],
  grammarProgress: {
    A1: { structureId: 'A1', masteryPercent: 75, freeProductionAccuracy: 70, opportunities: 12, uses: 8 },
    A2: { structureId: 'A2', masteryPercent: 80, freeProductionAccuracy: 78, opportunities: 15, uses: 10 },
    A3: { structureId: 'A3', masteryPercent: 72, freeProductionAccuracy: 68, opportunities: 14, uses: 9 },
    A4: { structureId: 'A4', masteryPercent: 71, freeProductionAccuracy: 65, opportunities: 11, uses: 7 },
    A5: { structureId: 'A5', masteryPercent: 69, freeProductionAccuracy: 63, opportunities: 10, uses: 6 },
    A6: { structureId: 'A6', masteryPercent: 68, freeProductionAccuracy: 62, opportunities: 10, uses: 6 },
    B1: { structureId: 'B1', masteryPercent: 18, freeProductionAccuracy: 12, opportunities: 12, uses: 1 },
    B3: { structureId: 'B3', masteryPercent: 58, freeProductionAccuracy: 56, opportunities: 8, uses: 4 },
    B4: {
      structureId: 'B4',
      masteryPercent: 22,
      freeProductionAccuracy: 15,
      opportunities: 9,
      uses: 0,
      diagnosticNote: 'verb-final word order breaks under pressure',
    },
  },
};

describe('UebungsmeisterService', () => {
  test('builds a complete session package with curated application artifacts', () => {
    const uebungsmeister = new UebungsmeisterService('neurolex/');
    const sessionRun = uebungsmeister.buildSessionRun(profile, new Date('2026-04-02T12:00:00.000Z'));

    expect(sessionRun.sessionId).toBe('session-2026-04-02T12-00-00.000Z');
    expect(sessionRun.plan.applicationMode).toBe('speaking');
    expect(sessionRun.artifacts.map((artifact) => artifact.kind)).toEqual([
      'session-plan',
      'warmup-vocabulary',
      'grammar-core',
      'curation-brief',
      'speaking-application',
      'correction-guide',
      'session-recap',
      'session-run',
    ]);
    expect(sessionRun.artifacts.find((artifact) => artifact.kind === 'warmup-vocabulary')?.path)
      .toContain('vocabulary-warmup-2026-04-02T12-00-00.000Z.md');
    expect(sessionRun.artifacts.find((artifact) => artifact.kind === 'grammar-core')?.path)
      .toContain('grammar-core-2026-04-02T12-00-00.000Z.md');
    expect(sessionRun.artifacts.find((artifact) => artifact.kind === 'curation-brief')?.path)
      .toContain('curation-brief-2026-04-02T12-00-00.000Z.md');
    expect(sessionRun.artifacts.find((artifact) => artifact.kind === 'speaking-application')?.path)
      .toContain('speaking-application-2026-04-02T12-00-00.000Z.md');
    expect(sessionRun.artifacts.find((artifact) => artifact.kind === 'session-run')?.content)
      .toContain('## Lernauftrag Adaptation');
  });
});
