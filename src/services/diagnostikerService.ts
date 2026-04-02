import type { VaultFileAdapter } from '../core/storage/VaultFileAdapter';
import { listGrammarStructures } from '../domain/grammarGraph';
import type { AvoidanceSignal, GrammarProgress, LearnerProfile, LearnerTask } from '../domain/types';
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

function countDiagnosticNotes(profile: LearnerProfile): number {
  return Object.values(profile.grammarProgress).filter((progress) => Boolean(progress.diagnosticNote?.trim())).length;
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

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
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
      avoidanceSignals: profile.avoidanceSignals ?? [],
      upcomingTasks: profile.upcomingTasks ?? [],
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
      '## Stored Diagnostics',
      `- Avoidance signals: ${profile.avoidanceSignals.length}`,
      `- Upcoming tasks: ${profile.upcomingTasks.length}`,
      `- Structure notes: ${countDiagnosticNotes(profile)}`,
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
      '## Avoidance Signals',
      profile.avoidanceSignals.length > 0
        ? profile.avoidanceSignals.map((signal) =>
          `- ${signal.structureId}: ${signal.status}${signal.note ? ` | ${signal.note}` : ''}`
        ).join('\n')
        : '- none',
      '',
      '## Upcoming Tasks',
      profile.upcomingTasks.length > 0
        ? profile.upcomingTasks.map((task) =>
          `- title: ${task.title} | deadline: ${task.deadline || ''} | structures: ${task.structures.join(', ')}${task.notes ? ` | notes: ${task.notes}` : ''}`
        ).join('\n')
        : '- none',
      '',
      '## Structure Diagnostics',
      Object.values(profile.grammarProgress).some((progress) => progress.diagnosticNote?.trim())
        ? listGrammarStructures()
          .map((structure) => {
            const diagnosticNote = profile.grammarProgress[structure.id]?.diagnosticNote?.trim();
            return diagnosticNote ? `- ${structure.id}: ${diagnosticNote}` : null;
          })
          .filter(isDefined)
          .join('\n')
        : '- none',
      '',
      '## Grammar Mastery',
      grouped,
      '',
      '## Notes',
      '- Use percentages from 0 to 100.',
      '- Leave `active_lernauftrag` blank if there is no current real-life goal.',
      '- Avoidance signal format: `- B4: flagged | avoids subordinate clauses in speech`.',
      '- Upcoming task format: `- title: Job interview | deadline: 2026-04-10 | structures: B4, B5 | notes: formal answers`.',
      '- Structure diagnostic format: `- B4: verb-final word order breaks under pressure`.',
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
    const avoidanceSignals = this.parseAvoidanceSignals(markdown);
    const upcomingTasks = this.parseUpcomingTasks(markdown);
    const structureDiagnosticNotes = this.parseStructureDiagnosticNotes(markdown);

    const updatedGrammarProgress = Object.fromEntries(
      Object.entries(profile.grammarProgress).map(([structureId, progress]) => [
        structureId,
        {
          ...progress,
          diagnosticNote: structureDiagnosticNotes[structureId],
        },
      ])
    );
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
        diagnosticNote: structureDiagnosticNotes[structureId],
      };
    }

    return {
      ...profile,
      currentLevel: learnerLevel || profile.currentLevel,
      preferredSessionMinutes: sessionDurationRaw
        ? Math.max(15, Number.parseInt(sessionDurationRaw, 10) || profile.preferredSessionMinutes)
        : profile.preferredSessionMinutes,
      activeLernauftrag: activeLernauftragRaw || undefined,
      avoidanceSignals,
      upcomingTasks,
      grammarProgress: updatedGrammarProgress,
    };
  }

  private parseAvoidanceSignals(markdown: string): AvoidanceSignal[] {
    const section = markdown.match(/## Avoidance Signals([\s\S]*?)(?:\n## |\s*$)/);
    if (!section) return [];

    return section[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- ') && line !== '- none')
      .map((line) => line.slice(2))
      .map((line): AvoidanceSignal | null => {
        const [left, note] = line.split('|').map((part) => part.trim());
        const [structureId, statusRaw] = left.split(':').map((part) => part.trim());
        if (!KNOWN_GRAMMAR_IDS.has(structureId)) return null;
        const status = statusRaw === 'flagged' ? 'flagged' : statusRaw === 'monitoring' ? 'monitoring' : null;
        if (!status) return null;
        return { structureId, status, note: note || undefined };
      })
      .filter(isDefined);
  }

  private parseUpcomingTasks(markdown: string): LearnerTask[] {
    const section = markdown.match(/## Upcoming Tasks([\s\S]*?)(?:\n## |\s*$)/);
    if (!section) return [];

    return section[1]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- ') && line !== '- none')
      .map((line) => line.slice(2))
      .map((line): LearnerTask | null => {
        const fields = Object.fromEntries(
          line.split('|')
            .map((part) => part.trim())
            .map((part) => {
              const [key, value] = part.split(':').map((piece) => piece.trim());
              return [key, value ?? ''];
            })
        );
        const title = fields.title;
        if (!title) return null;
        return {
          title,
          deadline: fields.deadline || undefined,
          structures: parseCommaSeparated(fields.structures).filter((structureId) => KNOWN_GRAMMAR_IDS.has(structureId)),
          notes: fields.notes || undefined,
        };
      })
      .filter(isDefined);
  }

  private parseStructureDiagnosticNotes(markdown: string): Record<string, string> {
    const section = markdown.match(/## Structure Diagnostics([\s\S]*?)(?:\n## |\s*$)/);
    if (!section) return {};

    return Object.fromEntries(
      section[1]
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('- ') && line !== '- none')
        .map((line) => line.slice(2))
        .map((line): [string, string] | null => {
          const separatorIndex = line.indexOf(':');
          if (separatorIndex === -1) return null;
          const structureId = line.slice(0, separatorIndex).trim();
          const note = line.slice(separatorIndex + 1).trim();
          if (!KNOWN_GRAMMAR_IDS.has(structureId) || !note) return null;
          return [structureId, note];
        })
        .filter(isDefined)
    );
  }
}
