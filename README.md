# Image Cleaner - 9-Slice Preparation Tool

A powerful web-based image editor for preparing pixel art UI components for 9-slice scaling. Built with vanilla JavaScript, no external dependencies except panner-zoomer.

## Features

### 🎯 Smart Selection Tool
- **Multi-marker selection**: Drop multiple markers to select regions of similar color
- **Color similarity detection**: Uses perceptual color distance for accurate selection
- **Contiguous/Non-contiguous modes**: Select connected regions or all similar colors
- **Adjustable threshold**: Fine-tune color tolerance (0-255)
- **Grow/Shrink selection**: Expand or contract selection by pixels
- **Feather edges**: Smooth selection boundaries

### 🌫️ Gaussian Blur Tool
- **Strong blur**: Apply Gaussian blur to smooth out selected regions
- **Variable radius**: Adjust blur strength (1-50 pixels)
- **Average color mode**: Fill with average color + hint of tone variation
- **Selection-aware**: Only blurs selected areas

### 🧹 Clear Background Tool
- **Clear to transparency**: Remove selected regions to transparent PNG
- **Smart background removal**: Select and remove backgrounds with one click

### 💾 Export Tool
- **PNG export**: Save cleaned images as transparent PNGs
- **Custom filenames**: Name your exported files

### ⏮️ Undo/Redo System
- **Full history**: Track up to 50 operations
- **Keyboard shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo)
- **History panel**: View all operations with timestamps

### 🔌 Plugin Architecture
- **Extensible**: Easy to add new tools and filters
- **Modular design**: Clean separation of concerns
- **Hook system**: Plugins can intercept and modify operations

## How to Use

### 1. Load an Image
- Click "Load Image" in the header
- Select a PNG, JPG, or other image file
- The image will load in the canvas with pan/zoom enabled

### 2. Select Regions
1. Click the **Select** tool in the toolbox
2. Adjust threshold slider to control color sensitivity
3. Click on the image to drop markers on areas you want to select
4. Drop multiple markers to combine selections
5. Use Grow/Shrink/Feather to refine the selection
6. Press **Escape** to clear markers, **Backspace** to remove last marker

### 3. Apply Effects

#### Blur Selected Region
1. With a selection active, click the **Blur** tool
2. Adjust blur radius
3. Enable "Use Average Color" for solid fill with tone variation
4. Click "Apply Blur"

#### Clear to Transparency
1. With a selection active, click the **Clear** tool
2. Click "Clear Selection" to erase selected area
3. Or click "Clear Background" to remove and clear selection

### 4. Export
1. Click the **Export** tool
2. Optionally change the filename
3. Click "Export PNG"
4. File will download to your browser's download folder

## Keyboard Shortcuts

- **Ctrl+Z**: Undo
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo
- **Escape**: Clear all selection markers
- **Backspace/Delete**: Remove last selection marker

## Technical Architecture

### Core Modules

- **EventEmitter**: Pub/sub event system for module communication
- **Signal**: Reactive state management (SolidJS-inspired)
- **HistoryManager**: Undo/redo with ImageData snapshots
- **CanvasManager**: Canvas operations and image handling
- **SelectionEngine**: Flood fill, color similarity, selection operations
- **ImageProcessor**: Gaussian blur, transparency, color adjustments
- **PluginSystem**: Plugin registration and lifecycle
- **UIManager**: UI panels and controls
- **Application**: Main coordinator

### Tools

- **SelectTool**: Multi-marker smart selection
- **BlurTool**: Gaussian blur with average color mode
- **ClearTool**: Clear to transparency
- **ExportTool**: PNG export

### Selection Algorithms

1. **Flood Fill**: BFS-based contiguous region selection
2. **Color Distance**: Euclidean and perceptual color matching
3. **Grow/Shrink**: Morphological operations
4. **Feathering**: Distance transform for smooth edges

### Image Processing

1. **Gaussian Blur**: Separable convolution (horizontal + vertical passes)
2. **Selection Masking**: Per-pixel alpha blending
3. **Color Averaging**: Weighted average in selected regions

## Plugin Development

Create custom plugins by implementing the plugin interface:

```javascript
const myPlugin = {
  name: 'my-plugin',
  install(api) {
    // Register tools, filters, hooks
    api.registerTool('mytool', new MyTool());
  },
  uninstall() {
    // Cleanup
  }
};

app.use(myPlugin);
```

## Performance

- **Efficient algorithms**: Separable Gaussian blur, optimized flood fill
- **Canvas optimization**: Disabled image smoothing for pixel-perfect rendering
- **History management**: Configurable max states (default: 50)
- **Memory monitoring**: Track history memory usage

## Browser Support

Works in all modern browsers with:
- ES6 modules
- Canvas API
- Web Components (for panner-zoomer)
- File API

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run server

# Open http://localhost:8080
```

## Code Style

Follow the conventions in STYLEGUIDE.md:
- camelCase for variables and functions
- UPPER_CASE for constants
- kebab-case for CSS classes
- Pixel-perfect rendering with Math.round()
- Event-driven architecture

## Future Enhancements

Potential additions for the plugin system:
- Edge detection
- Magic wand with edge-aware selection
- Gradient fill
- Brush tools
- Layer system
- Batch processing
- Custom filters

## License

MIT
