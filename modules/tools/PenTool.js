/**
 * PenTool - Draw and make corrections directly on the canvas
 * Disables panner-zoomer while drawing for precise control
 */
import { Tool } from '../Tool.js';

export class PenTool extends Tool {
  constructor() {
    super('pen', {
      size: 5,
      color: '#000000',
      opacity: 100,
      hardness: 100,
      eraser: false,
    });

    this.isDrawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.strokeStarted = false;
    this.beforeStrokeImageData = null;
  }

  getDescription() {
    return `PEN TOOL - Draw directly on the canvas for corrections and touch-ups

Perfect for making quick corrections to your pixel art! The pen disables pan/zoom while drawing so you can work precisely.

BASIC USAGE:
• Click and drag to draw
• Release to finish stroke
• Each stroke is saved to history (can undo)

DRAWING MODES:
• Normal: Draw with selected color
• Eraser: Set eraser mode to draw transparency

ADVANCED OPTIONS:
• Size: Brush diameter in pixels (1-50)
• Color: Click color picker to choose any color
• Opacity: How transparent the stroke is (0-100%)
• Hardness: Edge softness (100 = hard edge, 0 = very soft/feathered)

Pan/zoom is automatically disabled while this tool is active, so you can draw without accidentally panning. Switch to Zoom tool when you need to navigate.`;
  }

  activate() {
    super.activate();

    // Always disable panner-zoomer for precise drawing
    if (this.app.pannerZoomer) {
      this.app.pannerZoomer.disable();
      console.log('Pen tool activated - Pan/zoom disabled for precise drawing');
    }

    this.isDrawing = false;
    this.strokeStarted = false;
  }

  deactivate() {
    super.deactivate();

    // Re-enable panner-zoomer when switching away from pen
    if (this.app.pannerZoomer) {
      this.app.pannerZoomer.enable();
      console.log('Pen tool deactivated - Pan/zoom re-enabled');
    }

    this.isDrawing = false;
    this.strokeStarted = false;
  }

  onPointerDown(e, world, canvas) {
    if (e.button !== 0) return; // Left click only

    const x = canvas.x;
    const y = canvas.y;
    const dims = this.app.canvasManager.getDimensions();

    // Check bounds
    if (x < 0 || x >= dims.width || y < 0 || y >= dims.height) {
      return;
    }

    this.isDrawing = true;
    this.strokeStarted = true;
    this.lastX = x;
    this.lastY = y;

    // Save current state before starting stroke (for undo)
    this.beforeStrokeImageData = this.app.canvasManager.getImageData();

    // Draw initial dot
    this.drawDot(x, y);
  }

  onPointerMove(e, world, canvas) {
    if (!this.isDrawing) return;

    const x = canvas.x;
    const y = canvas.y;
    const dims = this.app.canvasManager.getDimensions();

    // Check bounds
    if (x < 0 || x >= dims.width || y < 0 || y >= dims.height) {
      return;
    }

    // Draw line from last position to current position
    this.drawLine(this.lastX, this.lastY, x, y);

    this.lastX = x;
    this.lastY = y;
  }

  onPointerUp(e, world, canvas) {
    if (!this.isDrawing) return;

    this.isDrawing = false;

    // Save stroke to history
    if (this.strokeStarted) {
      const currentImageData = this.app.canvasManager.getImageData();
      this.app.historyManager.push(
        currentImageData,
        `Pen stroke (${this.options.eraser ? 'eraser' : 'draw'})`
      );
      this.strokeStarted = false;
      this.beforeStrokeImageData = null;
    }
  }

