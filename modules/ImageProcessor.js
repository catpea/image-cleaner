/**
 * ImageProcessor - Image processing operations
 * Gaussian blur, transparency, color adjustments, etc.
 */

export class ImageProcessor {
  /**
   * Generate Gaussian kernel
   * @param {number} radius - Blur radius
   * @param {number} [sigma] - Standard deviation (auto-calculated if not provided)
   * @returns {Float32Array} Gaussian kernel
   */
  generateGaussianKernel(radius, sigma = null) {
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size);

    if (sigma === null) {
      sigma = radius / 3;
    }

    let sum = 0;
    for (let i = 0; i < size; i++) {
      const x = i - radius;
      kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
      sum += kernel[i];
    }

    // Normalize
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  /**
   * Apply Gaussian blur to image
   * @param {ImageData} imageData - Source image data
   * @param {number} radius - Blur radius in pixels
   * @param {Uint8Array} [mask] - Optional selection mask
   * @returns {ImageData} Blurred image data
   */
  gaussianBlur(imageData, radius, mask = null) {
    if (radius === 0) {
      return new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      );
    }

    const width = imageData.width;
    const height = imageData.height;
    const kernel = this.generateGaussianKernel(radius);

    // Separate horizontal and vertical passes for efficiency
    const temp = this.horizontalBlur(imageData, kernel, mask);
    const result = this.verticalBlur(temp, kernel, mask, imageData.data);

