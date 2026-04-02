import { buildSessionPlan } from '@/services/sessionPlanner';
import type { LearnerProfile } from '@/domain/types';

const baseProfile: LearnerProfile = {
  learnerId: 'learner-1',
  aiEngine: 'codex',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  currentLevel: 'B1',
  preferredSessionMinutes: 60,
  grammarProgress: {
    A1: { structureId: 'A1', masteryPercent: 75, freeProductionAccuracy: 70, opportunities: 12, uses: 8 },
    A2: { structureId: 'A2', masteryPercent: 80, freeProductionAccuracy: 78, opportunities: 15, uses: 10 },
    A3: { structureId: 'A3', masteryPercent: 72, freeProductionAccuracy: 68, opportunities: 14, uses: 9 },
    A4: { structureId: 'A4', masteryPercent: 71, freeProductionAccuracy: 65, opportunities: 11, uses: 7 },
    A5: { structureId: 'A5', masteryPercent: 69, freeProductionAccuracy: 63, opportunities: 10, uses: 6 },
    A6: { structureId: 'A6', masteryPercent: 68, freeProductionAccuracy: 62, opportunities: 10, uses: 6 },
    B1: { structureId: 'B1', masteryPercent: 18, freeProductionAccuracy: 12, opportunities: 12, uses: 1 },
    B4: { structureId: 'B4', masteryPercent: 22, freeProductionAccuracy: 15, opportunities: 9, uses: 2 },
  },
};

describe('buildSessionPlan', () => {
  test('builds a four-phase default plan', () => {
    const plan = buildSessionPlan(baseProfile);

    expect(plan.phases.map(phase => phase.key)).toEqual([
      'warmup',
      'core',
      'application',
      'cooldown',
    ]);
    expect(plan.phases.reduce((sum, phase) => sum + phase.durationMinutes, 0)).toBe(60);
  });

  test('selects high-priority unlocked structures as the focus', () => {
    const plan = buildSessionPlan(baseProfile);
    expect(plan.focusStructures).toEqual(['B1', 'B4']);
  });

  test('switches application toward writing when a Lernauftrag is active', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      activeLernauftrag: 'Write a formal email to a landlord about a broken heater.',
    });

    expect(plan.phases[2].module).toBe('Schreibtrainer');
    expect(plan.phases[2].objective).toContain('Lernauftrag');
  });
});
