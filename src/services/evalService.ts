import type { SessionArtifact, SessionEvaluation, SessionRun } from '../domain/types';

function normalizeNotesRoot(notesFolder: string): string {
  const trimmed = notesFolder.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `${trimmed}/` : 'neurolex/';
}

function buildTimestamp(generatedAt: string): string {
  return generatedAt.replace(/[:]/g, '-');
}

function hasArtifact(run: SessionRun, kind: SessionArtifact['kind']): boolean {
  return run.artifacts.some((artifact) => artifact.kind === kind);
}

export class EvalService {
  constructor(private readonly notesFolder: string) {}

  private getNotesRoot(): string {
    return normalizeNotesRoot(this.notesFolder);
  }

  buildEvaluation(run: SessionRun): SessionEvaluation {
    const notes: string[] = [];
    const requiredKinds: SessionArtifact['kind'][] = [
      'session-plan',
      'warmup-vocabulary',
      'grammar-core',
      'correction-guide',
      'session-recap',
      'session-run',
    ];

    const missingRequired = requiredKinds.filter((kind) => !hasArtifact(run, kind));
    const completenessScore = Math.max(0, 100 - missingRequired.length * 20);
    if (missingRequired.length === 0) {
      notes.push('All core session artifacts are present.');
    } else {
      notes.push(`Missing required artifacts: ${missingRequired.join(', ')}.`);
    }

    const expectedApplicationKind = run.plan.applicationMode === 'writing'
      ? 'writing-application'
      : 'speaking-application';
    const hasExpectedApplication = hasArtifact(run, expectedApplicationKind);
    const hasCuration = hasArtifact(run, 'curation-brief');
    const adaptationScore = (hasExpectedApplication ? 60 : 0) + (hasCuration ? 40 : 0);
    if (hasExpectedApplication && hasCuration) {
      notes.push(`Application mode "${run.plan.applicationMode}" is backed by curation and a matching learner-facing task.`);
    } else {
      notes.push('Application-mode adaptation is incomplete.');
    }

    const nextActions = run.summary.nextActions.length;
    const focusCount = run.plan.focusSelections.length || 1;
    const coverageScore = Math.min(100, Math.round((nextActions / focusCount) * 50) + 50);
    notes.push(`Coverage score reflects ${nextActions} next action${nextActions === 1 ? '' : 's'} across ${focusCount} focus target${focusCount === 1 ? '' : 's'}.`);

    return {
      completenessScore,
      adaptationScore,
      coverageScore,
      notes,
    };
  }

  buildEvaluationArtifact(run: SessionRun): SessionArtifact {
    const evaluation = this.buildEvaluation(run);
    const isoDay = run.generatedAt.slice(0, 10);
    const monthKey = isoDay.slice(0, 7);
    const timestamp = buildTimestamp(run.generatedAt);
    const path = `${this.getNotesRoot()}sessions/${monthKey}/session-eval-${timestamp}.md`;
    const content = [
      '---',
      'title: "NeuroLex Session Evaluation"',
      'type: session-eval',
      `date: ${isoDay}`,
      `session_id: ${run.sessionId}`,
      '---',
      '',
      '# NeuroLex Session Evaluation',
      '',
      '## Scores',
      `- Completeness: ${evaluation.completenessScore}`,
      `- Adaptation: ${evaluation.adaptationScore}`,
      `- Coverage: ${evaluation.coverageScore}`,
      '',
      '## Notes',
      ...evaluation.notes.map((note) => `- ${note}`),
      '',
    ].join('\n');

    return {
      kind: 'session-eval',
      path,
      content,
    };
  }
}
