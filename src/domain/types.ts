export type AiEngine = 'claude-code' | 'codex';
export type GrammarZone = 'A' | 'B' | 'C';
export type GrammarPriority = 'low' | 'medium' | 'high' | 'highest';

export interface GrammarStructure {
  id: string;
  zone: GrammarZone;
  title: string;
  prerequisites: string[];
  priority: GrammarPriority;
  summary: string;
}

export interface GrammarProgress {
  structureId: string;
  masteryPercent: number;
  freeProductionAccuracy: number;
  opportunities: number;
  uses: number;
  diagnosticNote?: string;
}

export interface AvoidanceSignal {
  structureId: string;
  status: 'monitoring' | 'flagged';
  note?: string;
}

export interface LearnerTask {
  title: string;
  deadline?: string;
  structures: string[];
  notes?: string;
}

export interface LearnerProfile {
  learnerId: string;
  aiEngine: AiEngine;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: string;
  preferredSessionMinutes: number;
  activeLernauftrag?: string;
  avoidanceSignals: AvoidanceSignal[];
  upcomingTasks: LearnerTask[];
  grammarProgress: Record<string, GrammarProgress>;
}

export interface SessionPhase {
  key: 'warmup' | 'core' | 'application' | 'cooldown';
  title: string;
  durationMinutes: number;
  module: string;
  objective: string;
}

export interface SessionFocusSelection {
  structureId: string;
  title: string;
  reasons: string[];
  exerciseRecommendations: string[];
}

export interface SessionPlan {
  learnerId: string;
  generatedAt: string;
  aiEngine: AiEngine;
  targetLanguage: string;
  applicationMode: 'writing' | 'speaking';
  curationBrief: string;
  focusStructures: string[];
  focusSelections: SessionFocusSelection[];
  notesFolder: string;
  phases: SessionPhase[];
}

export interface SessionSummary {
  learnerId: string;
  generatedAt: string;
  targetLanguage: string;
  focusStructures: string[];
  wins: string[];
  watchItems: string[];
  nextActions: string[];
  reflectionPrompt: string;
}

export interface SessionArtifact {
  kind:
    | 'session-plan'
    | 'warmup-vocabulary'
    | 'grammar-core'
    | 'curation-brief'
    | 'writing-application'
    | 'speaking-application'
    | 'correction-guide'
    | 'session-recap'
    | 'session-run';
  path: string;
  content: string;
}

export interface SessionRun {
  sessionId: string;
  generatedAt: string;
  plan: SessionPlan;
  summary: SessionSummary;
  artifacts: SessionArtifact[];
}
