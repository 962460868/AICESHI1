import React, { useCallback, useState } from 'react';
    import { Asset } from '../types';
    import { fileToGenerativePart, analyzeImage } from '../services/geminiService';
    
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
    
        const newAsset: Asset = {
          id: tempId,
          url: objectUrl,
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          analysis: null,
          status: 'processing'
        };
        
        onAssetProcessed(newAsset);
    
        try {
          const base64 = await fileToGenerativePart(file);
          const analysis = await analyzeImage(base64, file.type);
          
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
                📤
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">
                  拖入游戏买量素材
                </h3>
                <p className="text-slate-500 max-w-md mx-auto">
                  AI 将自动识别品类、拆解构图、分析爽点钩子，并生成优化策略报告。
                </p>
              </div>
              <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm text-slate-500">
                <span>支持格式:</span>
                <span className="font-mono font-medium text-slate-700">PNG, JPG, WEBP</span>
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
                AI 正在深度思考中 ({processingFiles.length})
              </h4>
              <div className="space-y-2">
                {processingFiles.map((name, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-700 font-medium">{name}</span>
                    <span className="text-blue-600 animate-pulse">拆解策略中...</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };