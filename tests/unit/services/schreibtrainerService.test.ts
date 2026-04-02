import type { LearnerProfile } from '@/domain/types';
import { SchreibtrainerService } from '@/services/schreibtrainerService';
import { buildSessionPlan } from '@/services/sessionPlanner';

const profile: LearnerProfile = {
  learnerId: 'primary-learner',
  aiEngine: 'codex',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  currentLevel: 'B1',
  preferredSessionMinutes: 60,
  activeLernauftrag: 'Write a formal email to a landlord about a broken heater.',
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
    B4: { structureId: 'B4', masteryPercent: 22, freeProductionAccuracy: 15, opportunities: 9, uses: 2 },
  },
};

describe('SchreibtrainerService', () => {
  test('builds a writing application note for writing-oriented Lernauftrag work', () => {
    const plan = buildSessionPlan(profile, { notesFolder: 'neurolex/' });
    const schreibtrainer = new SchreibtrainerService('neurolex/');
    const artifact = schreibtrainer.buildWritingArtifact(profile, plan, new Date('2026-04-02T12:00:00.000Z'));

    expect(plan.applicationMode).toBe('writing');
    expect(artifact.kind).toBe('writing-application');
    expect(artifact.path).toBe('neurolex/sessions/2026-04/writing-application-2026-04-02T12-00-00.000Z.md');
    expect(artifact.content).toContain('# NeuroLex Writing Application');
    expect(artifact.content).toContain('formal email');
  });
});
