/**
 * Application - Main application class
 * Coordinates all modules and manages application state
 */
import { EventEmitter } from './EventEmitter.js';
import { CanvasManager } from './CanvasManager.js';
import { HistoryManager } from './HistoryManager.js';
import { PluginSystem } from './PluginSystem.js';
import { UIManager } from './UIManager.js';
import { createSignal } from './Signal.js';

export class Application extends EventEmitter {
  constructor() {
    super();

    // Core systems
    this.canvasManager = new CanvasManager();
    this.historyManager = new HistoryManager();
    this.pluginSystem = new PluginSystem();
    this.uiManager = new UIManager();

    // State
    this.currentTool = null;
    this.pannerZoomer = null;
    this.overlayCanvas = null;
    this.overlayCtx = null;

    // Signals
    const [getImageLoaded, setImageLoaded] = createSignal(false);
    this.imageLoaded = { get: getImageLoaded, set: setImageLoaded };

    // Bind methods
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.jumpTo = this.jumpTo.bind(this);
  }

  /**
   * Initialize application
   * @param {Object} config - Configuration object
   */
  async initialize(config) {
    // Initialize canvas manager
    this.canvasManager.initialize(config.canvas);

    // Create overlay canvas for tool rendering
    this.overlayCanvas = config.overlayCanvas || document.createElement('canvas');
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.overlayCtx.imageSmoothingEnabled = false;

    // Initialize UI manager
    this.uiManager.initialize({
      toolbox: config.toolbox,
      options: config.options,
      history: config.history,
    });

    // Set panner-zoomer reference and enable it
    if (config.pannerZoomer) {
      this.pannerZoomer = config.pannerZoomer;
      // Panner-zoomer is always enabled, responds to middle mouse button for panning
      this.pannerZoomer.enable();
      console.log('Panner-zoomer enabled (middle button for panning)');
    }

    // Setup event listeners
    this.setupEventListeners();

    // Setup history controls
    this.uiManager.addHistoryControls(this.undo, this.redo);

    // Load initial image if provided
    if (config.initialImage) {
      await this.loadImage(config.initialImage);
    }

    this.emit('initialized');
  }

  /**
   * Use a plugin
   * @param {Object} plugin - Plugin object
   */
  use(plugin) {
    const name = plugin.name || 'unnamed';
    this.pluginSystem.register(name, plugin);
  }

  /**
   * Register a tool
   * @param {Object} tool - Tool instance
   */
  registerTool(tool) {
    tool.setApp(this);
    this.pluginSystem.registerTool(tool.name, tool);
  }

  /**
   * Set active tool
   * @param {string} toolName - Tool name
   */
  setTool(toolName) {
    console.log('Application.setTool called with:', toolName);

    // Deactivate current tool
    if (this.currentTool) {
      console.log('Deactivating current tool:', this.currentTool.name);
      this.currentTool.deactivate();
    }

    // Get and activate new tool
    const tool = this.pluginSystem.getTool(toolName);
    if (!tool) {
      console.error(`Tool "${toolName}" not found`);
      return;
    }

    console.log('Activating tool:', toolName);
    this.currentTool = tool;
    tool.activate();

    // Update UI
    this.uiManager.setActiveTool(toolName);
    this.uiManager.updateOptionsPanel(tool);

    this.emit('toolChanged', { toolName, tool });
  }

  /**
   * Load an image
   * @param {string|File} source - Image source
   */
  async loadImage(source) {
    try {
      await this.canvasManager.loadImage(source);

      // Resize overlay canvas
      const dims = this.canvasManager.getDimensions();
      this.overlayCanvas.width = dims.width;
      this.overlayCanvas.height = dims.height;

      // Save initial state to history
      const imageData = this.canvasManager.getImageData();
      this.historyManager.clear();
      this.historyManager.push(imageData, 'Initial image');

      this.imageLoaded.set(true);
      this.emit('imageLoaded', dims);

      // Update UI
      this.uiManager.updateHistoryPanel(this.historyManager.getHistory(), this.jumpTo);
      this.uiManager.updateHistoryButtons(
        this.historyManager.canUndo(),
        this.historyManager.canRedo()
      );
    } catch (error) {
      console.error('Failed to load image:', error);
      this.uiManager.showNotification('Failed to load image', 'error');
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    // Canvas events
    const canvas = this.canvasManager.canvas;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    document.addEventListener('pointermove', this.handlePointerMove);
    document.addEventListener('pointerup', this.handlePointerUp);

    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);

    // History events
    this.historyManager.on('change', ({ canUndo, canRedo }) => {
      this.uiManager.updateHistoryButtons(canUndo, canRedo);
    });

    this.historyManager.on('push', () => {
      this.uiManager.updateHistoryPanel(this.historyManager.getHistory(), this.jumpTo);
    });

    this.historyManager.on('undo', () => {
      this.uiManager.updateHistoryPanel(this.historyManager.getHistory(), this.jumpTo);
    });

    this.historyManager.on('redo', () => {
      this.uiManager.updateHistoryPanel(this.historyManager.getHistory(), this.jumpTo);
    });

    this.historyManager.on('jumpTo', () => {
      this.uiManager.updateHistoryPanel(this.historyManager.getHistory(), this.jumpTo);
    });

    // Canvas update events
    this.canvasManager.on('canvasUpdated', () => {
      this.renderOverlay();
    });

    // UI events
    this.uiManager.on('toolSelected', ({ name }) => {
      this.setTool(name);
    });

    // Tool events - render overlay when tool state changes
    this.pluginSystem.on('toolRegistered', ({ tool }) => {
      tool.on('optionsUpdated', () => this.renderOverlay());
      tool.on('selectionUpdated', () => this.renderOverlay());
      tool.on('markerAdded', () => this.renderOverlay());
      tool.on('markerRemoved', () => this.renderOverlay());
      tool.on('markersCleared', () => this.renderOverlay());
      tool.on('applied', () => this.renderOverlay());
      tool.on('error', ({ message }) => {
        this.uiManager.showNotification(message, 'error');
      });
    });
  }

