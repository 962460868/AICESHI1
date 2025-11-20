
import { ColorData } from '../types';

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => 
  "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

// Determine if a color is "warm" (simple heuristic)
const isWarmColor = (r: number, g: number, b: number) => {
  // High Red, Low Blue usually indicates warm
  return r > b; 
};

export interface ImageMeta {
  width: number;
  height: number;
  aspectRatio: string;
  dominantColors: ColorData[];
}

/**
 * Extracts real data from the image using HTML5 Canvas.
 * This prevents LLM "hallucination" regarding colors and dimensions.
 */
export const extractImageMeta = async (file: File): Promise<ImageMeta> => {
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

      // Resize for performance (max 200px)
      const scale = Math.min(1, 200 / Math.max(img.width, img.height));
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCounts: Record<string, { count: number, r: number, g: number, b: number }> = {};
      
      // Quantize and count colors (Simple clustering)
      const pixelStep = 4 * 10; // Sample every 10th pixel
      let totalPixels = 0;

      for (let i = 0; i < imageData.length; i += pixelStep) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        // Quantize to nearest 32 to group similar colors
        const key = `${Math.floor(r / 32) * 32},${Math.floor(g / 32) * 32},${Math.floor(b / 32) * 32}`;
        
        if (!colorCounts[key]) {
          colorCounts[key] = { count: 0, r, g, b };
        }
        colorCounts[key].count++;
        totalPixels++;
      }

      // Sort and get top 5 colors
      const sortedColors = Object.values(colorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map(c => ({
          hex: rgbToHex(c.r, c.g, c.b),
          percentage: Math.round((c.count / totalPixels) * 100),
          isWarm: isWarmColor(c.r, c.g, c.b)
        }));

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
        dominantColors: sortedColors
      });
    };
    
    img.onerror = reject;
    img.src = objectUrl;
  });
};
