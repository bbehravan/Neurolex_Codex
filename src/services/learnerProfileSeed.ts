import { listGrammarStructures } from '../domain/grammarGraph';
import type { GrammarProgress, LearnerProfile } from '../domain/types';

type SeedLevel = 'A2' | 'B1' | 'B2';

const LEVEL_BASELINES: Record<SeedLevel, { foundation: number; transition: number; expansion: number }> = {
  A2: { foundation: 45, transition: 5, expansion: 0 },
  B1: { foundation: 72, transition: 18, expansion: 0 },
  B2: { foundation: 85, transition: 62, expansion: 20 },
};

function normalizeSeedLevel(level: string): SeedLevel {
  const normalized = level.trim().toUpperCase();
  if (normalized.startsWith('B2')) return 'B2';
  if (normalized.startsWith('A2')) return 'A2';
  return 'B1';
}

function buildGrammarProgress(level: string): Record<string, GrammarProgress> {
  const seedLevel = normalizeSeedLevel(level);
  const baseline = LEVEL_BASELINES[seedLevel];

  return Object.fromEntries(
    listGrammarStructures().map((structure) => {
      const baseMastery = structure.zone === 'A'
        ? baseline.foundation
        : structure.zone === 'B'
          ? baseline.transition
          : baseline.expansion;

      const masteryPercent = Math.max(0, Math.min(100, baseMastery));
      const freeProductionAccuracy = Math.max(0, masteryPercent - 8);
      const opportunities = masteryPercent > 0 ? 8 : 0;
      const uses = masteryPercent >= 65 ? 5 : masteryPercent >= 20 ? 2 : masteryPercent > 0 ? 1 : 0;

      return [
        structure.id,
        {
          structureId: structure.id,
          masteryPercent,
          freeProductionAccuracy,
          opportunities,
          uses,
        },
      ];
    })
  );
}

export interface LearnerProfileSeedInput {
  aiEngine: LearnerProfile['aiEngine'];
  targetLanguage: string;
  nativeLanguage: string;
  learnerLevel: string;
  preferredSessionMinutes: number;
}

export function buildSeedLearnerProfile(input: LearnerProfileSeedInput): LearnerProfile {
  return {
    learnerId: 'primary-learner',
    aiEngine: input.aiEngine,
    targetLanguage: input.targetLanguage,
    nativeLanguage: input.nativeLanguage,
    currentLevel: input.learnerLevel,
    preferredSessionMinutes: input.preferredSessionMinutes,
    grammarProgress: buildGrammarProgress(input.learnerLevel),
  };
}
