import type { VaultFileAdapter } from '../core/storage/VaultFileAdapter';
import { listGrammarStructures } from '../domain/grammarGraph';
import type { GrammarProgress, LearnerProfile } from '../domain/types';
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

function deriveOpportunities(masteryPercent: number, previous?: GrammarProgress): number {
  if (previous && previous.opportunities > 0) return previous.opportunities;
  return masteryPercent > 0 ? 8 : 0;
}

function deriveUses(masteryPercent: number, previous?: GrammarProgress): number {
  if (previous && previous.uses > 0) return previous.uses;
  if (masteryPercent >= 65) return 5;
  if (masteryPercent >= 20) return 2;
  if (masteryPercent > 0) return 1;
  return 0;
}

const KNOWN_GRAMMAR_IDS = new Set(listGrammarStructures().map((structure) => structure.id));

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

  getCalibrationNotePath(): string {
    return `${this.getNotesRoot()}system/learner-calibration.md`;
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

  async writeCalibrationNote(profile?: LearnerProfile): Promise<string> {
    const learnerProfile = profile ?? await this.ensureLearnerProfile();
    const path = this.getCalibrationNotePath();
    await this.vault.write(path, this.buildCalibrationMarkdown(learnerProfile));
    return path;
  }

  async applyCalibrationNote(): Promise<LearnerProfile> {
    const path = this.getCalibrationNotePath();
    if (!(await this.vault.exists(path))) {
      throw new Error(`Calibration note not found at ${path}`);
    }

    const profile = await this.ensureLearnerProfile();
    const raw = await this.vault.read(path);
    const calibrated = this.applyCalibrationMarkdown(profile, raw);
    await this.saveLearnerProfile(calibrated);
    return calibrated;
  }

  private syncProfileWithSettings(profile: LearnerProfile): LearnerProfile {
    return {
      ...profile,
      aiEngine: this.settings.aiEngine,
      targetLanguage: this.settings.targetLanguage,
      nativeLanguage: this.settings.nativeLanguage,
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
      `- Active Lernauftrag: ${profile.activeLernauftrag || 'None'}`,
      '',
      '## Grammar Coverage',
      `- Mastered structures (>=65%): ${mastered}/${tracked}`,
      `- Developing structures: ${tracked - mastered}`,
      '',
      '## Storage',
      `- Machine-readable profile: ${this.getProfileJsonPath()}`,
      `- Calibration note: ${this.getCalibrationNotePath()}`,
      '',
    ].join('\n');
  }

  private buildCalibrationMarkdown(profile: LearnerProfile): string {
    const grouped = ['A', 'B', 'C'].map((zone) => {
      const lines = listGrammarStructures(zone as 'A' | 'B' | 'C')
        .map((structure) => {
          const progress = profile.grammarProgress[structure.id];
          const mastery = progress?.masteryPercent ?? 0;
          return `- ${structure.id}: ${mastery}  # ${structure.title}`;
        })
        .join('\n');
      return `### Zone ${zone}\n${lines}`;
    }).join('\n\n');

    return [
      '---',
      'title: "NeuroLex Calibration"',
      'type: learner-calibration',
      `learner_id: ${profile.learnerId}`,
      '---',
      '',
      '# NeuroLex Calibration',
      '',
      'Edit the values below, then run the "Apply NeuroLex calibration note" command.',
      '',
      '## Editable Snapshot',
      `- learner_level: ${profile.currentLevel}`,
      `- session_duration_minutes: ${profile.preferredSessionMinutes}`,
      `- active_lernauftrag: ${profile.activeLernauftrag || ''}`,
      '',
      '## Grammar Mastery',
      grouped,
      '',
      '## Notes',
      '- Use percentages from 0 to 100.',
      '- Leave `active_lernauftrag` blank if there is no current real-life goal.',
      '- Unknown grammar IDs are ignored when the calibration is applied.',
      '',
    ].join('\n');
  }

  private applyCalibrationMarkdown(profile: LearnerProfile, markdown: string): LearnerProfile {
    const scalarValue = (key: string): string | undefined => {
      const match = markdown.match(new RegExp(`^- ${key}:\\s*(.*)$`, 'm'));
      return match ? match[1].trim() : undefined;
    };

    const learnerLevel = scalarValue('learner_level');
    const sessionDurationRaw = scalarValue('session_duration_minutes');
    const activeLernauftragRaw = scalarValue('active_lernauftrag');

    const updatedGrammarProgress = { ...profile.grammarProgress };
    const grammarLinePattern = /^- ([ABC]\d+):\s*(\d{1,3})(?:\s+#.*)?$/gm;
    let match: RegExpExecArray | null;

    while ((match = grammarLinePattern.exec(markdown)) !== null) {
      const [, structureId, masteryRaw] = match;
      if (!KNOWN_GRAMMAR_IDS.has(structureId)) {
        continue;
      }
      const masteryPercent = Math.max(0, Math.min(100, Number.parseInt(masteryRaw, 10)));
      const previous = updatedGrammarProgress[structureId];

      updatedGrammarProgress[structureId] = {
        structureId,
        masteryPercent,
        freeProductionAccuracy: Math.max(0, masteryPercent - 8),
        opportunities: deriveOpportunities(masteryPercent, previous),
        uses: deriveUses(masteryPercent, previous),
      };
    }

    return {
      ...profile,
      currentLevel: learnerLevel || profile.currentLevel,
      preferredSessionMinutes: sessionDurationRaw
        ? Math.max(15, Number.parseInt(sessionDurationRaw, 10) || profile.preferredSessionMinutes)
        : profile.preferredSessionMinutes,
      activeLernauftrag: activeLernauftragRaw || undefined,
      grammarProgress: updatedGrammarProgress,
    };
  }
}
