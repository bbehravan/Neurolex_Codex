import type { LearnerProfile, SessionPlan } from '../domain/types';
import { buildSessionPlan } from './sessionPlanner';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

export class ArchitektService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildPlan(profile: LearnerProfile): SessionPlan {
    return buildSessionPlan(profile, {
      notesFolder: this.getNotesRoot(),
    });
  }

  buildSessionPlanArtifact(profile: LearnerProfile, now = new Date()): {
    plan: SessionPlan;
    path: string;
    content: string;
  } {
    const generatedAt = now.toISOString();
    const plan = buildSessionPlan(profile, {
      generatedAt,
      notesFolder: this.getNotesRoot(),
    });
    const isoDay = generatedAt.slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = generatedAt.replace(/[:]/g, '-');
    const path = `${this.getNotesRoot()}sessions/${monthKey}/session-plan-${timestamp}.md`;
    const phases = plan.phases
      .map((phase) => `## ${phase.title}\n- Duration: ${phase.durationMinutes} min\n- Module: ${phase.module}\n- Objective: ${phase.objective}`)
      .join('\n\n');
    const focusStructures = plan.focusStructures.length > 0
      ? plan.focusStructures.map((structureId) => `- ${structureId}`).join('\n')
      : '- Calibration needed';
    const focusRationale = plan.focusSelections.length > 0
      ? plan.focusSelections.map((selection) => {
        const reasons = selection.reasons.map((reason) => `  - ${reason}`).join('\n');
        return `- ${selection.structureId} (${selection.title})\n${reasons}`;
      }).join('\n')
      : '- No focus rationale available.';

    const content = [
      '---',
      'title: "NeuroLex Session Plan"',
      'type: session-plan',
      `date: ${isoDay}`,
      `learner_level: ${profile.currentLevel}`,
      `target_language: ${profile.targetLanguage}`,
      `ai_engine: ${profile.aiEngine}`,
      `notes_folder: ${plan.notesFolder}`,
      '---',
      '',
      '# NeuroLex Session Plan',
      '',
      '## Focus Structures',
      focusStructures,
      '',
      '## Focus Rationale',
      focusRationale,
      '',
      phases,
      '',
      '## Planner Context',
      `- Native language: ${profile.nativeLanguage}`,
      `- Session duration: ${profile.preferredSessionMinutes} min`,
      `- Notes folder: ${plan.notesFolder}`,
      '',
    ].join('\n');

    return { plan, path, content };
  }
}
