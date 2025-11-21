/**
 * HistoryManager - Undo/Redo system for image operations
 * Stores ImageData snapshots for each operation
 */
import { EventEmitter } from './EventEmitter.js';

export class HistoryManager extends EventEmitter {
  constructor(maxStates = 50) {
    super();
    this.maxStates = maxStates;
    this.states = [];
    this.currentIndex = -1;
  }

  /**
   * Push a new state to history
   * @param {ImageData} imageData - Canvas ImageData to save
   * @param {string} [description] - Optional description of the operation
   */
  push(imageData, description = '') {
    // Remove any states after current index (when user undoes then makes new edit)
    this.states = this.states.slice(0, this.currentIndex + 1);

    // Create a copy of the imageData
    const copy = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );

    this.states.push({
      data: copy,
      description,
      timestamp: Date.now(),
    });

    // Limit history size
    if (this.states.length > this.maxStates) {
      this.states.shift();
    } else {
      this.currentIndex++;
    }

    this.emit('push', { description, index: this.currentIndex, total: this.states.length });
    this.emit('change', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  /**
   * Undo to previous state
   * @returns {ImageData|null} Previous ImageData or null if can't undo
   */
  undo() {
    if (!this.canUndo()) return null;

    this.currentIndex--;
    const state = this.states[this.currentIndex];

    this.emit('undo', { description: state.description, index: this.currentIndex });
    this.emit('change', { canUndo: this.canUndo(), canRedo: this.canRedo() });

    // Return a copy
    return new ImageData(
      new Uint8ClampedArray(state.data.data),
      state.data.width,
      state.data.height
    );
  }

  /**
   * Redo to next state
   * @returns {ImageData|null} Next ImageData or null if can't redo
   */
  redo() {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const state = this.states[this.currentIndex];

    this.emit('redo', { description: state.description, index: this.currentIndex });
    this.emit('change', { canUndo: this.canUndo(), canRedo: this.canRedo() });

    // Return a copy
    return new ImageData(
      new Uint8ClampedArray(state.data.data),
      state.data.width,
      state.data.height
    );
  }

  /**
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this.currentIndex < this.states.length - 1;
  }

  /**
   * Get current state
   * @returns {ImageData|null}
   */
  getCurrentState() {
    if (this.currentIndex < 0) return null;
    const state = this.states[this.currentIndex];
    return new ImageData(
      new Uint8ClampedArray(state.data.data),
      state.data.width,
      state.data.height
    );
  }

  /**
   * Jump to a specific state in history
   * @param {number} index - The index to jump to
   * @returns {ImageData|null} ImageData at that index or null if invalid
   */
  jumpTo(index) {
    if (index < 0 || index >= this.states.length) {
      console.warn('Invalid history index:', index);
      return null;
    }

    this.currentIndex = index;
    const state = this.states[this.currentIndex];

    this.emit('jumpTo', { description: state.description, index: this.currentIndex });
    this.emit('change', { canUndo: this.canUndo(), canRedo: this.canRedo() });

    // Return a copy
    return new ImageData(
      new Uint8ClampedArray(state.data.data),
      state.data.width,
      state.data.height
    );
  }

  /**
   * Get history as array of descriptions
   * @returns {Array<{description: string, timestamp: number, isCurrent: boolean, index: number}>}
   */
  getHistory() {
    return this.states.map((state, index) => ({
      description: state.description || 'Unnamed operation',
      timestamp: state.timestamp,
      isCurrent: index === this.currentIndex,
      index: index,
    }));
  }

  /**
   * Clear all history
   */
  clear() {
    this.states = [];
    this.currentIndex = -1;
    this.emit('clear');
    this.emit('change', { canUndo: false, canRedo: false });
  }

  /**
   * Get memory usage estimate in MB
   * @returns {number}
   */
  getMemoryUsage() {
    let bytes = 0;
    for (const state of this.states) {
      bytes += state.data.data.length;
    }
    return bytes / (1024 * 1024);
  }
}