  /**
   * Draw a single dot at the specified position
   */
  drawDot(x, y) {
    const imageData = this.app.canvasManager.getImageData();
    const { width, height, data } = imageData;

    const radius = this.options.size / 2;
    const color = this.hexToRgb(this.options.color);
    const opacity = this.options.opacity / 100;
    const hardness = this.options.hardness / 100;
    const eraser = this.options.eraser;

    // Draw anti-aliased circle
    for (let dy = -radius - 1; dy <= radius + 1; dy++) {
      for (let dx = -radius - 1; dx <= radius + 1; dx++) {
        const px = Math.round(x + dx);
        const py = Math.round(y + dy);

        if (px < 0 || px >= width || py < 0 || py >= height) continue;

        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > radius) continue;

        // Calculate alpha based on distance and hardness
        let alpha = 1.0;
        if (hardness < 1.0) {
          const softEdgeStart = radius * hardness;
          if (distance > softEdgeStart) {
            alpha = 1.0 - (distance - softEdgeStart) / (radius - softEdgeStart);
          }
        }

        // Anti-aliasing at the edge
        if (distance > radius - 1) {
          alpha *= (radius - distance);
        }

        alpha *= opacity;
        alpha = Math.max(0, Math.min(1, alpha));

        const idx = (py * width + px) * 4;

        if (eraser) {
          // Eraser mode: reduce alpha
          data[idx + 3] *= (1 - alpha);
        } else {
          // Drawing mode: blend color
          const srcAlpha = alpha;
          const dstAlpha = data[idx + 3] / 255;
          const outAlpha = srcAlpha + dstAlpha * (1 - srcAlpha);

          if (outAlpha > 0) {
            data[idx] = (color.r * srcAlpha + data[idx] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            data[idx + 1] = (color.g * srcAlpha + data[idx + 1] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            data[idx + 2] = (color.b * srcAlpha + data[idx + 2] * dstAlpha * (1 - srcAlpha)) / outAlpha;
            data[idx + 3] = outAlpha * 255;
          }
        }
      }
    }

    this.app.canvasManager.putImageData(imageData);
  }

  /**
   * Draw a line using Bresenham's algorithm with anti-aliasing
   */
  drawLine(x0, y0, x1, y1) {
    // For now, use simple interpolation with dots
    // This ensures smooth lines even at low frame rates
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance);

    if (steps === 0) {
      this.drawDot(x1, y1);
      return;
    }

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      this.drawDot(x, y);
    }
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  }

  /**
   * Eyedropper - pick color from canvas at mouse position
   */
  pickColor(x, y) {
    const imageData = this.app.canvasManager.getImageData();
    const { width, data } = imageData;
    const idx = (y * width + x) * 4;

    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];

    // Convert to hex
    const hex =
      '#' +
      [r, g, b]
        .map((c) => {
          const hex = c.toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('');

    this.options.color = hex;
    this.app.uiManager.updateOptionsPanel(this);
    console.log('Picked color:', hex);
  }

  onKeyDown(e) {
    // Alt key: temporarily switch to eyedropper
    if (e.altKey && !this.isDrawing) {
      this.app.canvasManager.canvas.style.cursor = 'crosshair';
    }

    // Bracket keys: adjust brush size
    if (e.key === '[') {
      this.options.size = Math.max(1, this.options.size - 1);
      this.app.uiManager.updateOptionsPanel(this);
    } else if (e.key === ']') {
      this.options.size = Math.min(50, this.options.size + 1);
      this.app.uiManager.updateOptionsPanel(this);
    }
  }

  getOptionsSchema() {
    return [
      {
        type: 'slider',
        name: 'size',
        label: 'Brush Size',
        min: 1,
        max: 50,
        step: 1,
        value: this.options.size,
        description: 'BRUSH SIZE (1-50): Diameter of the brush in pixels. Smaller sizes for detail work, larger for coverage. Keyboard shortcuts: [ to decrease, ] to increase. Common values: 1-3 for fine details, 5-10 for general drawing, 20+ for large areas.',
      },
      {
        type: 'color',
        name: 'color',
        label: 'Color',
        value: this.options.color,
        description: 'COLOR: Click to open color picker and choose any color. The color applies to all brush strokes in normal mode. Tip: Hold Alt while clicking on the canvas to pick a color from the image (eyedropper). Recently used colors are remembered.',
      },
      {
        type: 'slider',
        name: 'opacity',
        label: 'Opacity',
        min: 0,
        max: 100,
        step: 1,
        value: this.options.opacity,
        description: 'OPACITY (0-100%): Controls transparency of brush strokes. 100% = fully opaque (solid color), 50% = semi-transparent, 0% = invisible. Lower opacity allows building up color gradually with multiple strokes, perfect for blending and shading.',
      },
      {
        type: 'slider',
        name: 'hardness',
        label: 'Hardness',
        min: 0,
        max: 100,
        step: 1,
        value: this.options.hardness,
        description: 'HARDNESS (0-100%): Controls edge softness of the brush. 100% = hard edge (crisp, pixel-perfect), 50% = medium soft edge, 0% = very soft/feathered edge. Hard brushes for pixel art and precise work, soft brushes for blending and natural-looking strokes.',
      },
      {
        type: 'checkbox',
        name: 'eraser',
        label: 'Eraser Mode',
        value: this.options.eraser,
        description: 'ERASER MODE: When checked, brush erases to transparency instead of drawing color. All other settings (size, opacity, hardness) still apply. Perfect for cleaning up edges, removing mistakes, or creating transparent areas. The eraser respects opacity: 100% = complete erasure, lower = partial transparency.',
      },
    ];
  }
}
