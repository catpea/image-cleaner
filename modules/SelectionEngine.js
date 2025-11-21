/**
 * SelectionEngine - Smart selection tools for content-aware selection
 * Implements flood fill, color similarity, edge detection, and multi-marker selection
 */

export class SelectionEngine {
  constructor() {
    this.markers = [];
  }

  /**
   * Calculate color distance using Euclidean distance in RGB space
   * @param {number} r1 - Red component of color 1
   * @param {number} g1 - Green component of color 1
   * @param {number} b1 - Blue component of color 1
   * @param {number} r2 - Red component of color 2
   * @param {number} g2 - Green component of color 2
   * @param {number} b2 - Blue component of color 2
   * @returns {number} Distance between colors (0-441.67)
   */
  colorDistance(r1, g1, b1, r2, g2, b2) {
    return Math.sqrt(
      Math.pow(r2 - r1, 2) +
      Math.pow(g2 - g1, 2) +
      Math.pow(b2 - b1, 2)
    );
  }

  /**
   * Calculate color distance with weighted channels (perceptual)
   * More accurate for human perception
   * @returns {number} Perceptual distance
   */
  perceptualColorDistance(r1, g1, b1, r2, g2, b2) {
    const rMean = (r1 + r2) / 2;
    const deltaR = r1 - r2;
    const deltaG = g1 - g2;
    const deltaB = b1 - b2;

    const weightR = 2 + rMean / 256;
    const weightG = 4;
    const weightB = 2 + (255 - rMean) / 256;

    return Math.sqrt(
      weightR * deltaR * deltaR +
      weightG * deltaG * deltaG +
      weightB * deltaB * deltaB
    );
  }

  /**
   * Flood fill selection with color threshold
   * @param {ImageData} imageData - Source image data
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} threshold - Color difference threshold (0-255)
   * @param {boolean} [contiguous=true] - Whether to only select contiguous regions
   * @param {boolean} [perceptual=true] - Use perceptual color distance
   * @returns {Uint8Array} Selection mask (255 = selected, 0 = not selected)
   */
  floodFill(imageData, startX, startY, threshold, contiguous = true, perceptual = true) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const mask = new Uint8Array(width * height);

    // Get starting pixel color
    const startIndex = (startY * width + startX) * 4;
    const startR = data[startIndex];
    const startG = data[startIndex + 1];
    const startB = data[startIndex + 2];

    const colorDist = perceptual
      ? this.perceptualColorDistance.bind(this)
      : this.colorDistance.bind(this);

