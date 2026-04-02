import type { SessionRun } from '../domain/types';

export interface SessionViewMetric {
  label: string;
  value: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

export interface SessionViewModel {
  title: string;
  generatedAt: string;
  applicationMode: string;
  focusStructures: string[];
  metrics: SessionViewMetric[];
  artifactPaths: string[];
  reflectionPrompt: string;
}

export function buildSessionViewModel(run: SessionRun): SessionViewModel {
  const metrics: SessionViewMetric[] = [
    {
      label: 'Application',
      value: run.plan.applicationMode,
      tone: 'neutral',
    },
    {
      label: 'Focus Count',
      value: String(run.plan.focusSelections.length),
      tone: run.plan.focusSelections.length > 0 ? 'positive' : 'warning',
    },
  ];

  if (run.evaluation) {
    metrics.push(
      {
        label: 'Completeness',
        value: String(run.evaluation.completenessScore),
        tone: run.evaluation.completenessScore >= 90 ? 'positive' : 'warning',
      },
      {
        label: 'Adaptation',
        value: String(run.evaluation.adaptationScore),
        tone: run.evaluation.adaptationScore >= 80 ? 'positive' : 'warning',
      }
    );
  }

  return {
    title: 'NeuroLex Session View',
    generatedAt: run.generatedAt,
    applicationMode: run.plan.applicationMode,
    focusStructures: run.plan.focusStructures,
    metrics,
    artifactPaths: run.artifacts.map((artifact) => artifact.path),
    reflectionPrompt: run.summary.reflectionPrompt,
  };
}
