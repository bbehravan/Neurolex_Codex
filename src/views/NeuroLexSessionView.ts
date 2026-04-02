import type { WorkspaceLeaf } from 'obsidian';
import { ItemView } from 'obsidian';

import type ClaudianPlugin from '../main';
import { VIEW_TYPE_NEUROLEX_SESSION } from './constants';

export class NeuroLexSessionView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private readonly plugin: ClaudianPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_NEUROLEX_SESSION;
  }

  getDisplayText(): string {
    return 'NeuroLex Session';
  }

  getIcon(): string {
    return 'clipboard-list';
  }

  async onOpen(): Promise<void> {
    const container = this.contentEl ?? (this.containerEl.children[1] as HTMLElement);
    container.empty();
    const model = await this.plugin.buildNeuroLexSessionViewModel();

    const root = container.createDiv({ cls: 'neurolex-session-view' });
    root.createEl('h2', { text: model.title });
    root.createEl('p', { text: `Application mode: ${model.applicationMode}` });
    root.createEl('p', { text: `Generated: ${model.generatedAt}` });
    root.createEl('p', { text: `Focus: ${model.focusStructures.join(', ') || 'none'}` });
    root.createEl('p', { text: `Reflection: ${model.reflectionPrompt}` });
  }
}
