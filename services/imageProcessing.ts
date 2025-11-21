
import { ColorData, ComputedMeta } from '../types';

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => 
  "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

/**
 * Extracts real data from the image using HTML5 Canvas.
 * This prevents LLM "hallucination" regarding colors and dimensions.
 */
export const extractImageMeta = async (file: File): Promise<ComputedMeta> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Resize for performance (max 200px) for color/brightness analysis
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts: Record<string, { count: number, r: number, g: number, b: number }> = {};
      
      // Quantize and count colors (Simple clustering)
      const pixelStep = 4 * 5; // Sample every 5th pixel for better accuracy
      let totalPixels = 0;
      let totalBrightness = 0;
      const brightnessValues: number[] = [];

      for (let i = 0; i < imageData.length; i += pixelStep) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        
        // Brightness (Luminance standard: 0.299R + 0.587G + 0.114B)
        // Range 0-255
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        brightnessValues.push(brightness);

        // Quantize to nearest 32 to group similar colors
        const key = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
        
        if (!colorCounts[key]) {
          colorCounts[key] = { count: 0, r, g, b };
        }
        colorCounts[key].count++;
        totalPixels++;
      }

      // Calculate Avg Brightness
      const pixelCount = brightnessValues.length;
      const avgBrightness = pixelCount > 0 ? totalBrightness / pixelCount : 0;

      // Calculate Contrast (Standard Deviation of Brightness)
      // A completely gray image has 0 contrast. A high contrast image has high variance.
      let sumSqDiff = 0;
      for (const b of brightnessValues) {
        sumSqDiff += Math.pow(b - avgBrightness, 2);
      }
      // Normalize slightly: typical std dev for image is 40-80. We can map it to 0-100 roughly.
      const stdDev = pixelCount > 0 ? Math.sqrt(sumSqDiff / pixelCount) : 0;
      const contrast = Math.min(100, (stdDev / 128) * 100 * 2); // Approximate scaling

      // Sort and get top 5 colors
      const sortedColors = Object.values(colorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(c => rgbToHex(c.r, c.g, c.b));

      // Aspect Ratio
      const ratio = img.width / img.height;
      let arString = "16:9"; // default
      if (Math.abs(ratio - 1) < 0.1) arString = "1:1";
      else if (Math.abs(ratio - 0.5625) < 0.1) arString = "9:16";
      else if (Math.abs(ratio - 0.75) < 0.1) arString = "3:4";
      else if (Math.abs(ratio - 1.33) < 0.1) arString = "4:3";
      
      resolve({
        width: img.width,
        height: img.height,
        aspectRatio: arString,
        dominantColors: sortedColors,
        brightness: Math.round(avgBrightness),
        contrast: Math.round(contrast) // Now real calculated contrast
      });
    };
    
    img.onerror = reject;
    img.src = objectUrl;
  });
};

/**
 * Compresses and resizes an image to reduce API payload size.
 * This helps avoid 500 Internal Errors from Gemini when sending large files.
 */
export const compressImage = async (file: File, maxWidth = 1024, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Return data URL (JPEG)
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = reject;
    img.src = objectUrl;
  });
};

/**
 * Converts any image file to a standard PNG Blob.
 */
export const fileToPngBlob = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Canvas context failed"));
                return;
            }
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error("Blob conversion failed"));
            }, 'image/png');
        };

        img.onerror = (e) => reject(e);
        img.src = objectUrl;
    });
};
