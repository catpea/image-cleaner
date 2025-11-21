/**
 * PluginSystem - Extensible plugin architecture
 * Allows registering tools, filters, and other extensions
 */
import { EventEmitter } from './EventEmitter.js';

export class PluginSystem extends EventEmitter {
  constructor() {
    super();
    this.plugins = new Map();
    this.tools = new Map();
    this.filters = new Map();
    this.hooks = new Map();
  }

  /**
   * Register a plugin
   * @param {string} name - Plugin name
   * @param {Object} plugin - Plugin object with install() method
   */
  register(name, plugin) {
    if (this.plugins.has(name)) {
      console.warn(`Plugin "${name}" is already registered`);
      return;
    }

    this.plugins.set(name, plugin);

    // Install the plugin
    if (typeof plugin.install === 'function') {
      plugin.install(this.getAPI());
    }

    this.emit('pluginRegistered', { name, plugin });
  }

  /**
   * Unregister a plugin
   * @param {string} name - Plugin name
   */
  unregister(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // Uninstall the plugin
    if (typeof plugin.uninstall === 'function') {
      plugin.uninstall();
    }

    this.plugins.delete(name);
    this.emit('pluginUnregistered', { name });
  }

  /**
   * Register a tool
   * @param {string} name - Tool name
   * @param {Object} tool - Tool class or instance
   */
  registerTool(name, tool) {
    this.tools.set(name, tool);
    this.emit('toolRegistered', { name, tool });
  }

  /**
   * Get a tool
   * @param {string} name - Tool name
   * @returns {Object|null}
   */
  getTool(name) {
    return this.tools.get(name) || null;
  }

  /**
   * Get all tools
   * @returns {Map}
   */
  getAllTools() {
    return new Map(this.tools);
  }

  /**
   * Register a filter
   * @param {string} name - Filter name
   * @param {Function} filter - Filter function
   */
  registerFilter(name, filter) {
    this.filters.set(name, filter);
    this.emit('filterRegistered', { name, filter });
  }

  /**
   * Apply a filter
   * @param {string} name - Filter name
   * @param {ImageData} imageData - Image data to filter
   * @param {Object} options - Filter options
   * @returns {ImageData}
   */
  applyFilter(name, imageData, options = {}) {
    const filter = this.filters.get(name);
    if (!filter) {
      throw new Error(`Filter "${name}" not found`);
    }
    return filter(imageData, options);
  }

  /**
   * Register a hook
   * @param {string} name - Hook name
   * @param {Function} callback - Callback function
   */
  registerHook(name, callback) {
    if (!this.hooks.has(name)) {
      this.hooks.set(name, []);
    }
    this.hooks.get(name).push(callback);
  }

  /**
   * Execute hooks
   * @param {string} name - Hook name
   * @param {*} data - Data to pass to hooks
   * @returns {*} Modified data
   */
  async executeHook(name, data) {
    const hooks = this.hooks.get(name);
    if (!hooks) return data;

    let result = data;
    for (const hook of hooks) {
      result = await hook(result);
    }
    return result;
  }

  /**
   * Get plugin API for plugins to use
   * @private
   */
  getAPI() {
    return {
      registerTool: this.registerTool.bind(this),
      registerFilter: this.registerFilter.bind(this),
      registerHook: this.registerHook.bind(this),
      getTool: this.getTool.bind(this),
      on: this.on.bind(this),
      emit: this.emit.bind(this),
    };
  }
}
