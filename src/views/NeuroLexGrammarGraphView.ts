import type { WorkspaceLeaf } from 'obsidian';
import { ItemView } from 'obsidian';

import type ClaudianPlugin from '../main';
import { VIEW_TYPE_NEUROLEX_GRAMMAR_GRAPH } from './constants';

export class NeuroLexGrammarGraphView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: ClaudianPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_NEUROLEX_GRAMMAR_GRAPH;
  }

  getDisplayText(): string {
    return 'NeuroLex Grammar Graph';
  }

  getIcon(): string {
    return 'git-branch';
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl ?? (this.containerEl.children[1] as HTMLElement);
    container.empty();
    const model = await this.plugin.buildNeuroLexGrammarGraphViewModel();

    const root = container.createDiv({ cls: 'neurolex-grammar-graph-view' });
    root.createEl('h2', { text: model.title });
    root.createEl('p', { text: `Mastered: ${model.summary.mastered}` });
    root.createEl('p', { text: `Developing: ${model.summary.developing}` });
    root.createEl('p', { text: `Locked: ${model.summary.locked}` });
  }
}
