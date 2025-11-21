# Usage Guide - Image Cleaner

## Quick Start

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Open in browser**: http://localhost:8080 (or the port shown)

3. **Load your pixel art**: Click "Load Image" and select a file

4. **Select regions**:
   - Click the **Select** tool
   - Click on similar colored areas to drop markers
   - Adjust threshold to control selection sensitivity

5. **Apply effects**:
   - **Blur tool**: Smooth selected regions with Gaussian blur
   - **Clear tool**: Remove background to transparency

6. **Export**: Click **Export** tool and "Export PNG"

## Detailed Workflows

### Workflow 1: Cleaning UI Component Backgrounds

**Goal**: Remove darker background from a UI component

1. Load your pixel art image
2. Select tool → Click on background area (darker region)
3. Adjust threshold until selection covers entire background
4. Optional: Use "Grow" to expand selection slightly
5. Clear tool → "Clear Background"
6. Export tool → "Export PNG"

### Workflow 2: Smoothing Jagged Edges

**Goal**: Apply blur to smooth out pixelated regions

1. Load your image
2. Select tool → Drop markers on the areas to blur
3. Adjust threshold to select connected pixels
4. Blur tool → Adjust "Blur Radius" (try 5-10)
5. Click "Apply Blur"
6. Undo (Ctrl+Z) if not satisfied, adjust and try again

### Workflow 3: Creating Soft Gradients

**Goal**: Replace selected area with smooth gradient

1. Load your image
2. Select tool → Mark the area
3. Blur tool → Enable "Use Average Color"
4. Set high blur radius (20-40)
5. Click "Apply Blur" - creates smooth tone with hint of variation

### Workflow 4: Multi-Region Selection

**Goal**: Select and modify multiple disconnected regions

1. Select tool → Drop first marker on region A
2. Drop second marker on region B (different area, similar color)
3. Drop third marker on region C
4. All similar colored regions are now selected
5. Apply blur or clear as needed

## Tool Reference

### Select Tool

**Purpose**: Create selections based on color similarity

**Options**:
- **Threshold** (0-255): How different colors can be to still be selected
  - Low (0-30): Very strict, only exact color matches
  - Medium (30-60): Good for most cases
  - High (60-150): Selects broader color ranges

- **Contiguous**: Only select connected pixels vs all similar colors

- **Perceptual**: Use human-perceived color distance (recommended)

- **Grow** (0-50): Expand selection by N pixels

- **Shrink** (0-50): Contract selection by N pixels

- **Feather** (0-50): Smooth selection edges

**Tips**:
- Drop multiple markers to combine selections
- Press ESC to clear all markers
- Press Backspace to remove last marker
- Blue overlay shows current selection
- Red dots show marker positions

### Blur Tool

**Purpose**: Apply Gaussian blur to selected regions

**Options**:
- **Blur Radius** (1-50): Strength of blur
  - 1-5: Subtle smoothing
  - 5-15: Medium blur
  - 15-50: Heavy blur

- **Use Average Color**: Fill with average color + slight variation
  - Good for creating solid-ish fills
  - Faster than full blur
  - Creates consistent tone

**Tips**:
- Always make a selection first
- Higher radius = more processing time
- Use "average color" for faster results on large selections

### Clear Tool

**Purpose**: Erase selected regions to transparency

**Options**:
- **Clear Selection**: Remove selected area
- **Clear Background**: Remove and clear selection markers

**Tips**:
- Requires a selection first
- Results in transparent PNG when exported
- Use Undo (Ctrl+Z) if you clear too much

### Export Tool

**Purpose**: Download cleaned image

**Options**:
- **Filename**: Name for downloaded file

**Tips**:
- Always exports as PNG with transparency
- Original image is never modified
- Use descriptive filenames

## Advanced Techniques

### Technique 1: Edge-Aware Selection

For selecting complex shapes:

1. Start with low threshold (20-30)
2. Drop marker in center of region
3. Gradually increase threshold
4. Watch selection grow to edges
5. Use "Shrink" by 1-2 pixels to pull back from edges
6. Apply feather for smooth edges

