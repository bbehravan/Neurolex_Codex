import type { LearnerProfile, SessionPlan } from '../domain/types';
import { buildSessionPlan } from './sessionPlanner';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function formatDiagnosticsContext(profile: LearnerProfile, focusStructures: string[]): string {
  const focusSet = new Set(focusStructures);
  const relevantAvoidanceSignals = profile.avoidanceSignals
    .filter((signal) => focusSet.has(signal.structureId));
  const relevantUpcomingTasks = profile.upcomingTasks
    .filter((task) => task.structures.some((structureId) => focusSet.has(structureId)));

  const diagnostics: string[] = [
    `- Active Lernauftrag: ${profile.activeLernauftrag || 'none'}`,
  ];

  if (relevantAvoidanceSignals.length > 0) {
    diagnostics.push(
      ...relevantAvoidanceSignals.map((signal) =>
        `- Avoidance signal: ${signal.structureId} is ${signal.status}${signal.note ? ` (${signal.note})` : ''}`
      )
    );
  } else {
    diagnostics.push('- Avoidance signals tied to this plan: none');
  }

  if (relevantUpcomingTasks.length > 0) {
    diagnostics.push(
      ...relevantUpcomingTasks.map((task) => {
        const relevantStructures = task.structures.filter((structureId) => focusSet.has(structureId));
        const deadline = task.deadline ? ` | deadline: ${task.deadline}` : '';
        const notes = task.notes ? ` | notes: ${task.notes}` : '';
        return `- Upcoming task: ${task.title}${deadline} | relevant structures: ${relevantStructures.join(', ')}${notes}`;
      })
    );
  } else {
    diagnostics.push('- Upcoming tasks tied to this plan: none');
  }

  return diagnostics.join('\n');
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
    const diagnosticsContext = formatDiagnosticsContext(profile, plan.focusStructures);

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
      '## Diagnostics Context',
      diagnosticsContext,
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
