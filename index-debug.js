/**
 * Image Cleaner - DEBUG MODE (No Panner-Zoomer)
 */

// Import Application and Tools
import { Application } from './modules/Application.js';
import { SelectTool } from './modules/tools/SelectTool.js';
import { BlurTool } from './modules/tools/BlurTool.js';
import { ClearTool } from './modules/tools/ClearTool.js';
import { ExportTool } from './modules/tools/ExportTool.js';

// Debug logger
const debugOutput = document.getElementById('debug-output');
function debug(msg) {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  debugOutput.appendChild(line);
  debugOutput.scrollTop = debugOutput.scrollHeight;
  console.log(msg);
}

debug('Starting debug mode...');

// -----------------------------------------------------------------
// Initialize Application
// -----------------------------------------------------------------

const app = new Application();

// Get DOM elements
const mainCanvas = document.getElementById('main-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const toolboxContainer = document.getElementById('toolbox');
const optionsContainer = document.getElementById('options-panel');
const historyContainer = document.getElementById('history-panel');
const loadImageBtn = document.getElementById('load-image-btn');
const imageInput = document.getElementById('image-input');
const canvasContainer = document.getElementById('canvas-container');

debug('DOM elements retrieved');

// Initialize application WITHOUT panner-zoomer
await app.initialize({
  canvas: mainCanvas,
  overlayCanvas: overlayCanvas,
  toolbox: toolboxContainer,
  options: optionsContainer,
  history: historyContainer,
  pannerZoomer: null, // NO PANNER-ZOOMER
  initialImage: 'example.png',
});

debug('Application initialized');

// -----------------------------------------------------------------
// Register Tools
// -----------------------------------------------------------------

app.registerTool(new SelectTool());
app.registerTool(new BlurTool());
app.registerTool(new ClearTool());
app.registerTool(new ExportTool());

debug('Tools registered');

// Populate toolbox with registered tools
app.uiManager.populateToolbox(app.pluginSystem.getAllTools());

// Set default tool
app.setTool('select');

debug('Default tool set to Select');

// -----------------------------------------------------------------
// Setup Image Loading
// -----------------------------------------------------------------

loadImageBtn.addEventListener('click', () => {
  imageInput.click();
});

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    app.loadImage(file);
  }
});

// -----------------------------------------------------------------
// Canvas Event Debugging
// -----------------------------------------------------------------

mainCanvas.addEventListener('pointerdown', (e) => {
  const rect = mainCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  debug(`Canvas Click: screen(${e.clientX}, ${e.clientY}) canvas(${Math.floor(x)}, ${Math.floor(y)})`);
});

// -----------------------------------------------------------------
// Overlay Positioning (Simple - No Transform)
// -----------------------------------------------------------------

function syncOverlayCanvas() {
  overlayCanvas.width = mainCanvas.width;
  overlayCanvas.height = mainCanvas.height;
  overlayCanvas.style.width = mainCanvas.width + 'px';
  overlayCanvas.style.height = mainCanvas.height + 'px';
  debug(`Overlay synced: ${overlayCanvas.width}x${overlayCanvas.height}`);
}

// Listen for app events
app.on('imageLoaded', (dims) => {
  syncOverlayCanvas();
  debug(`Image loaded: ${dims.width}x${dims.height}`);
});

app.on('overlayRendered', () => {
  debug('Overlay rendered');
});

// Initial sync
setTimeout(syncOverlayCanvas, 100);

// -----------------------------------------------------------------
// Tool Event Debugging
// -----------------------------------------------------------------

app.pluginSystem.on('toolRegistered', ({ name, tool }) => {
  tool.on('markerAdded', ({ x, y, total }) => {
    debug(`Marker added at (${x}, ${y}), total: ${total}`);
  });

  tool.on('selectionUpdated', ({ mask }) => {
    const selected = mask.filter(v => v > 0).length;
    debug(`Selection updated: ${selected} pixels selected`);
  });

  tool.on('applied', () => {
    debug('Tool applied');
  });
});

// -----------------------------------------------------------------
// Development Helpers
// -----------------------------------------------------------------

window.app = app;
window.debug = debug;

debug('=== DEBUG MODE READY ===');
debug('Click on the image with Select tool active');
debug('Watch this console for coordinate information');
debug('Check browser console (F12) for more details');

console.log('Debug mode active. Use window.app to access application.');
console.log('Available tools:', Array.from(app.pluginSystem.getAllTools().keys()));
