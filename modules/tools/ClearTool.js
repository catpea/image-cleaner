/**
 * ClearTool - Clear selection to transparency
 */
import { Tool } from '../Tool.js';
import { ImageProcessor } from '../ImageProcessor.js';

export class ClearTool extends Tool {
  constructor() {
    super('clear', {});
    this.imageProcessor = new ImageProcessor();
  }

  activate() {
    super.activate();
    console.log('Clear tool activated');
  }

  getDescription() {
    return `CLEAR TOOL - Remove backgrounds and create transparency

Erases the selected region to full transparency (alpha = 0). Essential for preparing images for 9-slice scaling where you need transparent backgrounds.

TWO BUTTONS:
1. CLEAR SELECTION: Clears the current selection to transparency, keeps selection active for further editing
2. CLEAR BACKGROUND: Clears selection to transparency AND removes the selection markers - one-click workflow!

TYPICAL WORKFLOW FOR 9-SLICE:
1. Use Select tool with Global Color Range enabled
2. Click on background color → selects all background pixels
3. Switch to Clear tool
4. Click "Clear Background" → instant transparent background!
5. Export as PNG with transparency

The cleared regions become fully transparent (suitable for PNG export with alpha channel).`;
  }

  /**
   * Clear selection to transparency
   */
  apply() {
    const selectTool = this.app.pluginSystem.getTool('select');
    if (!selectTool) {
      this.emit('error', { message: 'Select tool not found' });
      return;
    }

    const mask = selectTool.getCurrentMask();
    if (!mask) {
      this.emit('error', { message: 'No selection active' });
      return;
    }

    // Save to history
    const imageData = this.app.canvasManager.getImageData();
    this.app.historyManager.push(imageData, 'Clear to transparency');

    // Clear to transparency
    const result = this.imageProcessor.clearToTransparency(imageData, mask);

    this.app.canvasManager.putImageData(result);
    this.emit('applied');
  }

  /**
   * Clear entire background (all similar colors globally)
   */
  clearBackground() {
    const selectTool = this.app.pluginSystem.getTool('select');
    if (!selectTool) {
      this.emit('error', { message: 'Select tool not found' });
      return;
    }

    const mask = selectTool.getCurrentMask();
    if (!mask) {
      this.emit('error', { message: 'No selection active' });
      return;
    }

    // Save to history
    const imageData = this.app.canvasManager.getImageData();
    this.app.historyManager.push(imageData, 'Clear background');

    // Clear to transparency
    const result = this.imageProcessor.clearToTransparency(imageData, mask);

    this.app.canvasManager.putImageData(result);

    // Clear selection after applying
    selectTool.clearSelection();

    this.emit('backgroundCleared');
  }

  getOptionsSchema() {
    return [
      {
        type: 'button',
        name: 'apply',
        label: 'Clear Selection',
        action: () => this.apply(),
        description: 'CLEAR SELECTION: Erases the currently selected region to full transparency (alpha = 0). The selection remains active afterward, so you can perform additional operations (blur, invert, etc.) or clear more areas. The operation is saved to history (Ctrl+Z to undo).',
      },
      {
        type: 'button',
        name: 'clearBackground',
        label: 'Clear Background',
        action: () => this.clearBackground(),
        description: 'CLEAR BACKGROUND: One-click workflow! Clears the selection to transparency AND removes all selection markers. Perfect for the final step when preparing images for 9-slice. Use this after selecting the background with Global Color Range for instant transparent backgrounds. Saved to history.',
      },
    ];
  }
}
