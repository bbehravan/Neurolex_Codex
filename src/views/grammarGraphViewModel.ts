import { listGrammarStructures } from '../domain/grammarGraph';
import type { LearnerProfile } from '../domain/types';

export interface GrammarGraphNodeViewModel {
  id: string;
  title: string;
  zone: string;
  status: 'mastered' | 'developing' | 'locked';
  masteryPercent: number;
}

export interface GrammarGraphEdgeViewModel {
  from: string;
  to: string;
}

export interface GrammarGraphViewModel {
  title: string;
  nodes: GrammarGraphNodeViewModel[];
  edges: GrammarGraphEdgeViewModel[];
  summary: { mastered: number; developing: number; locked: number };
}

export function buildGrammarGraphViewModel(profile: LearnerProfile): GrammarGraphViewModel {
  const nodes = listGrammarStructures().map((structure) => {
    const masteryPercent = profile.grammarProgress[structure.id]?.masteryPercent ?? 0;
    const status: GrammarGraphNodeViewModel['status'] = masteryPercent >= 65
      ? 'mastered'
      : masteryPercent > 0
        ? 'developing'
        : 'locked';

    return {
      id: structure.id,
      title: structure.title,
      zone: structure.zone,
      status,
      masteryPercent,
    };
  });

  const edges = listGrammarStructures().flatMap((structure) =>
    structure.prerequisites.map((prerequisite) => ({
      from: prerequisite,
      to: structure.id,
    }))
  );

  return {
    title: 'NeuroLex Grammar Graph',
    nodes,
    edges,
    summary: {
      mastered: nodes.filter((node) => node.status === 'mastered').length,
      developing: nodes.filter((node) => node.status === 'developing').length,
      locked: nodes.filter((node) => node.status === 'locked').length,
    },
  };
}
