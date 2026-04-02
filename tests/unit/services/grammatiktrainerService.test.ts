import type { LearnerProfile } from '@/domain/types';
import { ArchitektService } from '@/services/architektService';
import { GrammatiktrainerService } from '@/services/grammatiktrainerService';

const profile: LearnerProfile = {
  learnerId: 'primary-learner',
  aiEngine: 'codex',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  currentLevel: 'B1',
  preferredSessionMinutes: 60,
  activeLernauftrag: 'Explain reasons clearly in a job interview.',
  avoidanceSignals: [],
  upcomingTasks: [],
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

describe('GrammatiktrainerService', () => {
  test('builds a grammar core note with drills and application task', () => {
    const architekt = new ArchitektService('neurolex/');
    const grammatiktrainer = new GrammatiktrainerService('neurolex/');
    const plan = architekt.buildPlan(profile);
    const artifact = grammatiktrainer.buildCoreArtifact(profile, plan, new Date('2026-04-02T12:00:00.000Z'));

    expect(artifact.kind).toBe('grammar-core');
    expect(artifact.path).toBe('neurolex/sessions/2026-04/grammar-core-2026-04-02T12-00-00.000Z.md');
    expect(artifact.content).toContain('# NeuroLex Grammar Core');
    expect(artifact.content).toContain('## Controlled Drills');
    expect(artifact.content).toContain('Explain reasons clearly in a job interview.');
  });
});
