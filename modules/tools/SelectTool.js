/**
 * SelectTool - Smart selection tool with multi-marker support
 * Allows clicking to add markers and creates selection based on color similarity
 */
import { Tool } from '../Tool.js';
import { SelectionEngine } from '../SelectionEngine.js';

export class SelectTool extends Tool {
  constructor() {
    super('select', {
      threshold: 30,
      contiguous: true,
      perceptual: true,
      grow: 0,
      shrink: 0,
      feather: 0,
      globalSelection: false, // Color range: select all similar colors globally
    });

    this.selectionEngine = new SelectionEngine();
    this.markers = [];
    this.currentMask = null;
    this.overlayCanvas = null;
    this.overlayCtx = null;

    // Selection modes for arithmetic operations
    this.selectionMode = 'replace'; // 'replace', 'add', 'subtract', 'intersect'
    this.previousMask = null; // Store previous mask for arithmetic operations
  }

  activate() {
    super.activate();
    this.markers = [];
    this.currentMask = null;
    this.createOverlayCanvas();
    console.log('Select tool activated - Click on image to drop markers');
  }

  getDescription() {
    return `SELECT TOOL - Smart multi-marker selection with advanced features!

BASIC USAGE:
• Click to drop markers on similar colors
• Selection grows from each marker based on color similarity
• Use multiple markers to select disconnected regions
• ESC clears all markers, Backspace removes last marker

SELECTION ARITHMETIC (Boolean Operations):
• Normal Click: Replace selection (default)
• Shift + Click: ADD to selection (Union) - combine multiple areas
• Alt + Click: SUBTRACT from selection (Difference) - remove unwanted areas
• Shift + Alt + Click: INTERSECT with selection - keep only overlapping parts

These operations let you build complex selections iteratively! Each click with a modifier creates a new selection that combines with the previous one using the chosen operation.`;
  }

  deactivate() {
    super.deactivate();
    this.clearOverlay();
  }

  createOverlayCanvas() {
    if (!this.overlayCanvas) {
      this.overlayCanvas = document.createElement('canvas');
      this.overlayCtx = this.overlayCanvas.getContext('2d');
    }

    const dims = this.app.canvasManager.getDimensions();
    this.overlayCanvas.width = dims.width;
    this.overlayCanvas.height = dims.height;
  }

