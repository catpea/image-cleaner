/**
 * CanvasManager - Manages the working canvas and image
 * Handles loading, rendering, and canvas operations
 */
import { EventEmitter } from './EventEmitter.js';

export class CanvasManager extends EventEmitter {
  constructor() {
    super();
    this.canvas = null;
    this.ctx = null;
    this.sourceImage = null;
    this.workingCanvas = null;
    this.workingCtx = null;
  }

  /**
   * Initialize with a canvas element
   * @param {HTMLCanvasElement} canvas - The canvas element
   */
  initialize(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.webkitImageSmoothingEnabled = false;
    this.ctx.mozImageSmoothingEnabled = false;
    this.ctx.msImageSmoothingEnabled = false;

    // Create working canvas for operations
    this.workingCanvas = document.createElement('canvas');
    this.workingCtx = this.workingCanvas.getContext('2d', { willReadFrequently: true });
    this.workingCtx.imageSmoothingEnabled = false;
  }

  /**
   * Load an image from a URL or File
   * @param {string|File} source - Image URL or File object
   * @returns {Promise<void>}
   */
  async loadImage(source) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.sourceImage = img;

        // Resize canvases to match image
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.workingCanvas.width = img.width;
        this.workingCanvas.height = img.height;

        // Draw to both canvases
        this.ctx.drawImage(img, 0, 0);
        this.workingCtx.drawImage(img, 0, 0);

        this.emit('imageLoaded', { width: img.width, height: img.height });
        resolve();
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      if (source instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
        };
        reader.readAsDataURL(source);
      } else {
        img.src = source;
      }
    });
  }

  /**
   * Get the current canvas ImageData
   * @returns {ImageData}
   */
  getImageData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Put ImageData to the canvas
   * @param {ImageData} imageData - ImageData to render
   */
  putImageData(imageData) {
    this.ctx.putImageData(imageData, 0, 0);
    this.emit('canvasUpdated');
  }

  /**
   * Get the working canvas ImageData
   * @returns {ImageData}
   */
  getWorkingImageData() {
    return this.workingCtx.getImageData(0, 0, this.workingCanvas.width, this.workingCanvas.height);
  }

  /**
   * Put ImageData to the working canvas
   * @param {ImageData} imageData - ImageData to render
   */
  putWorkingImageData(imageData) {
    this.workingCtx.putImageData(imageData, 0, 0);
  }

  /**
   * Sync working canvas to main canvas
   */
  syncToMain() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.workingCanvas, 0, 0);
    this.emit('canvasUpdated');
  }

  /**
   * Sync main canvas to working canvas
   */
  syncToWorking() {
    this.workingCtx.clearRect(0, 0, this.workingCanvas.width, this.workingCanvas.height);
    this.workingCtx.drawImage(this.canvas, 0, 0);
  }

  /**
   * Clear the canvas
   * @param {string} [color] - Optional fill color
   */
  clear(color = null) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (color) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.syncToWorking();
    this.emit('canvasUpdated');
  }

  /**
   * Get dimensions
   * @returns {{width: number, height: number}}
   */
  getDimensions() {
    return {
      width: this.canvas.width,
      height: this.canvas.height,
    };
  }

  /**
   * Convert world coordinates to canvas coordinates
   * @param {number} worldX - World X coordinate
   * @param {number} worldY - World Y coordinate
   * @param {Object} transform - Transform object from panner-zoomer
   * @returns {{x: number, y: number}}
   */
  worldToCanvas(worldX, worldY, transform) {
    return {
      x: Math.floor((worldX - transform.x) / transform.scale),
      y: Math.floor((worldY - transform.y) / transform.scale),
    };
  }

  /**
   * Export canvas as blob
   * @param {string} [type='image/png'] - MIME type
   * @param {number} [quality=1.0] - Image quality (for lossy formats)
   * @returns {Promise<Blob>}
   */
  async exportBlob(type = 'image/png', quality = 1.0) {
    return new Promise((resolve) => {
      this.canvas.toBlob((blob) => resolve(blob), type, quality);
    });
  }

  /**
   * Download canvas as file
   * @param {string} [filename='image.png'] - Filename
   * @param {string} [type='image/png'] - MIME type
   */
  async download(filename = 'image.png', type = 'image/png') {
    const blob = await this.exportBlob(type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
