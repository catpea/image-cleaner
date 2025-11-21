/**
 * Signal - Reactive state management system
 * Inspired by SolidJS signals, no external dependencies
 */

/**
 * Create a reactive signal
 * @param {*} initialValue - Initial value
 * @returns {[Function, Function]} Tuple of [getter, setter]
 */
export function createSignal(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    // If there's a current effect running, subscribe it
    if (currentEffect) {
      subscribers.add(currentEffect);
      currentEffect.dependencies.add(subscribers);
    }
    return value;
  };

  const write = (newValue) => {
    // Support function updates: setValue(prev => prev + 1)
    const nextValue = typeof newValue === 'function' ? newValue(value) : newValue;

    if (nextValue !== value) {
      value = nextValue;
      // Notify all subscribers
      subscribers.forEach(effect => {
        queuedEffects.add(effect);
      });
      flushEffects();
    }
  };

  return [read, write];
}

/**
 * Create a computed value that automatically updates
 * @param {Function} fn - Function that computes the value
 * @returns {Function} Getter for the computed value
 */
export function createMemo(fn) {
  let value;
  let dirty = true;

  const [track, trigger] = createSignal();

  createEffect(() => {
    dirty = true;
    trigger();
  });

  return () => {
    if (dirty) {
      value = fn();
      dirty = false;
    }
    track(); // Subscribe to this memo
    return value;
  };
}

// Effect system
let currentEffect = null;
const queuedEffects = new Set();
let isFlushPending = false;

/**
 * Create a side effect that runs when dependencies change
 * @param {Function} fn - Effect function
 */
export function createEffect(fn) {
  const effect = {
    fn,
    dependencies: new Set(),
    cleanup: null,
  };

  const execute = () => {
    // Clean up previous dependencies
    effect.dependencies.forEach(deps => {
      deps.delete(effect);
    });
    effect.dependencies.clear();

    // Run cleanup from previous execution
    if (effect.cleanup) {
      effect.cleanup();
      effect.cleanup = null;
    }

    // Run the effect
    const prevEffect = currentEffect;
    currentEffect = effect;
    try {
      const cleanup = fn();
      if (typeof cleanup === 'function') {
        effect.cleanup = cleanup;
      }
    } finally {
      currentEffect = prevEffect;
    }
  };

  execute();
}

function flushEffects() {
  if (isFlushPending) return;
  isFlushPending = true;

  queueMicrotask(() => {
    const effects = Array.from(queuedEffects);
    queuedEffects.clear();
    isFlushPending = false;

    effects.forEach(effect => {
      effect.fn();
    });
  });
}

/**
 * Batch multiple signal updates together
 * @param {Function} fn - Function containing signal updates
 */
export function batch(fn) {
  fn();
  flushEffects();
}