  clearOverlay() {
    if (this.overlayCtx) {
      this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  onPointerDown(e, world, canvas) {
    console.log('SelectTool.onPointerDown called:', { world, canvas, button: e.button });

    if (e.button !== 0) return; // Left click only

    const x = canvas.x;
    const y = canvas.y;
    const dims = this.app.canvasManager.getDimensions();

    console.log('Canvas coordinates:', { x, y, dims });

    // Check bounds
    if (x < 0 || x >= dims.width || y < 0 || y >= dims.height) {
      console.warn('Click outside bounds:', { x, y, dims });
      return;
    }

    // Determine selection mode from keyboard modifiers
    // Shift = Add, Alt = Subtract, Shift+Alt = Intersect
    if (e.shiftKey && e.altKey) {
      this.selectionMode = 'intersect';
    } else if (e.shiftKey) {
      this.selectionMode = 'add';
    } else if (e.altKey) {
      this.selectionMode = 'subtract';
    } else {
      this.selectionMode = 'replace';
    }

    console.log('Selection mode:', this.selectionMode);

    // Store previous mask if we have one and mode is not replace
    if (this.currentMask && this.selectionMode !== 'replace') {
      this.previousMask = new Uint8Array(this.currentMask);
      // Clear markers so we only create selection from the new click
      this.markers = [];
    }

    // Add marker
    this.markers.push({ x, y });
    console.log('Marker added:', { x, y, total: this.markers.length, mode: this.selectionMode });
    this.emit('markerAdded', { x, y, total: this.markers.length });

    // Update selection
    this.updateSelection();
  }

  onKeyDown(e) {
    if (e.key === 'Escape') {
      // Clear all markers
      this.markers = [];
      this.currentMask = null;
      this.clearOverlay();
      this.emit('markersCleared');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      // Remove last marker
      if (this.markers.length > 0) {
        this.markers.pop();
        this.emit('markerRemoved', { total: this.markers.length });
        if (this.markers.length > 0) {
          this.updateSelection();
        } else {
          this.currentMask = null;
          this.clearOverlay();
        }
      }
    }
  }

  updateSelection() {
    const imageData = this.app.canvasManager.getImageData();

    if (this.markers.length === 0) {
      this.currentMask = null;
      this.clearOverlay();
      return;
    }

    // Create selection from markers
    let mask;

    if (this.options.globalSelection) {
      // Color range selection: select all similar colors globally
      mask = this.createGlobalSelection(imageData);
    } else {
      // Normal multi-marker selection (contiguous or non-contiguous from markers)
      mask = this.selectionEngine.multiMarkerSelect(
        imageData,
        this.markers,
        this.options.threshold,
        this.options.contiguous
      );
    }

    // Apply grow/shrink
    if (this.options.grow > 0) {
      mask = this.selectionEngine.growSelection(
        mask,
        imageData.width,
        imageData.height,
        this.options.grow
      );
    } else if (this.options.shrink > 0) {
      mask = this.selectionEngine.shrinkSelection(
        mask,
        imageData.width,
        imageData.height,
        this.options.shrink
      );
    }

    // Apply feather
    if (this.options.feather > 0) {
      mask = this.selectionEngine.featherSelection(
        mask,
        imageData.width,
        imageData.height,
        this.options.feather
      );
    }

    // Apply selection arithmetic if not in replace mode
    if (this.selectionMode !== 'replace' && this.previousMask) {
      mask = this.combineMasks(this.previousMask, mask, this.selectionMode);
    }

    this.currentMask = mask;

    // Update overlay
    this.renderSelectionOverlay();

    this.emit('selectionUpdated', { mask });
  }

  /**
   * Create global selection - select all similar colors across entire image
   */
  createGlobalSelection(imageData) {
    const { width, height, data } = imageData;
    const mask = new Uint8Array(width * height);

    // Get colors from all markers
    const targetColors = this.markers.map(marker => {
      const idx = (marker.y * width + marker.x) * 4;
      return {
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      };
    });

    const threshold = this.options.threshold;
    const perceptual = this.options.perceptual;

    // Scan entire image and mark similar pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Check if pixel is similar to any target color
        for (const target of targetColors) {
          let distance;
          if (perceptual) {
            distance = this.selectionEngine.perceptualColorDistance(
              r, g, b,
              target.r, target.g, target.b
            );
          } else {
            distance = this.selectionEngine.colorDistance(
              r, g, b,
              target.r, target.g, target.b
            );
          }

          if (distance <= threshold) {
            mask[y * width + x] = 255;
            break; // Found match, no need to check other target colors
          }
        }
      }
    }

    return mask;
  }

  /**
   * Combine two masks using selection arithmetic
   */
  combineMasks(mask1, mask2, mode) {
    const result = new Uint8Array(mask1.length);

    switch (mode) {
      case 'add':
        // Union: A OR B
        for (let i = 0; i < mask1.length; i++) {
          result[i] = Math.max(mask1[i], mask2[i]);
        }
        break;

      case 'subtract':
        // Difference: A AND NOT B
        for (let i = 0; i < mask1.length; i++) {
          result[i] = mask1[i] > 0 && mask2[i] === 0 ? mask1[i] : 0;
        }
        break;

      case 'intersect':
        // Intersection: A AND B
        for (let i = 0; i < mask1.length; i++) {
          result[i] = Math.min(mask1[i], mask2[i]);
        }
        break;

      default:
        return mask2; // Replace mode
    }

    return result;
  }

  renderSelectionOverlay() {
    if (!this.currentMask) return;

    // Ensure overlay canvas matches current dimensions
    const dims = this.app.canvasManager.getDimensions();
    if (this.overlayCanvas.width !== dims.width || this.overlayCanvas.height !== dims.height) {
      this.createOverlayCanvas();
    }

    this.clearOverlay();

    const overlay = this.selectionEngine.createSelectionOverlay(
      this.currentMask,
      dims.width,
      dims.height,
      'rgba(0, 150, 255, 0.4)'
    );

    this.overlayCtx.putImageData(overlay, 0, 0);
  }

