import { buildSeedLearnerProfile } from '@/services/learnerProfileSeed';

describe('buildSeedLearnerProfile', () => {
  test('seeds a B1 learner with solid foundations and developing B-zone structures', () => {
    const profile = buildSeedLearnerProfile({
      aiEngine: 'codex',
      targetLanguage: 'German',
      nativeLanguage: 'English',
      learnerLevel: 'B1',
      preferredSessionMinutes: 60,
    });

    expect(profile.grammarProgress.A1.masteryPercent).toBe(72);
    expect(profile.grammarProgress.B1.masteryPercent).toBe(18);
    expect(profile.grammarProgress.C1.masteryPercent).toBe(0);
  });

  test('normalizes early learners toward A2 seed values', () => {
    const profile = buildSeedLearnerProfile({
      aiEngine: 'claude-code',
      targetLanguage: 'German',
      nativeLanguage: 'English',
      learnerLevel: 'A2',
      preferredSessionMinutes: 45,
    });

    expect(profile.currentLevel).toBe('A2');
    expect(profile.grammarProgress.A3.masteryPercent).toBe(45);
    expect(profile.grammarProgress.B4.masteryPercent).toBe(5);
  });

  test('uses stronger B and C baselines for B2 learners', () => {
    const profile = buildSeedLearnerProfile({
      aiEngine: 'codex',
      targetLanguage: 'German',
      nativeLanguage: 'English',
      learnerLevel: 'B2',
      preferredSessionMinutes: 75,
    });

    expect(profile.grammarProgress.A4.masteryPercent).toBe(85);
    expect(profile.grammarProgress.B5.masteryPercent).toBe(62);
    expect(profile.grammarProgress.C2.masteryPercent).toBe(20);
  });
});
