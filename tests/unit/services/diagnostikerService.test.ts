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
    expect(profile.avoidanceSignals).toEqual([]);
    expect(profile.upcomingTasks).toEqual([]);
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
      avoidanceSignals: [],
      upcomingTasks: [],
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
    expect(profile.currentLevel).toBe('A2');
    expect(profile.grammarProgress.A1.masteryPercent).toBe(80);
  });

  test('writes a calibration note with editable snapshot and grammar lines', async () => {
    const vault = createVaultStub();
    const service = new DiagnostikerService(vault.adapter, baseSettings);

    const path = await service.writeCalibrationNote();
    const calibration = vault.files.get(path);

    expect(path).toBe('neurolex/system/learner-calibration.md');
    expect(calibration).toContain('# NeuroLex Calibration');
    expect(calibration).toContain('- learner_level: B1');
    expect(calibration).toContain('## Avoidance Signals');
    expect(calibration).toContain('## Upcoming Tasks');
    expect(calibration).toContain('## Structure Diagnostics');
    expect(calibration).toContain('- B1: 18  # Dative Case');
  });

  test('applies calibration edits back into the learner profile', async () => {
    const vault = createVaultStub();
    const service = new DiagnostikerService(vault.adapter, baseSettings);

    await service.ensureLearnerProfile();
    await service.writeCalibrationNote();

    const calibrationPath = service.getCalibrationNotePath();
    const editedCalibration = [
      '---',
      'title: "NeuroLex Calibration"',
      'type: learner-calibration',
      'learner_id: primary-learner',
      '---',
      '',
      '# NeuroLex Calibration',
      '',
      '## Editable Snapshot',
      '- learner_level: B2',
      '- session_duration_minutes: 75',
      '- active_lernauftrag: Write a formal email to my landlord.',
      '',
      '## Avoidance Signals',
      '- B4: flagged | avoids subordinate clauses in speech',
      '- B5: monitoring | polite requests still rare',
      '',
      '## Upcoming Tasks',
      '- title: Job interview | deadline: 2026-04-10 | structures: B4, B5 | notes: formal answers',
      '',
      '## Structure Diagnostics',
      '- B4: verb-final word order breaks under pressure',
      '- B5: polite requests collapse into direct commands',
      '',
      '## Grammar Mastery',
      '### Zone A',
      '- A1: 85  # Present Tense',
      '### Zone B',
      '- B1: 62  # Dative Case',
      '- B4: 58  # Subordinate Clause Word Order',
      '### Zone C',
      '- C1: 15  # Passive Voice',
      '',
    ].join('\n');
    vault.files.set(calibrationPath, editedCalibration);

    const profile = await service.applyCalibrationNote();

    expect(profile.currentLevel).toBe('B2');
    expect(profile.preferredSessionMinutes).toBe(75);
    expect(profile.activeLernauftrag).toBe('Write a formal email to my landlord.');
    expect(profile.avoidanceSignals).toEqual([
      { structureId: 'B4', status: 'flagged', note: 'avoids subordinate clauses in speech' },
      { structureId: 'B5', status: 'monitoring', note: 'polite requests still rare' },
    ]);
    expect(profile.upcomingTasks).toEqual([
      {
        title: 'Job interview',
        deadline: '2026-04-10',
        structures: ['B4', 'B5'],
        notes: 'formal answers',
      },
    ]);
    expect(profile.grammarProgress.B4.diagnosticNote).toBe('verb-final word order breaks under pressure');
    expect(profile.grammarProgress.B5.diagnosticNote).toBe('polite requests collapse into direct commands');
    expect(profile.grammarProgress.B1.masteryPercent).toBe(62);
    expect(profile.grammarProgress.C1.masteryPercent).toBe(15);
    expect(vault.files.get(service.getProfileNotePath())).toContain('Active Lernauftrag: Write a formal email to my landlord.');
    expect(vault.files.get(service.getProfileNotePath())).toContain('Avoidance signals: 2');
    expect(vault.files.get(service.getProfileNotePath())).toContain('Structure notes: 2');
  });
});
