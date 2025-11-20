
import React, { useCallback, useState } from 'react';
import { Asset } from '../types';
import { fileToGenerativePart, analyzeImage } from '../services/geminiService';
import { extractImageMeta } from '../services/imageProcessing';

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

    // 1. Initial Asset state (loading)
    let newAsset: Asset = {
      id: tempId,
      url: objectUrl,
      fileName: file.name,
      uploadDate: new Date().toISOString(),
      computedMeta: { width: 0, height: 0, dominantColors: [], aspectRatio: '?' },
      analysis: null,
      status: 'processing'
    };
    
    onAssetProcessed(newAsset);

    try {
      // 2. Run Client-Side Computer Vision (Real Data)
      const meta = await extractImageMeta(file);
      newAsset = { ...newAsset, computedMeta: { 
        width: meta.width, 
        height: meta.height, 
        dominantColors: meta.dominantColors.map(c => c.hex), // Store hexes
        aspectRatio: meta.aspectRatio
      }};
      onAssetProcessed(newAsset); // Update with meta immediately

      // 3. Run AI Analysis (Semantic Data)
      const base64 = await fileToGenerativePart(file);
      const analysis = await analyzeImage(base64, file.type);
      
      // Merge Computer Vision colors into the AI result for consistency in the types
      if (analysis.visual) {
        analysis.visual.realColorPalette = meta.dominantColors;
      }

      onAssetProcessed({
        ...newAsset,
        analysis,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl' 
            : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
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
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-sm">
            🧠
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">
              建立您的智能资产库
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm">
              集成 <strong>本地 CV 算法</strong> + <strong>Gemini 语义分析</strong>。<br/>
              自动提取：真实色板、构图类型、游戏品类、核心钩子。
            </p>
          </div>
        </div>
      </div>

      {processingFiles.length > 0 && (
        <div className="mt-8 bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <h4 className="text-slate-800 font-semibold mb-4 flex items-center">
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            AI 混合分析引擎运行中 ({processingFiles.length})
          </h4>
          <div className="space-y-2">
            {processingFiles.map((name, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-700 font-medium">{name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-xs">Step 1: CV Color Extraction...</span>
                  <span className="text-blue-600 font-medium animate-pulse">Step 2: Semantic Tagging...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
