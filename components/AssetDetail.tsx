
import React, { useMemo, useState } from 'react';
import { Asset, BoundingBox, GameProject, PerformanceLevel } from '../types';
import { useAssets } from '../context/AssetContext';
import { findSimilarAssets } from '../services/clusteringService';

interface AssetDetailProps {
  asset: Asset;
  onBack: () => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
  const { assets, updateAssetProject, updateAssetPerformance } = useAssets();
  const [showBoxes, setShowBoxes] = useState(true);
  
  // Find similar assets
  const similarAssets = useMemo(() => {
    return findSimilarAssets(asset, assets);
  }, [asset, assets]);

  const handleYandexSearch = () => {
      const query = asset.analysis 
        ? `${asset.analysis.genre} ${asset.analysis.tags.slice(0,3).join(' ')} game ad`
        : 'game advertising reference';
      window.open(`https://yandex.com/images/search?text=${encodeURIComponent(query)}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('已复制到剪贴板');
  };

  if (!asset.analysis) return <div>加载中...</div>;

  const { analysis, computedMeta } = asset;
  const { visual, marketing, strategy, risk } = analysis;

  // Helper to render bounding box
  const renderBox = (box?: BoundingBox, color: string = 'red') => {
    if (!box) return null;
    // Coordinates are 0-1000 from Gemini usually, or need normalization. 
    const style = {
      top: `${box.ymin / 10}%`,
      left: `${box.xmin / 10}%`,
      height: `${(box.ymax - box.ymin) / 10}%`,
      width: `${(box.xmax - box.xmin) / 10}%`,
    };
    return (
      <div className={`absolute border-2 border-${color}-500 z-10 group`} style={style}>
        <span className={`absolute -top-5 left-0 bg-${color}-500 text-white text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
          {box.label}
        </span>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-30">
        <div className="flex items-center gap-4">
            <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
            ← 返回
            </button>
            <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {analysis.title}
                    {/* Project Dropdown in Title */}
                    <select 
                        className="text-xs bg-slate-100 text-slate-700 border-none rounded px-2 py-1 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                        value={analysis.project || GameProject.OTHER}
                        onChange={(e) => updateAssetProject(asset.id, e.target.value as GameProject)}
                    >
                        {Object.values(GameProject).map(p => (
                            <option key={p} value={p}>{p.split('(')[0]}</option>
                        ))}
                    </select>
                </h2>
                <div className="flex gap-2 text-xs text-slate-500 items-center mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{analysis.genre}</span>
                    <span>|</span>
                    <span>{analysis.style}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-6">
            
            {/* Performance Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
                {Object.values(PerformanceLevel).map((level) => (
                    <button
                        key={level}
                        onClick={() => updateAssetPerformance(asset.id, level)}
                        className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                            asset.performanceLevel === level 
                            ? 'bg-white text-slate-900 shadow-sm font-bold' 
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {level.split(' ')[0]}
                    </button>
                ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showBoxes} onChange={e => setShowBoxes(e.target.checked)} className="rounded text-blue-600" />
              <span className="text-sm text-slate-600">显示 AI 识别框</span>
            </label>
            <div className="text-right border-l pl-4 border-slate-200">
                <div className="text-xs text-slate-400">Hook 强度</div>
                <div className={`text-2xl font-black ${marketing.hookStrength > 80 ? 'text-red-600' : 'text-blue-600'}`}>
                    {marketing.hookStrength}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Visual Truth (CV + Image) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Image Container with Overlay */}
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50 relative group">
            <div className="relative">
              <img src={asset.url} alt="Asset" className="w-full h-auto block" />
              
              {/* Bounding Boxes Layer */}
              {showBoxes && (
                <>
                  {renderBox(visual.subjectBox, 'red')}
                  {visual.uiElements?.map((ui, i) => (
                    <React.Fragment key={i}>
                      {renderBox({ ...ui.box!, label: ui.name }, 'blue')}
                    </React.Fragment>
                  ))}
                </>
              )}
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 flex justify-between backdrop-blur-md">
                <span>分辨率: {computedMeta.width} x {computedMeta.height}</span>
                <span>比例: {computedMeta.aspectRatio}</span>
            </div>
          </div>

          {/* The "Truth" Panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                🎨 真实色彩数据 (CV算法提取)
            </h3>
            <div className="space-y-3">
                {visual.realColorPalette?.map((color: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                        <div 
                            className="w-12 h-12 rounded-lg shadow-inner border border-black/5" 
                            style={{backgroundColor: color.hex}}
                        ></div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="font-mono text-xs font-bold text-slate-700">{color.hex}</span>
                                <span className="text-xs text-slate-500">{color.percentage}% 占比</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div className="bg-slate-400 h-full rounded-full" style={{width: `${color.percentage}%`}}></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
             <button 
                onClick={handleYandexSearch}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-600 transition-colors"
               >
                 <span className="text-red-500 font-bold">Y</span>
                 <span>在 Yandex 上搜索相似图 (以图搜图)</span>
               </button>
          </div>

          {/* OCR Result */}
          {visual.ocrText && visual.ocrText.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                🔤 OCR 文本识别
              </h3>
              <div className="bg-slate-50 p-3 rounded border border-slate-100 text-xs text-slate-700 font-mono leading-relaxed">
                {visual.ocrText.join('\n')}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: AI Strategy & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Strategy Template Card (New) */}
          <div className="bg-white p-0 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
               <h3 className="font-bold">🏗 复刻配方 (Replication Template)</h3>
               <span className="text-xs bg-white/20 px-2 py-1 rounded">可直接发给美术</span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">视觉公式</div>
                  <div className="text-sm text-slate-900 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                    {strategy.replicationTemplate?.visualFormula || '-'}
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">钩子剧本</div>
                  <div className="text-sm text-slate-900 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                    {strategy.replicationTemplate?.hookBlueprint || '-'}
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">构图参考</div>
                  <div className="text-sm text-slate-900 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                    {strategy.replicationTemplate?.compositionGuide || '-'}
                  </div>
               </div>
               <div>
                  <div className="text-xs font-bold text-slate-400 uppercase mb-1">配色策略</div>
                  <div className="text-sm text-slate-900 font-medium bg-slate-50 p-2 rounded border border-slate-100">
                    {strategy.replicationTemplate?.colorStrategy || '-'}
                  </div>
               </div>
            </div>
          </div>

          {/* Marketing Analysis */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
             <div className="flex items-start gap-4">
                <div className="text-4xl">🎣</div>
                <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">核心钩子: {marketing.hookType}</h3>
                    <p className="text-blue-800/80 text-sm leading-relaxed">
                        {marketing.valueProposition} <br/>
                        针对 <strong>{marketing.targetAudience}</strong> 人群，
                        利用 <strong>{marketing.emotionalTrigger}</strong> 情绪触发转化。
                    </p>
                </div>
             </div>
          </div>

          {/* AI Improvements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
             <div>
                <h3 className="font-bold text-slate-900 mb-3 border-l-4 border-orange-500 pl-3">⚡ 优化建议</h3>
                <ul className="space-y-2">
                    {strategy.improvementTips.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-orange-500">→</span> {s}
                        </li>
                    ))}
                </ul>
             </div>
          </div>

          {/* Generative Prompts (New) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
             <h3 className="font-bold text-slate-900 border-l-4 border-purple-500 pl-3">✨ AIGC 提示词反推</h3>
             
             <div className="space-y-4">
                {/* Midjourney */}
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                            <span className="text-xl">⛵</span> Midjourney V6 Prompt (English)
                        </div>
                        <button 
                            onClick={() => copyToClipboard(strategy.midjourneyPrompt || '')}
                            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition-colors"
                        >
                            复制
                        </button>
                    </div>
                    <div className="text-sm text-zinc-300 font-mono leading-relaxed break-words">
                        {strategy.midjourneyPrompt || "分析中..."}
                    </div>
                </div>

                {/* Jimeng */}
                <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <div className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                            <span className="text-xl">🦋</span> 即梦 4.0 提示词 (Chinese)
                        </div>
                        <button 
                            onClick={() => copyToClipboard(strategy.jimengPrompt || '')}
                            className="text-xs bg-zinc-700 hover:bg-zinc-600 text-white px-2 py-1 rounded transition-colors"
                        >
                            复制
                        </button>
                    </div>
                    <div className="text-sm text-zinc-300 font-mono leading-relaxed break-words">
                        {strategy.jimengPrompt || "分析中..."}
                    </div>
                </div>
             </div>
          </div>

          {/* Similar Assets (New) */}
          {similarAssets.length > 0 && (
            <div className="pt-6 border-t border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">🔍 相似热门素材</h3>
              <div className="grid grid-cols-3 gap-4">
                {similarAssets.map(item => (
                  <div key={item.asset.id} className="group cursor-pointer" onClick={() => {
                    alert("跳转功能需路由支持，此处仅展示相似度：" + (item.score || 0).toFixed(2));
                  }}>
                    <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative">
                       <img src={item.asset.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>
                       <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] p-1 text-center">
                         相似度 {(item.score * 100).toFixed(0)}%
                       </div>
                    </div>
                    <div className="text-xs mt-1 text-slate-600 truncate">{item.asset.analysis?.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};