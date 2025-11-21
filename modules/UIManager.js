/**
 * UIManager - Manages UI panels and controls
 * Handles toolbox, options panel, and history panel
 */
import { EventEmitter } from './EventEmitter.js';

export class UIManager extends EventEmitter {
  constructor() {
    super();
    this.toolboxContainer = null;
    this.optionsContainer = null;
    this.historyContainer = null;
    this.currentTool = null;
  }

  /**
   * Initialize UI with container elements
   * @param {Object} containers - Container elements {toolbox, options, history}
   */
  initialize(containers) {
    this.toolboxContainer = containers.toolbox;
    this.optionsContainer = containers.options;
    this.historyContainer = containers.history;
  }

  /**
   * Populate toolbox with tools
   * @param {Map} tools - Map of tool name to tool instance
   * @param {Array} hiddenTools - Optional array of tool names to hide
   */
  populateToolbox(tools, hiddenTools = []) {
    if (!this.toolboxContainer) return;

    this.toolboxContainer.innerHTML = '';

    for (const [name, tool] of tools) {
      // Skip hidden tools
      if (hiddenTools.includes(name)) {
        continue;
      }

      const button = document.createElement('button');
      button.className = 'tool-button';
      button.dataset.tool = name;
      button.textContent = this.formatToolName(name);

      // Add tooltip if tool provides description
      if (tool.getDescription) {
        button.title = tool.getDescription();
      }

      button.addEventListener('click', () => {
        this.emit('toolSelected', { name, tool });
      });

      this.toolboxContainer.appendChild(button);
    }
  }

