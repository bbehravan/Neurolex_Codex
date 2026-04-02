import {
  arePrerequisitesSatisfied,
  getGrammarStructure,
  getNextPriorityStructures,
  listGrammarStructures,
} from '@/domain/grammarGraph';

describe('grammarGraph', () => {
  test('looks up structures by id', () => {
    expect(getGrammarStructure('B4').title).toBe('Subordinate Clause Word Order');
  });

  test('respects prerequisite checks', () => {
    const onlyA2 = new Set(['A2']);
    const a2AndB1 = new Set(['A2', 'B1']);

    expect(arePrerequisitesSatisfied(onlyA2, 'B2')).toBe(false);
    expect(arePrerequisitesSatisfied(a2AndB1, 'B2')).toBe(true);
  });

  test('returns zone-filtered structures', () => {
    const zoneB = listGrammarStructures('B');
    expect(zoneB.every(structure => structure.zone === 'B')).toBe(true);
    expect(zoneB.length).toBe(8);
  });

  test('prioritizes highest-impact unlocked structures first', () => {
    const ranked = getNextPriorityStructures({
      A1: 70,
      A2: 80,
      A3: 90,
      A4: 75,
      A5: 72,
      A6: 66,
      B1: 10,
      B2: 0,
      B3: 0,
      B4: 5,
      B5: 0,
      B6: 0,
      B7: 0,
      B8: 0,
    });

    expect(ranked.slice(0, 3).map(structure => structure.id)).toEqual(['B1', 'B4', 'B3']);
  });
});