### Technique 2: Creating 9-Slice Regions

For preparing UI components:

1. Select and clear outer background
2. Select inner content area
3. Apply slight blur (radius 2-3) for smoothing
4. Export with descriptive name
5. Import into your game engine with 9-slice settings

### Technique 3: Progressive Refinement

For complex editing:

1. Make rough selection (high threshold)
2. Apply effect (blur or clear)
3. Undo (Ctrl+Z)
4. Adjust selection parameters
5. Reapply until satisfied
6. Use history panel to jump to any previous state

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl+Z** | Undo last operation |
| **Ctrl+Y** or **Ctrl+Shift+Z** | Redo |
| **ESC** | Clear all selection markers |
| **Backspace** | Remove last selection marker |

## Plugin System

### Using Plugins

To use the example plugin, add to `index.js`:

```javascript
// At the top
import { ExamplePlugin } from './src/plug-ins/example-plugin.js';

// After app initialization
app.use(ExamplePlugin);
```

The Invert tool will appear in the toolbox!

### Creating Custom Plugins

1. Create a new file in `src/plug-ins/`
2. Import the Tool base class
3. Extend Tool with your functionality
4. Export a plugin object with `install()` method
5. Register in `index.js`

**Example structure**:

```javascript
import { Tool } from '../../modules/Tool.js';

class MyTool extends Tool {
  constructor() {
    super('mytool', { /* options */ });
  }

  apply() {
    // Get image data
    const imageData = this.app.canvasManager.getImageData();

    // Save to history
    this.app.historyManager.push(imageData, 'My Operation');

    // Modify image
    const result = this.processImage(imageData);

    // Update canvas
    this.app.canvasManager.putImageData(result);
  }

  processImage(imageData) {
    // Your image processing here
    return imageData;
  }

  getOptionsSchema() {
    return [
      {
        type: 'button',
        name: 'apply',
        label: 'Apply My Tool',
        action: () => this.apply(),
      },
    ];
  }
}

export const MyPlugin = {
  name: 'my-plugin',
  install(api) {
    api.registerTool('mytool', new MyTool());
  },
  uninstall() {
    // Cleanup
  }
};
```

## Performance Tips

1. **Large images**: Use lower blur radius for faster processing
2. **History memory**: History stores up to 50 states (configurable)
3. **Selection size**: Large selections take longer to blur
4. **Browser performance**: Close other tabs for better performance

## Troubleshooting

### Selection not appearing
- Check that threshold is high enough
- Try clicking directly on the color you want to select
- Ensure "Contiguous" matches your needs

### Blur too slow
- Reduce blur radius
- Try "Use Average Color" mode
- Select smaller regions

### Can't export
- Ensure you have an image loaded
- Check browser allows downloads
- Try a different filename

### Undo doesn't work
- Check you performed an operation first
- Look at history panel for available states
- Ctrl+Z must be pressed (not from input field)

## Browser Compatibility

**Tested browsers**:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required features**:
- ES6 modules
- Canvas API
- Web Components
- File API

## Tips from the Developer

1. **Start with high threshold** and reduce until selection is right
2. **Use multiple markers** for complex selections
3. **Always check history panel** to see what you can undo
4. **Experiment with feather** for smooth edges on UI components
5. **Use pan/zoom** (mouse drag + wheel) to see details
6. **Export frequently** to save intermediate results
7. **Name exports descriptively** (e.g., "button-bg-cleaned.png")

## Examples

Your `example.png` shows pixel art monitors - perfect for this tool!

**To clean one monitor screen**:
1. Select tool → Click on the dark monitor bezel
2. Adjust threshold to select entire bezel
3. Clear tool → Clear Background
4. Select the screen content
5. Blur tool → Radius 5 to smooth
6. Export → "monitor-cleaned.png"

**To prepare for 9-slice**:
1. Clean background (see above)
2. Identify the 9 regions (corners, edges, center)
3. Use selection to mark non-scalable parts
4. Apply slight blur to edges for smooth scaling
5. Export ready for your game engine

Happy editing! 🎨
