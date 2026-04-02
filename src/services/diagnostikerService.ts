import type { VaultFileAdapter } from '../core/storage/VaultFileAdapter';
import type { LearnerProfile } from '../domain/types';
import { buildSeedLearnerProfile } from './learnerProfileSeed';

export interface DiagnostikerSettings {
  aiEngine: LearnerProfile['aiEngine'];
  targetLanguage: string;
  nativeLanguage: string;
  learnerLevel: string;
  preferredSessionMinutes: number;
  notesFolder: string;
}

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function countMasteredStructures(profile: LearnerProfile): number {
  return Object.values(profile.grammarProgress).filter((progress) => progress.masteryPercent >= 65).length;
}

export class DiagnostikerService {
  constructor(
    private readonly vault: Pick<VaultFileAdapter, 'exists' | 'read' | 'write'>,
    private readonly settings: DiagnostikerSettings
  ) {}

  getNotesRoot(): string {
    return normalizeNotesRoot(this.settings.notesFolder);
  }

  getProfileJsonPath(): string {
    return `${this.getNotesRoot()}system/learner-profile.json`;
  }

  getProfileNotePath(): string {
    return `${this.getNotesRoot()}system/learner-profile.md`;
  }

  async loadLearnerProfile(): Promise<LearnerProfile | null> {
    if (!(await this.vault.exists(this.getProfileJsonPath()))) {
      return null;
    }

    try {
      const raw = await this.vault.read(this.getProfileJsonPath());
      const parsed = JSON.parse(raw) as LearnerProfile;
      if (!parsed || typeof parsed !== 'object' || !parsed.learnerId || !parsed.grammarProgress) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  async ensureLearnerProfile(): Promise<LearnerProfile> {
    const existing = await this.loadLearnerProfile();
    const profile = existing
      ? this.syncProfileWithSettings(existing)
      : buildSeedLearnerProfile({
        aiEngine: this.settings.aiEngine,
        targetLanguage: this.settings.targetLanguage,
        nativeLanguage: this.settings.nativeLanguage,
        learnerLevel: this.settings.learnerLevel,
        preferredSessionMinutes: this.settings.preferredSessionMinutes,
      });

    await this.saveLearnerProfile(profile);
    return profile;
  }

  async saveLearnerProfile(profile: LearnerProfile): Promise<void> {
    await this.vault.write(this.getProfileJsonPath(), `${JSON.stringify(profile, null, 2)}\n`);
    await this.vault.write(this.getProfileNotePath(), this.buildProfileMarkdown(profile));
  }

  private syncProfileWithSettings(profile: LearnerProfile): LearnerProfile {
    return {
      ...profile,
      aiEngine: this.settings.aiEngine,
      targetLanguage: this.settings.targetLanguage,
      nativeLanguage: this.settings.nativeLanguage,
      currentLevel: this.settings.learnerLevel,
      preferredSessionMinutes: this.settings.preferredSessionMinutes,
    };
  }

  private buildProfileMarkdown(profile: LearnerProfile): string {
    const mastered = countMasteredStructures(profile);
    const tracked = Object.keys(profile.grammarProgress).length;

    return [
      '---',
      'title: "NeuroLex Learner Profile"',
      'type: learner-profile',
      `learner_id: ${profile.learnerId}`,
      `target_language: ${profile.targetLanguage}`,
      `native_language: ${profile.nativeLanguage}`,
      `learner_level: ${profile.currentLevel}`,
      `ai_engine: ${profile.aiEngine}`,
      '---',
      '',
      '# NeuroLex Learner Profile',
      '',
      '## Snapshot',
      `- Target language: ${profile.targetLanguage}`,
      `- Native language: ${profile.nativeLanguage}`,
      `- Current level: ${profile.currentLevel}`,
      `- Preferred session duration: ${profile.preferredSessionMinutes} min`,
      `- AI engine: ${profile.aiEngine}`,
      '',
      '## Grammar Coverage',
      `- Mastered structures (>=65%): ${mastered}/${tracked}`,
      `- Developing structures: ${tracked - mastered}`,
      '',
      '## Storage',
      `- Machine-readable profile: ${this.getProfileJsonPath()}`,
      '',
    ].join('\n');
  }
}
