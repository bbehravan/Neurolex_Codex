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
}

export interface LearnerProfile {
  learnerId: string;
  aiEngine: AiEngine;
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: string;
  preferredSessionMinutes: number;
  activeLernauftrag?: string;
  grammarProgress: Record<string, GrammarProgress>;
}

export interface SessionPhase {
  key: 'warmup' | 'core' | 'application' | 'cooldown';
  title: string;
  durationMinutes: number;
  module: string;
  objective: string;
}

export interface SessionPlan {
  learnerId: string;
  generatedAt: string;
  aiEngine: AiEngine;
  targetLanguage: string;
  focusStructures: string[];
  notesFolder: string;
  phases: SessionPhase[];
}
