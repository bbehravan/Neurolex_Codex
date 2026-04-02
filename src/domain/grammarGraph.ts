import type { GrammarPriority, GrammarStructure, GrammarZone } from './types';

const PRIORITY_WEIGHT: Record<GrammarPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  highest: 4,
};

export const GRAMMAR_STRUCTURES: GrammarStructure[] = [
  {
    id: 'A1',
    zone: 'A',
    title: 'Present Tense',
    prerequisites: [],
    priority: 'medium',
    summary: 'Regular and high-frequency irregular present tense forms.',
  },
  {
    id: 'A2',
    zone: 'A',
    title: 'Nominative and Accusative',
    prerequisites: [],
    priority: 'medium',
    summary: 'Articles and personal pronouns in nominative and accusative.',
  },
  {
    id: 'A3',
    zone: 'A',
    title: 'Basic Word Order',
    prerequisites: [],
    priority: 'medium',
    summary: 'Verb-second rule in main clauses.',
  },
  {
    id: 'A4',
    zone: 'A',
    title: 'Perfekt',
    prerequisites: ['A1'],
    priority: 'medium',
    summary: 'Present perfect with regular and common irregular verbs.',
  },
  {
    id: 'A5',
    zone: 'A',
    title: 'Modal Verbs',
    prerequisites: ['A1', 'A3'],
    priority: 'medium',
    summary: 'Present tense modal usage with infinitive structure.',
  },
  {
    id: 'A6',
    zone: 'A',
    title: 'Separable Verbs',
    prerequisites: ['A1', 'A3'],
    priority: 'medium',
    summary: 'Common separable verbs in present tense clauses.',
  },
  {
    id: 'B1',
    zone: 'B',
    title: 'Dative Case',
    prerequisites: ['A2'],
    priority: 'highest',
    summary: 'Articles, pronouns, and prepositions that require dative.',
  },
  {
    id: 'B2',
    zone: 'B',
    title: 'Two-Way Prepositions',
    prerequisites: ['A2', 'B1'],
    priority: 'high',
    summary: 'Wechselpraepositionen with movement versus location meaning.',
  },
  {
    id: 'B3',
    zone: 'B',
    title: 'Praeteritum',
    prerequisites: ['A4'],
    priority: 'medium',
    summary: 'Narrative past for common verbs and storytelling contexts.',
  },
  {
    id: 'B4',
    zone: 'B',
    title: 'Subordinate Clause Word Order',
    prerequisites: ['A3'],
    priority: 'highest',
    summary: 'Verb-final structure for subordinating conjunctions.',
  },
  {
    id: 'B5',
    zone: 'B',
    title: 'Konjunktiv II Polite Forms',
    prerequisites: ['A5', 'B4'],
    priority: 'high',
    summary: 'Functional polite requests with haette, waere, koennte, and wuerde.',
  },
  {
    id: 'B6',
    zone: 'B',
    title: 'Adjective Declension',
    prerequisites: ['A2', 'B1'],
    priority: 'medium',
    summary: 'Adjective endings across article patterns and case contexts.',
  },
  {
    id: 'B7',
    zone: 'B',
    title: 'Relative Clauses',
    prerequisites: ['B4', 'B6'],
    priority: 'medium',
    summary: 'Relative pronouns with clause-final verb placement.',
  },
  {
    id: 'B8',
    zone: 'B',
    title: 'Reflexive Verbs',
    prerequisites: ['A1', 'B1'],
    priority: 'low',
    summary: 'High-frequency reflexive patterns in everyday German.',
  },
  {
    id: 'C1',
    zone: 'C',
    title: 'Passive Voice',
    prerequisites: ['B4', 'A4'],
    priority: 'medium',
    summary: 'Vorgangspassiv for reports and process descriptions.',
  },
  {
    id: 'C2',
    zone: 'C',
    title: 'Genitive Case',
    prerequisites: ['B1', 'B6'],
    priority: 'medium',
    summary: 'Genitive structures and common written-register usage.',
  },
  {
    id: 'C3',
    zone: 'C',
    title: 'Konjunktiv II Hypotheticals',
    prerequisites: ['B5'],
    priority: 'medium',
    summary: 'Extended hypothetical statements beyond polite requests.',
  },
  {
    id: 'C4',
    zone: 'C',
    title: 'Infinitive Clauses',
    prerequisites: ['B4'],
    priority: 'medium',
    summary: 'um...zu, ohne...zu, and statt...zu constructions.',
  },
  {
    id: 'C5',
    zone: 'C',
    title: 'Verbs with Prepositional Objects',
    prerequisites: ['B1', 'B2'],
    priority: 'medium',
    summary: 'High-frequency verb and preposition combinations.',
  },
  {
    id: 'C6',
    zone: 'C',
    title: 'Reported Speech',
    prerequisites: ['B5'],
    priority: 'low',
    summary: 'Receptive Konjunktiv I for reported speech and formal writing.',
  },
];

const structureMap = new Map(GRAMMAR_STRUCTURES.map(structure => [structure.id, structure]));

export function getGrammarStructure(id: string): GrammarStructure {
  const structure = structureMap.get(id);
  if (!structure) {
    throw new Error(`Unknown grammar structure: ${id}`);
  }
  return structure;
}

export function listGrammarStructures(zone?: GrammarZone): GrammarStructure[] {
  if (!zone) return [...GRAMMAR_STRUCTURES];
  return GRAMMAR_STRUCTURES.filter(structure => structure.zone === zone);
}

export function arePrerequisitesSatisfied(
  completedIds: ReadonlySet<string>,
  structureId: string
): boolean {
  const structure = getGrammarStructure(structureId);
  return structure.prerequisites.every(prerequisite => completedIds.has(prerequisite));
}

export function getUnlockedStructures(
  completedIds: ReadonlySet<string>,
  excludeIds: ReadonlySet<string> = new Set()
): GrammarStructure[] {
  return GRAMMAR_STRUCTURES.filter(structure => {
    if (excludeIds.has(structure.id)) return false;
    return arePrerequisitesSatisfied(completedIds, structure.id);
  });
}

export function getNextPriorityStructures(
  masteryById: Record<string, number>,
  masteryThreshold = 65
): GrammarStructure[] {
  const completedIds = new Set(
    Object.entries(masteryById)
      .filter(([, mastery]) => mastery >= masteryThreshold)
      .map(([id]) => id)
  );

  return getUnlockedStructures(completedIds, completedIds).sort((left, right) => {
    const priorityDelta = PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority];
    if (priorityDelta !== 0) return priorityDelta;

    if (left.zone !== right.zone) {
      return left.zone.localeCompare(right.zone);
    }

    return left.id.localeCompare(right.id);
  });
}
