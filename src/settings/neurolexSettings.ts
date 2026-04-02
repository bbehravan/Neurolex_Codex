import type { AiEngine } from '../domain/types';

export interface NeuroLexSettings {
  aiEngine: AiEngine;
  targetLanguage: string;
  nativeLanguage: string;
  learnerLevel: string;
  sessionDurationMinutes: number;
  notesFolder: string;
  mongoConnection: string;
  voyageServer: string;
}

export const DEFAULT_NEUROLEX_SETTINGS: NeuroLexSettings = {
  aiEngine: 'claude-code',
  targetLanguage: 'German',
  nativeLanguage: 'English',
  learnerLevel: 'B1',
  sessionDurationMinutes: 60,
  notesFolder: 'neurolex/',
  mongoConnection: 'mongodb://localhost:27017/neurolex',
  voyageServer: 'auto-detect',
};
