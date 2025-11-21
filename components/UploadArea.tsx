
import React, { useCallback, useState } from 'react';
import { Asset, PerformanceLevel } from '../types';
import { analyzeImage, generateEmbedding } from '../services/geminiService';
import { extractImageMeta, compressImage } from '../services/imageProcessing';

interface UploadAreaProps {
  onAssetProcessed: (asset: Asset) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onAssetProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [processingFiles, setProcessingFiles] = useState<string[]>([]);

  const processFile = async (file: File) => {
    const tempId = Math.random().toString(36).substring(7);
    const objectUrl = URL.createObjectURL(file);
    setProcessingFiles(prev => [...prev, file.name]);

    // 1. Initial Asset state
    let newAsset: Asset = {
      id: tempId,
      url: objectUrl,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      computedMeta: { width: 0, height: 0, dominantColors: [], aspectRatio: '?', brightness: 0, contrast: 0 },
      analysis: null,
      status: 'processing',
      performanceLevel: PerformanceLevel.UNRATED
    };
    
    onAssetProcessed(newAsset);

    try {
      // 2. Client-Side Computer Vision (Dimensions, Colors, Brightness, Contrast)
      const meta = await extractImageMeta(file);
      newAsset = { ...newAsset, computedMeta: { 
        width: meta.width, 
        height: meta.height, 
        dominantColors: meta.dominantColors,
        aspectRatio: meta.aspectRatio,
        brightness: meta.brightness,
        contrast: meta.contrast
      }};
      onAssetProcessed(newAsset);

      // 3. Gemini Analysis (With Compressed Image)
      // Compress to max 1024px to avoid 500 errors on huge payloads
      const compressedDataUrl = await compressImage(file);
      const base64Data = compressedDataUrl.split(',')[1]; // Remove "data:image/jpeg;base64," header

      const analysis = await analyzeImage(base64Data, 'image/jpeg');
      
      // Merge CV colors (Trust CV over AI for colors if AI is empty)
      if (analysis.visual && (!analysis.visual.realColorPalette || analysis.visual.realColorPalette.length === 0)) {
        analysis.visual.realColorPalette = meta.dominantColors.map(hex => ({
          hex,
          percentage: 0, 
          isWarm: false // Placeholder
        }));
      }

      // 4. Generate Embedding (Semantic Search)
      // We embed the JSON analysis to create a "Semantic Vector"
      const semanticString = JSON.stringify({
        title: analysis.title,
        genre: analysis.genre,
        hook: analysis.marketing.hookType,
        tags: analysis.tags,
        visualFormula: analysis.strategy.replicationTemplate?.visualFormula
      });
      const embedding = await generateEmbedding(semanticString);

      onAssetProcessed({
        ...newAsset,
        analysis,
        embedding,
        status: 'completed'
      });
    } catch (error) {
      console.error("Processing failed", error);
      onAssetProcessed({
        ...newAsset,
        status: 'failed'
      });
    } finally {
      setProcessingFiles(prev => prev.filter(name => name !== file.name));
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files) as File[];
    files.filter(file => file.type.startsWith('image/')).forEach(processFile);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      files.filter(file => file.type.startsWith('image/')).forEach(processFile);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-20 text-center transition-all duration-300
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-xl' 
            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileSelect}
        />
        
        <div className="space-y-6 pointer-events-none">
          <div className="w-20 h-20 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
            👁️
          </div>
          <div>
            <h3 className="text-2xl font-bold text-zinc-100 mb-2">
              AI 视觉资产分析
            </h3>
            <p className="text-zinc-400 max-w-md mx-auto text-sm">
              支持 <strong>主体检测</strong>、<strong>OCR 文案提取</strong>、<strong>色彩量化</strong> 与 <strong>相似图向量生成</strong>。
            </p>
          </div>
        </div>
      </div>

      {processingFiles.length > 0 && (
        <div className="mt-8 bg-zinc-900 rounded-xl p-6 border border-zinc-800 shadow-sm">
          <h4 className="text-zinc-100 font-semibold mb-4 flex items-center">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            正在进行深度视觉计算 ({processingFiles.length})
          </h4>
          <div className="space-y-2">
            {processingFiles.map((name, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                <span className="text-zinc-300 font-medium">{name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-xs">Step 1: Vision CV...</span>
                  <span className="text-blue-400 font-medium animate-pulse">Step 2: Gemini Embeddings...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
