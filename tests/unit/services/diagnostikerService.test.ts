import type { LearnerProfile } from '@/domain/types';
import { DiagnostikerService } from '@/services/diagnostikerService';

function createVaultStub(initialFiles: Record<string, string> = {}) {
  const files = new Map(Object.entries(initialFiles));

  return {
    files,
    adapter: {
      exists: jest.fn(async (path: string) => files.has(path)),
      read: jest.fn(async (path: string) => {
        const value = files.get(path);
        if (value === undefined) throw new Error(`Missing file: ${path}`);
        return value;
      }),
      write: jest.fn(async (path: string, content: string) => {
        files.set(path, content);
      }),
    },
  };
}

describe('DiagnostikerService', () => {
  const baseSettings = {
    aiEngine: 'codex' as const,
    targetLanguage: 'German',
    nativeLanguage: 'English',
    learnerLevel: 'B1',
    preferredSessionMinutes: 60,
    notesFolder: 'neurolex/',
  };

  test('seeds and persists a learner profile when none exists', async () => {
    const vault = createVaultStub();
    const service = new DiagnostikerService(vault.adapter, baseSettings);

    const profile = await service.ensureLearnerProfile();

    expect(profile.learnerId).toBe('primary-learner');
    expect(vault.files.has('neurolex/system/learner-profile.json')).toBe(true);
    expect(vault.files.has('neurolex/system/learner-profile.md')).toBe(true);
  });

  test('loads an existing learner profile and syncs settings-driven metadata', async () => {
    const existingProfile: LearnerProfile = {
      learnerId: 'primary-learner',
      aiEngine: 'claude-code',
      targetLanguage: 'German',
      nativeLanguage: 'English',
      currentLevel: 'A2',
      preferredSessionMinutes: 30,
      grammarProgress: {
        A1: { structureId: 'A1', masteryPercent: 80, freeProductionAccuracy: 72, opportunities: 10, uses: 6 },
      },
    };
    const vault = createVaultStub({
      'neurolex/system/learner-profile.json': JSON.stringify(existingProfile),
    });
    const service = new DiagnostikerService(vault.adapter, baseSettings);

    const profile = await service.ensureLearnerProfile();

    expect(profile.aiEngine).toBe('codex');
    expect(profile.currentLevel).toBe('B1');
    expect(profile.grammarProgress.A1.masteryPercent).toBe(80);
  });
});
