export interface NeuroLexAgentDefinition {
  key: string;
  title: string;
  role: string;
  learnerFacing: boolean;
}

export const NEUROLEX_AGENTS: NeuroLexAgentDefinition[] = [
  {
    key: 'uebungsmeister',
    title: 'Uebungsmeister',
    role: 'Session conductor and learner-facing orchestrator.',
    learnerFacing: true,
  },
  {
    key: 'diagnostiker',
    title: 'Diagnostiker',
    role: 'Learner analytics, progress tracking, and avoidance detection.',
    learnerFacing: false,
  },
  {
    key: 'architekt',
    title: 'Architekt',
    role: 'Session planning and prerequisite-aware curriculum routing.',
    learnerFacing: false,
  },
  {
    key: 'mentor',
    title: 'Mentor',
    role: 'Progress recaps, guidance, and reflection output.',
    learnerFacing: false,
  },
  {
    key: 'wortmeister',
    title: 'Wortmeister',
    role: 'Vocabulary practice and spaced repetition support.',
    learnerFacing: false,
  },
  {
    key: 'grammatiktrainer',
    title: 'Grammatiktrainer',
    role: 'Grammar teaching with prerequisite enforcement and one-target tasks.',
    learnerFacing: false,
  },
  {
    key: 'korrektor',
    title: 'Korrektor',
    role: 'Correction policy and error prioritization.',
    learnerFacing: false,
  },
];
