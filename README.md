# Image Cleaner - 9-Slice Preparation Tool

A powerful web-based image editor for preparing pixel art UI components for 9-slice scaling. Built with vanilla JavaScript, no external 3rd party dependencies.

## 🌐 Try It Online

**Live Demo:** https://catpea.github.io/image-cleaner/

No installation required! Open the link in any modern browser and start editing immediately.

## 📦 Installation

### Option 1: Use Online (Recommended)
Visit https://catpea.github.io/image-cleaner/ - zero installation, works instantly!

### Option 2: Install via npm
```bash
npm install image-cleaner
cd node_modules/image-cleaner
npm start
```

### Option 3: Clone from GitHub
```bash
git clone https://github.com/catpea/image-cleaner.git
cd image-cleaner
npm install
npm start
```

## Features

### 🎯 Smart Selection Tool
- **Multi-marker selection**: Drop multiple markers to select regions of similar color
- **Selection Arithmetic (Boolean Operations)**:
  - Normal Click: Replace selection
  - Shift + Click: ADD to selection (Union)
  - Alt + Click: SUBTRACT from selection (Difference)
  - Shift + Alt + Click: INTERSECT with selection
- **Global Color Range**: Select ALL similar colors across entire image (perfect for background removal!)
- **Color similarity detection**: Uses perceptual color distance for accurate selection
- **Contiguous/Non-contiguous modes**: Select connected regions or all similar colors
- **Adjustable threshold**: Fine-tune color tolerance (0-255)
- **Grow/Shrink selection**: Expand or contract selection by pixels
- **Feather edges**: Smooth selection boundaries with distance transform
- **Invert Selection**: Flip selected/unselected regions

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

### 💡 Comprehensive Tooltips
- **Every interactive element** has detailed tooltips (using HTML `title` attribute)
- **Hover over any button, slider, or checkbox** to learn what it does
- **Tooltips include**:
  - Clear explanations of each feature
  - Recommended values and use cases
  - Keyboard shortcuts and workflows
  - Technical details about algorithms
- **Never be confused** - all features are self-documenting!

## How to Use

### ⚡ Quick Start - Remove Background for 9-Slice

The fastest workflow for preparing pixel art UI components:

1. **Load your image** - Click "Load Image" button
2. **Select tool** - Click "Select" in the toolbox
3. **Enable Global Color Range** - Check the box in options panel
4. **Click background color** - One click selects entire background
5. **Clear tool** - Click "Clear" in toolbox
6. **Click "Clear Background"** - Instant transparent background!
7. **Export** - Click "Export" → "Export PNG"

Done! Your image is ready for 9-slice scaling with transparent background.

### Detailed Instructions

### 1. Load an Image
- Click "Load Image" in the header
- Select a PNG, JPG, or other image file
- The image will load in the canvas with pan/zoom always enabled (drag to pan, scroll to zoom)

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

### General
- **Ctrl+Z**: Undo
- **Ctrl+Y** or **Ctrl+Shift+Z**: Redo

### Selection Tool
- **Click**: Replace selection (new selection)
- **Shift + Click**: Add to selection (union)
- **Alt + Click**: Subtract from selection (difference)
- **Shift + Alt + Click**: Intersect with selection
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
# or
npm start

# Open http://localhost:8083
```

## 🚀 GitHub Pages Deployment

This project is deployed to GitHub Pages at https://catpea.github.io/image-cleaner/

### Important: The `.nojekyll` File

The repository includes a `.nojekyll` file in the root directory. This is **essential** for GitHub Pages deployment.

**Why it's needed:**
- GitHub Pages uses Jekyll by default to process static sites
- Jekyll ignores the `node_modules/` directory by default
- This project requires `node_modules/panner-zoomer/` to be served directly
- Without `.nojekyll`, the panner-zoomer dependency would be invisible, breaking the application

**The Solution:**
Adding a `.nojekyll` file tells GitHub Pages to skip Jekyll processing entirely and serve files as-is. This allows:
- Direct serving of ES6 modules from `node_modules/`
- Zero build step deployment
- Pure vanilla JavaScript with dependencies intact

**Reference:**
According to [GitHub's Jekyll 3.3 announcement](https://github.blog/news-insights/the-library/what-s-new-in-github-pages-with-jekyll-3-3/), Jekyll ignores `vendor` and `node_modules` directories by default for faster builds.

### Alternative Approaches

If you prefer to use Jekyll:
1. Create `_config.yml` with `exclude: []` to include node_modules
2. OR add a build step to bundle dependencies (defeats "no dependencies" philosophy)

The `.nojekyll` approach is the cleanest solution for pure vanilla JavaScript projects.

## Code Style

Follow the conventions in STYLEGUIDE.md:
- camelCase for variables and functions
- UPPER_CASE for constants
- kebab-case for CSS classes
- Pixel-perfect rendering with Math.round()
- Event-driven architecture

## Future Enhancements

Potential additions for the plugin system:
- **Selection Tools**:
  - Magnetic Lasso (edge-snapping selection)
  - Quick Mask Mode (paint selections)
  - Selection from brightness/luminosity
  - Save/Load selections as channels
  - Transform selection boundary (move, scale, rotate)
- **Image Processing**:
  - Edge detection (Sobel, Canny)
  - Morphological operations (erosion, dilation, opening, closing)
  - Color decontamination for edges
  - Minimum/Maximum filters
- **Drawing Tools**:
  - Brush tools with variable size and hardness
  - Gradient fill
  - Shape tools (rectangle, ellipse, polygon)
- **Advanced Features**:
  - Layer system with blending modes
  - Batch processing multiple images
  - Custom filter plugins
  - Undo/redo for selection operations
  - Selection transform (rotate, scale selection area)

## 🤝 Contributing

Contributions are welcome! This project is open source and community-driven.

**Ways to contribute:**
- Report bugs via [GitHub Issues](https://github.com/catpea/image-cleaner/issues)
- Submit feature requests
- Create pull requests with improvements
- Write plugins and share them with the community
- Improve documentation
- Share your pixel art workflows

### Development Setup
```bash
git clone https://github.com/catpea/image-cleaner.git
cd image-cleaner
npm install
npm start
```

See STYLEGUIDE.md for code conventions.

## 🙏 Credits

**Author:** [catpea](https://github.com/catpea)

**AI Collaboration:** Developed with assistance from Claude (Anthropic) - demonstrating the power of human-AI collaboration in creating open source tools for the creative community.

**Dependencies:**
- [panner-zoomer](https://www.npmjs.com/package/panner-zoomer) by catpea - Pan/zoom web component

**Inspiration:** Built to help artists prepare Midjourney-generated pixel art for 9-slice scaling and game development.

## 📄 License

MIT License - Free to use, modify, and distribute.

**Mission:** Bringing professional image editing tools to the web, helping people discover the beauty of pixels. 🎨✨
