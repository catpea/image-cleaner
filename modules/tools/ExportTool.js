/**
 * ExportTool - Export image as PNG
 */
import { Tool } from '../Tool.js';

export class ExportTool extends Tool {
  constructor() {
    super('export', {
      filename: 'cleaned-image.png',
      format: 'image/png',
    });
  }

  activate() {
    super.activate();
    console.log('Export tool activated');
  }

  getDescription() {
    return `EXPORT TOOL - Save your work as PNG with transparency

Downloads the current canvas as a PNG file. Preserves all transparency (alpha channel) created by the Clear tool, making it perfect for 9-slice graphics and web assets.

PNG FORMAT BENEFITS:
• Lossless compression - no quality loss
• Full alpha channel support - transparent backgrounds preserved
• Widely supported - works everywhere (web, games, apps)
• Small file sizes for pixel art and UI graphics

Simply enter a filename and click Export PNG. The file downloads to your browser's default download folder.`;
  }

  /**
   * Export current canvas
   */
  async apply() {
    const filename = this.options.filename || 'cleaned-image.png';
    await this.app.canvasManager.download(filename, this.options.format);
    this.emit('exported', { filename });
  }

  getOptionsSchema() {
    return [
      {
        type: 'text',
        name: 'filename',
        label: 'Filename',
        value: this.options.filename,
        description: 'FILENAME: Enter the name for your exported file. The .png extension will be added automatically if not included. Use descriptive names like "ui-button-9slice.png" or "background-cleaned.png". The file will download to your browser\'s default download folder.',
      },
      {
        type: 'button',
        name: 'export',
        label: 'Export PNG',
        action: () => this.apply(),
        description: 'EXPORT PNG: Downloads the current canvas as a PNG file with full transparency support. All your edits (selections cleared, blurs applied, etc.) are preserved in the final image. The PNG format is lossless and perfect for 9-slice graphics, UI elements, and web assets. Supports full alpha channel transparency.',
      },
    ];
  }
}
