import type { LearnerProfile } from '@/domain/types';
import { buildGrammarGraphViewModel } from '@/views/grammarGraphViewModel';

const profile: LearnerProfile = {
  learnerId: 'primary-learner',
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
    B4: { structureId: 'B4', masteryPercent: 0, freeProductionAccuracy: 0, opportunities: 0, uses: 0 },
  },
};

describe('buildGrammarGraphViewModel', () => {
  test('builds graph nodes, edges, and summary counts from learner progress', () => {
    const model = buildGrammarGraphViewModel(profile);

    expect(model.title).toBe('NeuroLex Grammar Graph');
    expect(model.nodes.find((node) => node.id === 'A1')?.status).toBe('mastered');
    expect(model.nodes.find((node) => node.id === 'B1')?.status).toBe('developing');
    expect(model.nodes.find((node) => node.id === 'B4')?.status).toBe('locked');
    expect(model.edges.length).toBeGreaterThan(0);
  });
});
