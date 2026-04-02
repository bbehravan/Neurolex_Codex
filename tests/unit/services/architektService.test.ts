import type { LearnerProfile } from '@/domain/types';
import { ArchitektService } from '@/services/architektService';

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
    { structureId: 'C1', status: 'monitoring', note: 'not relevant yet' },
  ],
  upcomingTasks: [
    {
      title: 'Job interview',
      deadline: '2026-04-10',
      structures: ['B4', 'B5'],
      notes: 'formal answers',
    },
    {
      title: 'Weekend chat',
      structures: ['B1'],
      notes: 'casual conversation',
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
      uses: 2,
      diagnosticNote: 'verb-final word order breaks under pressure',
    },
  },
};

describe('ArchitektService', () => {
  test('builds a plan artifact in the configured NeuroLex notes tree', () => {
    const service = new ArchitektService('neurolex/');
    const now = new Date('2026-04-02T12:00:00.000Z');

    const artifact = service.buildSessionPlanArtifact(profile, now);

    expect(artifact.plan.notesFolder).toBe('neurolex/');
    expect(artifact.path).toBe('neurolex/sessions/2026-04/session-plan-2026-04-02T12-00-00.000Z.md');
    expect(artifact.content).toContain('# NeuroLex Session Plan');
    expect(artifact.content).toContain('- B1');
    expect(artifact.content).toContain('- B4');
    expect(artifact.content).toContain('## Focus Rationale');
    expect(artifact.content).toContain('B1 (Dative Case)');
    expect(artifact.content).toContain('## Diagnostics Context');
    expect(artifact.content).toContain('Active Lernauftrag: Explain reasons clearly in a job interview.');
    expect(artifact.content).toContain('Avoidance signal: B4 is flagged');
    expect(artifact.content).toContain('Upcoming task: Job interview');
    expect(artifact.content).toContain('Upcoming task: Weekend chat');
    expect(artifact.content).toContain('Observed pattern: verb-final word order breaks under pressure');
  });
});