    return result;
  }

  /**
   * Horizontal blur pass
   * @private
   */
  horizontalBlur(imageData, kernel, mask) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const temp = new ImageData(width, height);
    const tempData = temp.data;
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const shouldBlur = !mask || mask[pixelIndex] > 0;

        if (shouldBlur) {
          let r = 0, g = 0, b = 0, a = 0;
          let weightSum = 0;

          for (let kx = -radius; kx <= radius; kx++) {
            const sampleX = Math.min(Math.max(x + kx, 0), width - 1);
            const sampleIndex = (y * width + sampleX) * 4;
            const weight = kernel[kx + radius];

            // Apply mask if provided
            const samplePixelIndex = y * width + sampleX;
            const maskWeight = mask ? mask[samplePixelIndex] / 255 : 1;
            const finalWeight = weight * maskWeight;

            r += data[sampleIndex] * finalWeight;
            g += data[sampleIndex + 1] * finalWeight;
            b += data[sampleIndex + 2] * finalWeight;
            a += data[sampleIndex + 3] * finalWeight;
            weightSum += finalWeight;
          }

          const outIndex = (y * width + x) * 4;
          if (weightSum > 0) {
            tempData[outIndex] = r / weightSum;
            tempData[outIndex + 1] = g / weightSum;
            tempData[outIndex + 2] = b / weightSum;
            tempData[outIndex + 3] = a / weightSum;
          } else {
            // No samples, keep original
            tempData[outIndex] = data[outIndex];
            tempData[outIndex + 1] = data[outIndex + 1];
            tempData[outIndex + 2] = data[outIndex + 2];
            tempData[outIndex + 3] = data[outIndex + 3];
          }
        } else {
          // Not in mask, keep original
          const index = (y * width + x) * 4;
          tempData[index] = data[index];
          tempData[index + 1] = data[index + 1];
          tempData[index + 2] = data[index + 2];
          tempData[index + 3] = data[index + 3];
        }
      }
    }

    return temp;
  }

  /**
   * Vertical blur pass
   * @private
   */
  verticalBlur(imageData, kernel, mask, originalData) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const result = new ImageData(width, height);
    const resultData = result.data;
    const radius = Math.floor(kernel.length / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = y * width + x;
        const shouldBlur = !mask || mask[pixelIndex] > 0;

        if (shouldBlur) {
          let r = 0, g = 0, b = 0, a = 0;
          let weightSum = 0;

          for (let ky = -radius; ky <= radius; ky++) {
            const sampleY = Math.min(Math.max(y + ky, 0), height - 1);
            const sampleIndex = (sampleY * width + x) * 4;
            const weight = kernel[ky + radius];

            // Apply mask if provided
            const samplePixelIndex = sampleY * width + x;
            const maskWeight = mask ? mask[samplePixelIndex] / 255 : 1;
            const finalWeight = weight * maskWeight;

            r += data[sampleIndex] * finalWeight;
            g += data[sampleIndex + 1] * finalWeight;
            b += data[sampleIndex + 2] * finalWeight;
            a += data[sampleIndex + 3] * finalWeight;
            weightSum += finalWeight;
          }

          const outIndex = (y * width + x) * 4;
          if (weightSum > 0) {
            resultData[outIndex] = r / weightSum;
            resultData[outIndex + 1] = g / weightSum;
            resultData[outIndex + 2] = b / weightSum;
            resultData[outIndex + 3] = a / weightSum;
          } else {
            // No samples, keep original
            resultData[outIndex] = originalData[outIndex];
            resultData[outIndex + 1] = originalData[outIndex + 1];
            resultData[outIndex + 2] = originalData[outIndex + 2];
            resultData[outIndex + 3] = originalData[outIndex + 3];
          }
        } else {
          // Not in mask, keep original
          const index = (y * width + x) * 4;
          resultData[index] = originalData[index];
          resultData[index + 1] = originalData[index + 1];
          resultData[index + 2] = originalData[index + 2];
          resultData[index + 3] = originalData[index + 3];
        }
      }
    }

    return result;
  }

  /**
   * Clear selection to transparency
   * @param {ImageData} imageData - Source image data
   * @param {Uint8Array} mask - Selection mask
   * @returns {ImageData} Modified image data
   */
  clearToTransparency(imageData, mask) {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    const data = result.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        const alpha = mask[i] / 255;
        data[i * 4 + 3] = data[i * 4 + 3] * (1 - alpha);
      }
    }

    return result;
  }

  /**
   * Fill selection with color
   * @param {ImageData} imageData - Source image data
   * @param {Uint8Array} mask - Selection mask
   * @param {Object} color - Color object {r, g, b, a}
   * @returns {ImageData} Modified image data
   */
  fillSelection(imageData, mask, color) {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    const data = result.data;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        const alpha = mask[i] / 255;
        const index = i * 4;

        // Alpha blend
        const srcA = data[index + 3] / 255;
        const dstA = color.a / 255;
        const outA = dstA * alpha + srcA * (1 - alpha);

        if (outA > 0) {
          data[index] = (color.r * dstA * alpha + data[index] * srcA * (1 - alpha)) / outA;
          data[index + 1] = (color.g * dstA * alpha + data[index + 1] * srcA * (1 - alpha)) / outA;
          data[index + 2] = (color.b * dstA * alpha + data[index + 2] * srcA * (1 - alpha)) / outA;
          data[index + 3] = outA * 255;
        }
      }
    }

    return result;
  }

  /**
   * Calculate average color in selection
   * @param {ImageData} imageData - Source image data
   * @param {Uint8Array} mask - Selection mask
   * @returns {Object} Average color {r, g, b, a}
   */
  getAverageColor(imageData, mask) {
    const data = imageData.data;
    let r = 0, g = 0, b = 0, a = 0;
    let count = 0;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        const weight = mask[i] / 255;
        const index = i * 4;
        r += data[index] * weight;
        g += data[index + 1] * weight;
        b += data[index + 2] * weight;
        a += data[index + 3] * weight;
        count += weight;
      }
    }

    if (count === 0) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count),
      a: Math.round(a / count),
    };
  }

  /**
   * Apply color adjustment to selection
   * @param {ImageData} imageData - Source image data
   * @param {Uint8Array} mask - Selection mask
   * @param {Object} adjustment - Adjustment values {brightness, contrast, saturation, hue}
   * @returns {ImageData} Modified image data
   */
  adjustColors(imageData, mask, adjustment) {
    const result = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    );
    const data = result.data;

    const brightness = adjustment.brightness || 0;
    const contrast = adjustment.contrast !== undefined ? adjustment.contrast : 1;
    const saturation = adjustment.saturation !== undefined ? adjustment.saturation : 1;

    for (let i = 0; i < mask.length; i++) {
      if (mask[i] > 0) {
        const alpha = mask[i] / 255;
        const index = i * 4;

        let r = data[index];
        let g = data[index + 1];
        let b = data[index + 2];

        // Apply brightness
        r += brightness;
        g += brightness;
        b += brightness;

        // Apply contrast
        r = ((r - 128) * contrast + 128);
        g = ((g - 128) * contrast + 128);
        b = ((b - 128) * contrast + 128);

        // Apply saturation
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation;
        g = gray + (g - gray) * saturation;
        b = gray + (b - gray) * saturation;

        // Blend with original based on mask alpha
        data[index] = Math.max(0, Math.min(255, data[index] * (1 - alpha) + r * alpha));
        data[index + 1] = Math.max(0, Math.min(255, data[index + 1] * (1 - alpha) + g * alpha));
        data[index + 2] = Math.max(0, Math.min(255, data[index + 2] * (1 - alpha) + b * alpha));
      }
    }

    return result;
  }
}
