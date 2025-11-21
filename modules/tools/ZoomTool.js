/**
 * ZoomTool - Pan and zoom tool
 * Activates panner-zoomer for navigation
 */
import { Tool } from '../Tool.js';

export class ZoomTool extends Tool {
  constructor() {
    super('zoom', {});
  }

  getDescription() {
    return `ZOOM TOOL - Pan and zoom controls

Pan and zoom are always available:
• MIDDLE MOUSE BUTTON (press wheel) + DRAG to pan (move the view around)
• SCROLL WHEEL to zoom in/out
• Zoom is centered on your mouse cursor position

This tool provides convenient buttons to reset view, zoom in, and zoom out. The zoom and pan state is preserved when switching tools. Pan with middle mouse button works with any tool active.`;
  }

  activate() {
    super.activate();
    console.log('Zoom tool activated - Use middle mouse button to pan, scroll wheel to zoom');
    this.emit('activated');
  }

  deactivate() {
    super.deactivate();
    this.emit('deactivated');
  }

  getOptionsSchema() {
    return [
      {
        type: 'button',
        name: 'reset',
        label: 'Reset View',
        action: () => this.resetView(),
        description: 'RESET VIEW: Returns zoom to 100% (1:1 scale) and centers the image. Use this if you get lost while panning/zooming or want to see the whole image at actual size.',
      },
      {
        type: 'button',
        name: 'zoomIn',
        label: 'Zoom In',
        action: () => this.zoomIn(),
        description: 'ZOOM IN: Increases zoom by 1.5x (150%). Click multiple times to zoom in further. Alternative: Use scroll wheel up while hovering over the image.',
      },
      {
        type: 'button',
        name: 'zoomOut',
        label: 'Zoom Out',
        action: () => this.zoomOut(),
        description: 'ZOOM OUT: Decreases zoom by 1.5x (66%). Click multiple times to zoom out further. Alternative: Use scroll wheel down while hovering over the image.',
      },
    ];
  }

  resetView() {
    if (this.app.pannerZoomer) {
      this.app.pannerZoomer.reset();
      this.emit('viewReset');
    }
  }

  zoomIn() {
    if (this.app.pannerZoomer) {
      const transform = this.app.pannerZoomer.getTransform();
      this.app.pannerZoomer.setZoom(transform.scale * 1.5);
      this.emit('zoomChanged');
    }
  }

  zoomOut() {
    if (this.app.pannerZoomer) {
      const transform = this.app.pannerZoomer.getTransform();
      this.app.pannerZoomer.setZoom(transform.scale / 1.5);
      this.emit('zoomChanged');
    }
  }
}
