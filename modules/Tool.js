/**
 * Tool - Base class for tools
 * Tools handle user interactions and perform operations on the canvas
 */
import { EventEmitter } from './EventEmitter.js';

export class Tool extends EventEmitter {
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.options = options;
    this.active = false;
    this.app = null;
  }

  /**
   * Set application reference
   * @param {Object} app - Application instance
   */
  setApp(app) {
    this.app = app;
  }

  /**
   * Activate the tool
   */
  activate() {
    this.active = true;
    this.emit('activated');
  }

  /**
   * Deactivate the tool
   */
  deactivate() {
    this.active = false;
    this.emit('deactivated');
  }

  /**
   * Handle pointer down event
   * @param {PointerEvent} e - Pointer event
   * @param {Object} world - World coordinates {wx, wy}
   * @param {Object} canvas - Canvas coordinates {x, y}
   */
  onPointerDown(e, world, canvas) {
    // Override in subclasses
  }

  /**
   * Handle pointer move event
   * @param {PointerEvent} e - Pointer event
   * @param {Object} world - World coordinates {wx, wy}
   * @param {Object} canvas - Canvas coordinates {x, y}
   */
  onPointerMove(e, world, canvas) {
    // Override in subclasses
  }

  /**
   * Handle pointer up event
   * @param {PointerEvent} e - Pointer event
   * @param {Object} world - World coordinates {wx, wy}
   * @param {Object} canvas - Canvas coordinates {x, y}
   */
  onPointerUp(e, world, canvas) {
    // Override in subclasses
  }

  /**
   * Handle key down event
   * @param {KeyboardEvent} e - Keyboard event
   */
  onKeyDown(e) {
    // Override in subclasses
  }

  /**
   * Update tool options
   * @param {Object} options - New options
   */
  updateOptions(options) {
    this.options = { ...this.options, ...options };
    this.emit('optionsUpdated', this.options);
  }

  /**
   * Get tool options schema for UI
   * @returns {Array<Object>} Options schema
   */
  getOptionsSchema() {
    return [];
  }

  /**
   * Render tool-specific overlay on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  renderOverlay(ctx) {
    // Override in subclasses
  }
}
