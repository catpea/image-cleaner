/**
 * BlurTool - Apply Gaussian blur to selection
 * Uses the current selection from SelectTool
 */
import { Tool } from '../Tool.js';
import { ImageProcessor } from '../ImageProcessor.js';

export class BlurTool extends Tool {
  constructor() {
    super('blur', {
      radius: 10,
      useAverage: false,
    });

    this.imageProcessor = new ImageProcessor();
  }

  activate() {
    super.activate();
    console.log('Blur tool activated');
  }

  getDescription() {
    return `BLUR TOOL - Smooth and soften selected regions

Applies Gaussian blur to the current selection. You must have an active selection (use Select tool first).

TWO MODES:
1. STANDARD BLUR (default): Full Gaussian blur that preserves colors and gradients
2. AVERAGE COLOR MODE: Fills selection with average color + subtle tone variation - perfect for blanking UI backgrounds while maintaining slight texture

WORKFLOW:
1. Use Select tool to create a selection
2. Switch to Blur tool
3. Adjust blur radius (higher = more blur)
4. Optionally enable "Use Average Color" for the blanking effect
5. Click "Apply Blur"

Perfect for preparing 9-slice graphics by smoothing or blanking background regions!`;
  }

  /**
   * Apply blur to current selection
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
    this.app.historyManager.push(imageData, `Blur (radius: ${this.options.radius})`);

    // Apply blur
    let result;
    if (this.options.useAverage) {
      // Calculate average color and fill with slight variation
      const avgColor = this.imageProcessor.getAverageColor(imageData, mask);
      result = this.imageProcessor.fillSelection(imageData, mask, avgColor);

      // Apply slight blur for tone variation
      result = this.imageProcessor.gaussianBlur(result, Math.min(this.options.radius, 5), mask);
    } else {
      // Apply full Gaussian blur
      result = this.imageProcessor.gaussianBlur(imageData, this.options.radius, mask);
    }

    this.app.canvasManager.putImageData(result);
    this.emit('applied', { radius: this.options.radius });
  }

  getOptionsSchema() {
    return [
      {
        type: 'slider',
        name: 'radius',
        label: 'Blur Radius',
        min: 1,
        max: 50,
        step: 1,
        value: this.options.radius,
        description: 'BLUR RADIUS (1-50): Controls blur strength. Higher values = more blur. Common values: 5-10 for subtle smoothing, 15-25 for medium blur, 30+ for heavy blur. Uses separable Gaussian blur algorithm for quality results. In Average Color mode, radius is capped at 5 to provide just a hint of tone variation.',
      },
      {
        type: 'checkbox',
        name: 'useAverage',
        label: 'Use Average Color',
        value: this.options.useAverage,
        description: 'USE AVERAGE COLOR MODE: When checked, calculates the average color of the selected region and fills it with that color plus a subtle blur (max radius 5) for tone variation. Perfect for blanking UI backgrounds while maintaining a natural look instead of flat color. When unchecked, applies standard Gaussian blur that preserves original colors and gradients.',
      },
      {
        type: 'button',
        name: 'apply',
        label: 'Apply Blur',
        action: () => this.apply(),
        description: 'APPLY BLUR: Applies the blur effect to the current selection. Requires an active selection from the Select tool. The operation is saved to history so you can undo it with Ctrl+Z if needed. Processing may take a few seconds for large selections or high blur radius values.',
      },
    ];
  }
}
