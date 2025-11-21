/**
 * EventEmitter - Simple pub/sub event system
 * No external dependencies, inspired by Node.js EventEmitter
 */
export class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function
   */
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Callback function to remove
   */
  off(event, listener) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return;

    const listeners = this.events.get(event).slice(); // Copy to avoid issues if listener modifies
    for (const listener of listeners) {
      listener(...args);
    }
  }

  /**
   * Remove all listeners for an event, or all events
   * @param {string} [event] - Optional event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number}
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }
}
