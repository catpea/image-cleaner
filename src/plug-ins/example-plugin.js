/**
 * Example Plugin - Demonstrates the plugin architecture
 * This plugin adds a simple invert colors filter
 */

import { Tool } from '../../modules/Tool.js';
import { ImageProcessor } from '../../modules/ImageProcessor.js';

class InvertTool extends Tool {
  constructor() {
    super('invert', {});
    this.imageProcessor = new ImageProcessor();
  }

  /**
   * Apply invert to current selection or entire image
   */
  apply() {
    const selectTool = this.app.pluginSystem.getTool('select');
    const mask = selectTool ? selectTool.getCurrentMask() : null;

    // Save to history
    const imageData = this.app.canvasManager.getImageData();
    this.app.historyManager.push(imageData, 'Invert colors');

    // Invert colors
    const result = this.invertColors(imageData, mask);

    this.app.canvasManager.putImageData(result);
    this.emit('applied');
  }

  invertColors(imageData, mask) {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    const data = result.data;

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      const shouldInvert = !mask || mask[pixelIndex] > 0;

      if (shouldInvert) {
        data[i] = 255 - data[i];         // Red
        data[i + 1] = 255 - data[i + 1]; // Green
        data[i + 2] = 255 - data[i + 2]; // Blue
        // Alpha stays the same
      }
    }

    return result;
  }

  getOptionsSchema() {
    return [
      {
        type: 'button',
        name: 'apply',
        label: 'Invert Colors',
        action: () => this.apply(),
      },
    ];
  }
}

// Plugin definition
export const ExamplePlugin = {
  name: 'example-plugin',

  install(api) {
    console.log('Example plugin installed!');

    // Register the invert tool
    const invertTool = new InvertTool();
    api.registerTool('invert', invertTool);

    // Register a filter
    api.registerFilter('grayscale', (imageData, options = {}) => {
      const result = new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
      const data = result.data;

      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }

      return result;
    });

    // Register a hook
    api.registerHook('beforeExport', async (imageData) => {
      console.log('Before export hook called');
      return imageData;
    });
  },

  uninstall() {
    console.log('Example plugin uninstalled');
  }
};