  /**
   * Handle pointer down
   * @private
   */
  handlePointerDown(e) {
    console.log('Application.handlePointerDown - currentTool:', this.currentTool?.name);

    if (!this.currentTool) {
      console.warn('No current tool set!');
      return;
    }

    const world = this.getWorldCoordinates(e);
    const canvas = this.getCanvasCoordinates(world);

    console.log('Calling tool.onPointerDown with:', { world, canvas });
    this.currentTool.onPointerDown(e, world, canvas);
  }

  /**
   * Handle pointer move
   * @private
   */
  handlePointerMove(e) {
    if (!this.currentTool) return;

    const world = this.getWorldCoordinates(e);
    const canvas = this.getCanvasCoordinates(world);

    this.currentTool.onPointerMove(e, world, canvas);
  }

  /**
   * Handle pointer up
   * @private
   */
  handlePointerUp(e) {
    if (!this.currentTool) return;

    const world = this.getWorldCoordinates(e);
    const canvas = this.getCanvasCoordinates(world);

    this.currentTool.onPointerUp(e, world, canvas);
  }

  /**
   * Handle key down
   * @private
   */
  handleKeyDown(e) {
    // Ignore if typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Global shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.redo();
      return;
    }

    // Pass to current tool
    if (this.currentTool) {
      this.currentTool.onKeyDown(e);
    }
  }

  /**
   * Get world coordinates from event
   * @private
   */
  getWorldCoordinates(e) {
    if (this.pannerZoomer) {
      return this.pannerZoomer.toWorld(e.clientX, e.clientY);
    }

    // Debug mode: no panner-zoomer, use direct canvas coordinates
    const rect = this.canvasManager.canvas.getBoundingClientRect();
    return {
      wx: e.clientX - rect.left,
      wy: e.clientY - rect.top,
    };
  }

  /**
   * Get canvas coordinates from world coordinates
   * @private
   */
  getCanvasCoordinates(world) {
    // IMPORTANT: toWorld() already converts screen coords to world coords
    // Since our canvases are positioned at (0, 0) in world space,
    // world coordinates ARE canvas pixel coordinates!
    // No additional transformation needed.
    return {
      x: Math.floor(world.wx),
      y: Math.floor(world.wy),
    };
  }

  /**
   * Render tool overlay
   * @private
   */
  renderOverlay() {
    if (!this.currentTool) return;

    // Clear overlay
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);

    // Let tool render its overlay
    this.currentTool.renderOverlay(this.overlayCtx);

    this.emit('overlayRendered');
  }

  /**
   * Undo last operation
   */
  undo() {
    const imageData = this.historyManager.undo();
    if (imageData) {
      this.canvasManager.putImageData(imageData);
      this.uiManager.showNotification('Undo', 'info');
    }
  }

  /**
   * Redo last undone operation
   */
  redo() {
    const imageData = this.historyManager.redo();
    if (imageData) {
      this.canvasManager.putImageData(imageData);
      this.uiManager.showNotification('Redo', 'info');
    }
  }

  /**
   * Jump to a specific state in history
   * @param {number} index - History index to jump to
   */
  jumpTo(index) {
    const imageData = this.historyManager.jumpTo(index);
    if (imageData) {
      this.canvasManager.putImageData(imageData);
      this.uiManager.showNotification('Jumped to history state', 'info');
    }
  }

  /**
   * Get overlay canvas for rendering in panner-zoomer
   * @returns {HTMLCanvasElement}
   */
  getOverlayCanvas() {
    return this.overlayCanvas;
  }
}
