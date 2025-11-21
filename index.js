/**
 * Image Cleaner - Main Entry Point
 * 9-Slice preparation tool with smart selection and Gaussian blur
 */

// Import panner-zoomer for pan/zoom functionality
import 'panner-zoomer';

// Import Application and Tools
import { Application } from './modules/Application.js';
import { ZoomTool } from './modules/tools/ZoomTool.js';
import { SelectTool } from './modules/tools/SelectTool.js';
import { PenTool } from './modules/tools/PenTool.js';
import { BlurTool } from './modules/tools/BlurTool.js';
import { ClearTool } from './modules/tools/ClearTool.js';
import { ExportTool } from './modules/tools/ExportTool.js';

// -----------------------------------------------------------------
// Initialize Application
// -----------------------------------------------------------------

const app = new Application();

// Get DOM elements
const pz = document.getElementById('pz');
const mainCanvas = document.getElementById('main-canvas');
const overlayCanvas = document.getElementById('overlay-canvas');
const toolboxContainer = document.getElementById('toolbox');
const optionsContainer = document.getElementById('options-panel');
const historyContainer = document.getElementById('history-panel');
const loadImageBtn = document.getElementById('load-image-btn');
const imageInput = document.getElementById('image-input');

// Wait for panner-zoomer to be ready
await customElements.whenDefined('panner-zoomer');

// Initialize panner-zoomer
pz.setPanOnContent(true);
pz.setManageCursor(false); // Don't manage cursor - let tools control cursor
pz.setPanButtons([1]); // Only middle mouse button triggers panning

// Initialize application
await app.initialize({
  canvas: mainCanvas,
  overlayCanvas: overlayCanvas,
  toolbox: toolboxContainer,
  options: optionsContainer,
  history: historyContainer,
  pannerZoomer: pz,
  initialImage: 'example.png',
});

// -----------------------------------------------------------------
// Register Tools
// -----------------------------------------------------------------

app.registerTool(new ZoomTool());
app.registerTool(new SelectTool());
app.registerTool(new PenTool());
app.registerTool(new BlurTool());
app.registerTool(new ClearTool());
app.registerTool(new ExportTool());

// Populate toolbox with registered tools
app.uiManager.populateToolbox(app.pluginSystem.getAllTools());

// Set default tool to Select
app.setTool('select');

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
// Overlay Rendering Integration with panner-zoomer
// -----------------------------------------------------------------

// Simple overlay sync - just match canvas dimensions
// Both canvases are inside panner-zoomer and will be transformed together
function syncOverlayCanvas() {
  // Match canvas pixel dimensions
  overlayCanvas.width = mainCanvas.width;
  overlayCanvas.height = mainCanvas.height;

  // Redraw overlay after resize (setting width/height clears the canvas)
  if (app) {
    app.renderOverlay();
  }

  // Ensure overlay is positioned at same location as main canvas
  overlayCanvas.style.position = 'absolute';
  overlayCanvas.style.left = '0';
  overlayCanvas.style.top = '0';
  overlayCanvas.style.pointerEvents = 'none';

  console.log('Overlay synced:', overlayCanvas.width, 'x', overlayCanvas.height);
}

// Listen for app events
app.on('imageLoaded', () => {
  syncOverlayCanvas();
  console.log('Image loaded successfully');
});

app.on('overlayRendered', () => {
  // No need to reposition, just let panner-zoomer handle transform
});

// Initial sync
setTimeout(syncOverlayCanvas, 100);

// -----------------------------------------------------------------
// Window Resize Handler
// -----------------------------------------------------------------

window.addEventListener('resize', () => {
  syncOverlayCanvas();
});

// -----------------------------------------------------------------
// Development Helpers
// -----------------------------------------------------------------

// Expose app globally for debugging
window.app = app;

console.log('Image Cleaner initialized');
console.log('Available tools:', Array.from(app.pluginSystem.getAllTools().keys()));
console.log('Use window.app to access the application instance');