    if (contiguous) {
      // Flood fill algorithm using queue (BFS)
      const queue = [[startX, startY]];
      const visited = new Uint8Array(width * height);
      visited[startY * width + startX] = 1;

      while (queue.length > 0) {
        const [x, y] = queue.shift();
        const index = (y * width + x) * 4;
        const pixelIndex = y * width + x;

        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        const distance = colorDist(startR, startG, startB, r, g, b);

        if (distance <= threshold) {
          mask[pixelIndex] = 255;

          // Add neighbors to queue
          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIndex = ny * width + nx;
              if (!visited[nIndex]) {
                visited[nIndex] = 1;
                queue.push([nx, ny]);
              }
            }
          }
        }
      }
    } else {
      // Non-contiguous selection - select all similar colors
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];

          const distance = colorDist(startR, startG, startB, r, g, b);

          if (distance <= threshold) {
            mask[y * width + x] = 255;
          }
        }
      }
    }

    return mask;
  }

  /**
   * Multi-marker selection - combines selections from multiple seed points
   * @param {ImageData} imageData - Source image data
   * @param {Array<{x: number, y: number}>} markers - Array of marker positions
   * @param {number} threshold - Color difference threshold
   * @param {boolean} [contiguous=true] - Whether to only select contiguous regions
   * @returns {Uint8Array} Combined selection mask
   */
  multiMarkerSelect(imageData, markers, threshold, contiguous = true) {
    const width = imageData.width;
    const height = imageData.height;
    const combinedMask = new Uint8Array(width * height);

    for (const marker of markers) {
      const mask = this.floodFill(imageData, marker.x, marker.y, threshold, contiguous);

      // Combine masks (OR operation)
      for (let i = 0; i < combinedMask.length; i++) {
        combinedMask[i] = Math.max(combinedMask[i], mask[i]);
      }
    }

    return combinedMask;
  }

  /**
   * Grow selection by specified number of pixels
   * @param {Uint8Array} mask - Selection mask
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} pixels - Number of pixels to grow
   * @returns {Uint8Array} Expanded mask
   */
  growSelection(mask, width, height, pixels) {
    let currentMask = new Uint8Array(mask);

    for (let iteration = 0; iteration < pixels; iteration++) {
      const newMask = new Uint8Array(currentMask);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;

          if (currentMask[index] === 0) {
            // Check if any neighbor is selected
            const neighbors = [
              [x + 1, y],
              [x - 1, y],
              [x, y + 1],
              [x, y - 1],
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIndex = ny * width + nx;
                if (currentMask[nIndex] === 255) {
                  newMask[index] = 255;
                  break;
                }
              }
            }
          }
        }
      }

      currentMask = newMask;
    }

    return currentMask;
  }

  /**
   * Shrink selection by specified number of pixels
   * @param {Uint8Array} mask - Selection mask
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} pixels - Number of pixels to shrink
   * @returns {Uint8Array} Shrunk mask
   */
  shrinkSelection(mask, width, height, pixels) {
    let currentMask = new Uint8Array(mask);

    for (let iteration = 0; iteration < pixels; iteration++) {
      const newMask = new Uint8Array(currentMask);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;

          if (currentMask[index] === 255) {
            // Check if any neighbor is not selected
            const neighbors = [
              [x + 1, y],
              [x - 1, y],
              [x, y + 1],
              [x, y - 1],
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIndex = ny * width + nx;
                if (currentMask[nIndex] === 0) {
                  newMask[index] = 0;
                  break;
                }
              } else {
                // Edge pixel
                newMask[index] = 0;
                break;
              }
            }
          }
        }
      }

      currentMask = newMask;
    }

    return currentMask;
  }

  /**
   * Feather selection edges for smooth transitions
   * @param {Uint8Array} mask - Selection mask
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {number} radius - Feather radius
   * @returns {Uint8Array} Feathered mask with gradient values
   */
  featherSelection(mask, width, height, radius) {
    const feathered = new Uint8Array(mask);

    if (radius === 0) return feathered;

    // Create distance map
    const distances = new Float32Array(width * height);
    for (let i = 0; i < distances.length; i++) {
      distances[i] = mask[i] === 255 ? 0 : Infinity;
    }

    // Calculate distance from selected pixels using distance transform
    // Simplified version - could be optimized with proper distance transform algorithm
    for (let iteration = 0; iteration < radius; iteration++) {
      const newDistances = new Float32Array(distances);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;

          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
          ];

          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nIndex = ny * width + nx;
              newDistances[index] = Math.min(
                newDistances[index],
                distances[nIndex] + 1
              );
            }
          }
        }
      }

      for (let i = 0; i < distances.length; i++) {
        distances[i] = newDistances[i];
      }
    }

    // Convert distances to feathered mask
    for (let i = 0; i < feathered.length; i++) {
      const distance = distances[i];
      if (distance <= radius) {
        feathered[i] = Math.round(255 * (1 - distance / radius));
      } else {
        feathered[i] = 0;
      }
    }

    return feathered;
  }

  /**
   * Create visualization overlay for selection
   * @param {Uint8Array} mask - Selection mask
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @param {string} [color='rgba(0,120,255,0.5)'] - Overlay color
   * @returns {ImageData} Overlay image data
   */
  createSelectionOverlay(mask, width, height, color = 'rgba(0,120,255,0.5)') {
    const overlay = new ImageData(width, height);
    const data = overlay.data;

    // Parse color (simplified - assumes rgba format)
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    const r = match ? parseInt(match[1]) : 0;
    const g = match ? parseInt(match[2]) : 120;
    const b = match ? parseInt(match[3]) : 255;
    const a = match && match[4] ? parseFloat(match[4]) * 255 : 128;

    for (let i = 0; i < mask.length; i++) {
      const alpha = (mask[i] / 255) * a;
      data[i * 4] = r;
      data[i * 4 + 1] = g;
      data[i * 4 + 2] = b;
      data[i * 4 + 3] = alpha;
    }

    return overlay;
  }

  /**
   * Create marching ants border for selection
   * @param {Uint8Array} mask - Selection mask
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array<{x: number, y: number}>} Array of edge pixels
   */
  createMarchingAnts(mask, width, height) {
    const edges = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;

        if (mask[index] === 255) {
          // Check if this is an edge pixel
          const neighbors = [
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1],
          ];

          let isEdge = false;
          for (const [nx, ny] of neighbors) {
            if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
              isEdge = true;
              break;
            }
            const nIndex = ny * width + nx;
            if (mask[nIndex] === 0) {
              isEdge = true;
              break;
            }
          }

          if (isEdge) {
            edges.push({ x, y });
          }
        }
      }
    }

    return edges;
  }
}
