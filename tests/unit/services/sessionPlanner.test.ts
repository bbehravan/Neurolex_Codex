import type { LearnerProfile } from '@/domain/types';
import { buildSessionPlan } from '@/services/sessionPlanner';

const baseProfile: LearnerProfile = {
  learnerId: 'learner-1',
  aiEngine: 'codex',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  currentLevel: 'B1',
  preferredSessionMinutes: 60,
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
    expect(plan.focusSelections[0].structureId).toBe('B1');
    expect(plan.focusSelections[0].reasons.join(' ')).toContain('Low current mastery');
  });

  test('switches application toward writing when a Lernauftrag is active', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      activeLernauftrag: 'Write a formal email to a landlord about a broken heater.',
    });

    expect(plan.phases[2].module).toBe('Schreibtrainer');
    expect(plan.phases[2].objective).toContain('Lernauftrag');
  });

  test('lets a Lernauftrag boost relevant focus structures', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      activeLernauftrag: 'I need to write a formal email to my landlord requesting a repair.',
      grammarProgress: {
        ...baseProfile.grammarProgress,
        B4: { structureId: 'B4', masteryPercent: 72, freeProductionAccuracy: 69, opportunities: 10, uses: 4 },
        B5: { structureId: 'B5', masteryPercent: 30, freeProductionAccuracy: 20, opportunities: 8, uses: 1 },
      },
    });

    expect(plan.focusStructures).toContain('B5');
    expect(plan.focusSelections.find((selection) => selection.structureId === 'B5')?.reasons.join(' '))
      .toContain('active Lernauftrag');
  });

  test('prioritizes weak productive control over mere unlocked ordering', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      grammarProgress: {
        ...baseProfile.grammarProgress,
        B1: { structureId: 'B1', masteryPercent: 40, freeProductionAccuracy: 18, opportunities: 12, uses: 1 },
        B3: { structureId: 'B3', masteryPercent: 60, freeProductionAccuracy: 59, opportunities: 10, uses: 5 },
        B4: { structureId: 'B4', masteryPercent: 40, freeProductionAccuracy: 42, opportunities: 10, uses: 4 },
      },
    });

    expect(plan.focusStructures[0]).toBe('B1');
  });

  test('surfaces stored structure notes in the focus rationale', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      grammarProgress: {
        ...baseProfile.grammarProgress,
        B4: {
          structureId: 'B4',
          masteryPercent: 32,
          freeProductionAccuracy: 26,
          opportunities: 10,
          uses: 2,
          diagnosticNote: 'verb-final word order breaks under pressure',
        },
      },
    });

    expect(plan.focusStructures).toContain('B4');
    expect(plan.focusSelections.find((selection) => selection.structureId === 'B4')?.reasons.join(' '))
      .toContain('Observed pattern: verb-final word order breaks under pressure');
  });

  test('prioritizes explicitly flagged avoidance targets', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      avoidanceSignals: [
        { structureId: 'B4', status: 'flagged', note: 'avoids subordinate clauses in speech' },
      ],
      grammarProgress: {
        ...baseProfile.grammarProgress,
        B1: { structureId: 'B1', masteryPercent: 35, freeProductionAccuracy: 28, opportunities: 10, uses: 2 },
        B4: { structureId: 'B4', masteryPercent: 40, freeProductionAccuracy: 34, opportunities: 10, uses: 3 },
      },
    });

    expect(plan.focusStructures[0]).toBe('B4');
    expect(plan.focusSelections[0].reasons.join(' ')).toContain('Stored avoidance status: flagged');
  });

  test('uses upcoming tasks as explicit planning signals', () => {
    const plan = buildSessionPlan({
      ...baseProfile,
      upcomingTasks: [
        {
          title: 'Job interview',
          deadline: '2026-04-10',
          structures: ['B4', 'B5'],
          notes: 'formal answers',
        },
      ],
      grammarProgress: {
        ...baseProfile.grammarProgress,
        B4: { structureId: 'B4', masteryPercent: 72, freeProductionAccuracy: 70, opportunities: 10, uses: 5 },
        B5: { structureId: 'B5', masteryPercent: 38, freeProductionAccuracy: 30, opportunities: 8, uses: 2 },
      },
    });

    expect(plan.focusStructures).toContain('C1');
    expect(plan.focusSelections.find((selection) => selection.structureId === 'C1')?.reasons.join(' '))
      .toContain('Low current mastery');
  });
});