  /**
   * Set active tool in UI
   * @param {string} toolName - Tool name
   */
  setActiveTool(toolName) {
    const buttons = this.toolboxContainer.querySelectorAll('.tool-button');
    buttons.forEach(btn => {
      if (btn.dataset.tool === toolName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  /**
   * Update options panel for current tool
   * @param {Object} tool - Tool instance
   */
  updateOptionsPanel(tool) {
    if (!this.optionsContainer) return;

    this.currentTool = tool;
    this.optionsContainer.innerHTML = '';

    if (!tool) return;

    // Add tool name header
    const header = document.createElement('h3');
    header.textContent = this.formatToolName(tool.name);
    header.className = 'options-header';
    this.optionsContainer.appendChild(header);

    // Get options schema from tool
    const schema = tool.getOptionsSchema();

    for (const option of schema) {
      const control = this.createControl(option, tool);
      if (control) {
        this.optionsContainer.appendChild(control);
      }
    }
  }

  /**
   * Create a control element from schema
   * @private
   */
  createControl(option, tool) {
    const wrapper = document.createElement('div');
    wrapper.className = 'option-control';

    switch (option.type) {
      case 'slider':
        return this.createSlider(option, tool, wrapper);
      case 'checkbox':
        return this.createCheckbox(option, tool, wrapper);
      case 'button':
        return this.createButton(option, tool, wrapper);
      case 'text':
        return this.createTextInput(option, tool, wrapper);
      case 'color':
        return this.createColorInput(option, tool, wrapper);
      default:
        return null;
    }
  }

  /**
   * Create slider control
   * @private
   */
  createSlider(option, tool, wrapper) {
    const label = document.createElement('label');
    label.textContent = option.label;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = option.value;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = option.min;
    slider.max = option.max;
    slider.step = option.step;
    slider.value = option.value;

    // Add tooltip if description provided
    if (option.description) {
      slider.title = option.description;
      label.title = option.description;
    }

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = value;
      tool.updateOptions({ [option.name]: value });

      // Auto-update selection for select tool
      if (tool.name === 'select' && tool.updateSelection) {
        tool.updateSelection();
      }
    });

    wrapper.appendChild(label);
    wrapper.appendChild(valueDisplay);
    wrapper.appendChild(slider);

    return wrapper;
  }

  /**
   * Create checkbox control
   * @private
   */
  createCheckbox(option, tool, wrapper) {
    const label = document.createElement('label');
    label.className = 'checkbox-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = option.value;

    // Add tooltip if description provided
    if (option.description) {
      checkbox.title = option.description;
      label.title = option.description;
    }

    checkbox.addEventListener('change', (e) => {
      tool.updateOptions({ [option.name]: e.target.checked });

      // Auto-update selection for select tool
      if (tool.name === 'select' && tool.updateSelection) {
        tool.updateSelection();
      }
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(' ' + option.label));
    wrapper.appendChild(label);

    return wrapper;
  }

  /**
   * Create button control
   * @private
   */
  createButton(option, tool, wrapper) {
    const button = document.createElement('button');
    button.className = 'action-button';
    button.textContent = option.label;

    // Add tooltip if description provided
    if (option.description) {
      button.title = option.description;
    }

    button.addEventListener('click', () => {
      if (option.action) {
        option.action();
      }
    });

    wrapper.appendChild(button);

    return wrapper;
  }

  /**
   * Create text input control
   * @private
   */
  createTextInput(option, tool, wrapper) {
    const label = document.createElement('label');
    label.textContent = option.label;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = option.value;

    // Add tooltip if description provided
    if (option.description) {
      input.title = option.description;
      label.title = option.description;
    }

    input.addEventListener('input', (e) => {
      tool.updateOptions({ [option.name]: e.target.value });
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }

  /**
   * Create color input control
   * @private
   */
  createColorInput(option, tool, wrapper) {
    const label = document.createElement('label');
    label.textContent = option.label;

    const input = document.createElement('input');
    input.type = 'color';
    input.value = option.value;
    input.style.width = '100%';
    input.style.height = '40px';
    input.style.cursor = 'pointer';

    // Add tooltip if description provided
    if (option.description) {
      input.title = option.description;
      label.title = option.description;
    }

    input.addEventListener('input', (e) => {
      tool.updateOptions({ [option.name]: e.target.value });
    });

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
  }

  /**
   * Update history panel
   * @param {Array} history - History items
   * @param {Function} onJumpTo - Optional callback when history item is clicked
   */
  updateHistoryPanel(history, onJumpTo = null) {
    if (!this.historyContainer) return;

    this.historyContainer.innerHTML = '';

    const header = document.createElement('h3');
    header.textContent = 'History';
    header.className = 'history-header';
    this.historyContainer.appendChild(header);

    const list = document.createElement('ul');
    list.className = 'history-list';

    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      const li = document.createElement('li');
      li.className = 'history-item';
      if (item.isCurrent) {
        li.classList.add('current');
      }

      // Make history items clickable
      li.style.cursor = 'pointer';
      li.title = `Click to revert to: ${item.description}`;

      if (onJumpTo) {
        li.addEventListener('click', () => {
          onJumpTo(item.index);
        });
      }

      const description = document.createElement('span');
      description.textContent = item.description;

      const time = document.createElement('span');
      time.className = 'history-time';
      time.textContent = this.formatTime(item.timestamp);

      li.appendChild(description);
      li.appendChild(time);
      list.appendChild(li);
    }

    this.historyContainer.appendChild(list);
  }

  /**
   * Add undo/redo buttons
   * @param {Function} onUndo - Undo callback
   * @param {Function} onRedo - Redo callback
   */
  addHistoryControls(onUndo, onRedo) {
    if (!this.historyContainer) return;

    const controls = document.createElement('div');
    controls.className = 'history-controls';

    const undoBtn = document.createElement('button');
    undoBtn.textContent = 'Undo (Ctrl+Z)';
    undoBtn.id = 'undo-button';
    undoBtn.addEventListener('click', onUndo);

    const redoBtn = document.createElement('button');
    redoBtn.textContent = 'Redo (Ctrl+Y)';
    redoBtn.id = 'redo-button';
    redoBtn.addEventListener('click', onRedo);

    controls.appendChild(undoBtn);
    controls.appendChild(redoBtn);

    this.historyContainer.insertBefore(controls, this.historyContainer.firstChild);
  }

  /**
   * Update undo/redo button states
   * @param {boolean} canUndo
   * @param {boolean} canRedo
   */
  updateHistoryButtons(canUndo, canRedo) {
    const undoBtn = document.getElementById('undo-button');
    const redoBtn = document.getElementById('redo-button');

    if (undoBtn) {
      undoBtn.disabled = !canUndo;
    }
    if (redoBtn) {
      redoBtn.disabled = !canRedo;
    }
  }

  /**
   * Format tool name for display
   * @private
   */
  formatToolName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Format timestamp
   * @private
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + 'm ago';
    } else {
      return date.toLocaleTimeString();
    }
  }

  /**
   * Show loading indicator
   */
  showLoading() {
    // Could add loading overlay
    this.emit('loadingStarted');
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    this.emit('loadingStopped');
  }

  /**
   * Show notification message
   * @param {string} message - Message to show
   * @param {string} type - Message type (info, success, error)
   */
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }
}