  renderOverlay(ctx) {
    // Draw selection overlay
    if (this.overlayCanvas) {
      ctx.drawImage(this.overlayCanvas, 0, 0);
    }

    // Draw markers
    ctx.fillStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;

    for (const marker of this.markers) {
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  getOptionsSchema() {
    return [
      {
        type: 'slider',
        name: 'threshold',
        label: 'Threshold',
        min: 0,
        max: 255,
        step: 1,
        value: this.options.threshold,
        description: 'THRESHOLD (0-255): Controls color similarity matching. Lower values = stricter matching (only very similar colors selected). Higher values = looser matching (more color variation accepted). Start with 30 and adjust based on your image. For pixel art with distinct colors, use lower values (10-30). For photos or gradients, use higher values (50-100).',
      },
      {
        type: 'checkbox',
        name: 'contiguous',
        label: 'Contiguous',
        value: this.options.contiguous,
        description: 'CONTIGUOUS: When checked, only selects connected regions of similar color (pixels must touch). When unchecked, selects ALL similar colors within the flood-fill region, even if separated by other colors. Uncheck this to select scattered pixels of the same color within a region.',
      },
      {
        type: 'checkbox',
        name: 'perceptual',
        label: 'Perceptual',
        value: this.options.perceptual,
        description: 'PERCEPTUAL COLOR MATCHING: When checked, uses weighted RGB distance that matches human color perception (green weighted more heavily, blue less). When unchecked, uses simple Euclidean RGB distance. Perceptual mode gives more natural selection results for most images.',
      },
      {
        type: 'checkbox',
        name: 'globalSelection',
        label: 'Global Color Range',
        value: this.options.globalSelection,
        description: 'GLOBAL COLOR RANGE: When checked, scans the ENTIRE image and selects ALL pixels matching the clicked color(s), regardless of position. Perfect for removing backgrounds or selecting scattered UI elements of the same color. When unchecked, uses standard flood-fill behavior (only expands from markers). This is a powerful feature for quick background removal!',
      },
      {
        type: 'slider',
        name: 'grow',
        label: 'Grow',
        min: 0,
        max: 50,
        step: 1,
        value: this.options.grow,
        description: 'GROW SELECTION: Expands the selection boundary outward by the specified number of pixels. Useful for including edges or adding padding around a selection. Set to 0 for no growth. Common values: 1-5 for subtle expansion, 10-20 for significant growth. Applied after initial selection, before feathering.',
      },
      {
        type: 'slider',
        name: 'shrink',
        label: 'Shrink',
        min: 0,
        max: 50,
        step: 1,
        value: this.options.shrink,
        description: 'SHRINK SELECTION: Contracts the selection boundary inward by the specified number of pixels. Useful for removing rough edges or excluding border pixels. Set to 0 for no shrinking. Common values: 1-3 for cleaning edges, 5-10 for significant contraction. Applied after initial selection, before feathering. Note: Grow and Shrink are mutually exclusive.',
      },
      {
        type: 'slider',
        name: 'feather',
        label: 'Feather',
        min: 0,
        max: 50,
        step: 1,
        value: this.options.feather,
        description: 'FEATHER SELECTION: Creates a soft, gradual edge by fading the selection boundary. The value controls the fade distance in pixels. 0 = hard edge (pixel-perfect), 5-10 = soft edge (good for blending), 20+ = very soft edge. Applied AFTER grow/shrink. Perfect for smooth compositing or gentle blur effects. Uses distance transform for quality results.',
      },
      {
        type: 'button',
        name: 'invert',
        label: 'Invert Selection',
        action: () => this.invertSelection(),
        description: 'INVERT SELECTION: Flips the selection - selected pixels become unselected, unselected become selected. Super useful workflow: 1) Use Global Color Range to select background, 2) Click Invert, 3) Now your subject is selected instead! This is often faster than trying to select a complex subject directly.',
      },
    ];
  }

  getCurrentMask() {
    return this.currentMask;
  }

  clearSelection() {
    this.markers = [];
    this.currentMask = null;
    this.clearOverlay();
    this.emit('selectionCleared');
  }

  /**
   * Invert the current selection
   */
  invertSelection() {
    if (!this.currentMask) {
      console.log('No selection to invert');
      return;
    }

    const inverted = new Uint8Array(this.currentMask.length);
    for (let i = 0; i < this.currentMask.length; i++) {
      inverted[i] = this.currentMask[i] > 0 ? 0 : 255;
    }

    this.currentMask = inverted;
    this.renderSelectionOverlay();
    this.emit('selectionInverted', { mask: inverted });
    console.log('Selection inverted');
  }
}
