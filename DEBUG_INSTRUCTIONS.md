# Debug Mode Instructions

## Problem
- Selection not visible
- Changes not showing after clearing selection
- Need to diagnose if panner-zoomer is affecting mouse coordinates

## Solution
Created a debug version **without panner-zoomer** to isolate the issue.

## How to Test

### 1. Open Debug Mode

Navigate to: **http://127.0.0.1:8083/index-debug.html**

(Or replace the port if your server is running on a different port)

### 2. What You'll See

- Same UI layout as normal mode
- **Black debug console at the bottom** showing real-time events
- No pan/zoom capability (that's intentional for debugging)
- Canvases positioned directly, no coordinate transformation

### 3. Test Selection

1. **Select tool should be active by default**
2. **Click anywhere on the image**
3. **Watch the debug console** (black bar at bottom):
   - Should show: "Canvas Click: screen(X, Y) canvas(X, Y)"
   - Should show: "Marker added at (X, Y), total: N"
   - Should show: "Selection updated: N pixels selected"
4. **Look at the canvas**: You should see:
   - Red marker dots where you clicked
   - Blue overlay showing selected region

### 4. Check Coordinates

The debug console will show:
```
Canvas Click: screen(X, Y) canvas(X, Y)
Marker added at (X, Y), total: 1
Selection updated: 12345 pixels selected
Overlay rendered
```

### 5. What to Report

**If you see markers and selection**:
- ✅ Core functionality works
- ❌ Problem is with panner-zoomer integration
- → We need to fix the coordinate transformation

**If you DON'T see markers**:
- Check debug console for coordinates
- Check browser console (F12) for errors
- The issue might be in SelectTool or overlay rendering

**If coordinates look wrong**:
- e.g., clicking center of image shows negative numbers
- e.g., coordinates are much larger than image size
- → Coordinate transformation bug

### 6. Additional Tests

**Test threshold adjustment**:
1. In options panel, adjust "Threshold" slider
2. Debug console should show: "Selection updated" each time
3. Blue overlay should change size

**Test multiple markers**:
1. Click in different locations
2. Each click should show "Marker added"
3. All markers should be visible as red dots

**Test Escape key**:
1. Press Escape
2. Debug console should show markers cleared
3. Red dots and blue overlay should disappear

## Browser Console

Also open browser console (F12) to see:
- Any JavaScript errors
- Full debug logs
- Use `window.app` to inspect application state
- Use `window.debug("message")` to add custom debug output

## Comparing with Normal Mode

| Feature | Normal Mode | Debug Mode |
|---------|-------------|------------|
| Pan/Zoom | ✅ Via Zoom tool | ❌ Disabled |
| Selection | Should work | Should work |
| Coordinates | Transformed by panner-zoomer | Direct canvas coords |
| Debug Console | ❌ None | ✅ Real-time events |

## Next Steps Based on Results

### Case 1: Debug Mode Works
- Core selection logic is fine
- Problem is coordinate transformation with panner-zoomer
- **Fix**: Update coordinate handling in main mode

### Case 2: Debug Mode Doesn't Work
- Issue in SelectTool or rendering
- Check SelectTool.js for bugs
- Check overlay canvas visibility

### Case 3: Coordinates Are Wrong
- Mouse event handling issue
- Check Application.js coordinate methods
- Verify canvas positioning

## Quick Fixes to Try

If selection is invisible but coordinates are correct:

```javascript
// In browser console:
const overlay = document.getElementById('overlay-canvas');
console.log('Overlay:', overlay.style);
console.log('Dimensions:', overlay.width, 'x', overlay.height);
console.log('Position:', overlay.style.left, overlay.style.top);
```

If markers aren't being added:

```javascript
// In browser console:
const selectTool = window.app.pluginSystem.getTool('select');
console.log('Select tool:', selectTool);
console.log('Markers:', selectTool.markers);
console.log('Current mask:', selectTool.currentMask);
```

## Files Created

- `index-debug.html` - Debug mode HTML (no panner-zoomer)
- `index-debug.js` - Debug mode JavaScript with logging
- `DEBUG_INSTRUCTIONS.md` - This file

## Reverting to Normal Mode

Just navigate back to: **http://127.0.0.1:8083/**

Or reload the main `index.html`

---

**Test the debug mode and report what you see in the debug console!** 🔍
