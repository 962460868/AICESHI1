
import React from 'react';
import { Asset } from '../types';

interface AssetDetailProps {
  asset: Asset;
  onBack: () => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
  if (!asset.analysis) return <div>加载中...</div>;

  const { analysis, computedMeta } = asset;
  const { visual, marketing, strategy, risk } = analysis;

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
            <h2 className="text-lg font-bold text-slate-900">{analysis.title}</h2>
            <div className="flex gap-2 text-xs text-slate-500 items-center">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-medium">{analysis.genre}</span>
                <span>|</span>
                <span>{analysis.style}</span>
            </div>
            </div>
        </div>
        <div className="text-right">
            <div className="text-xs text-slate-400">预估效果分</div>
            <div className={`text-2xl font-black ${strategy.score > 80 ? 'text-green-600' : 'text-blue-600'}`}>
                {strategy.score}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Visual Truth (CV + Image) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50 relative group">
            <img src={asset.url} alt="Asset" className="w-full h-auto" />
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 flex justify-between backdrop-blur-md">
                <span>分辨率: {computedMeta.width} x {computedMeta.height}</span>
                <span>比例: {computedMeta.aspectRatio}</span>
            </div>
          </div>

          {/* The "Truth" Panel - Data from Code, not AI */}
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
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                🖼 构图与布局
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">构图模式</div>
                    <div className="font-bold text-slate-800 text-sm">{visual.composition}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-400 mb-1">视觉密度</div>
                    <div className="font-bold text-slate-800 text-sm">{visual.visualDensity}</div>
                </div>
             </div>
             <div className="mt-4">
                 <div className="text-xs text-slate-400 mb-2">识别到的 UI 元素</div>
                 <div className="flex flex-wrap gap-2">
                     {visual.uiElements?.map((ui, i) => (
                         <span key={i} className="text-xs border border-slate-200 px-2 py-1 rounded bg-white text-slate-600">
                             {ui}
                         </span>
                     ))}
                 </div>
             </div>
          </div>
        </div>

        {/* RIGHT: AI Strategy & Comparison */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Marketing Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
             <div className="flex items-start gap-4">
                <div className="text-4xl">🎣</div>
                <div>
                    <h3 className="font-bold text-blue-900 text-lg mb-1">核心营销钩子: {marketing.hookType}</h3>
                    <p className="text-blue-800/80 text-sm leading-relaxed">
                        该素材使用了典型的 <strong>{marketing.hookType.split('(')[0]}</strong> 策略。
                        {marketing.emotionalTrigger && `主要利用用户 ${marketing.emotionalTrigger} 的情绪。`}
                        {marketing.valueProposition && `向用户传达了 "${marketing.valueProposition}" 的核心爽点。`}
                    </p>
                </div>
             </div>
          </div>

          {/* Report */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
             <div>
                <h3 className="font-bold text-slate-900 mb-3 border-l-4 border-blue-500 pl-3">✅ 表现亮点</h3>
                <ul className="space-y-2">
                    {strategy.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-green-500">✔</span> {s}
                        </li>
                    ))}
                </ul>
             </div>
             <div>
                <h3 className="font-bold text-slate-900 mb-3 border-l-4 border-orange-500 pl-3">🚧 优化建议</h3>
                <ul className="space-y-2">
                    {strategy.improvementTips.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                            <span className="text-orange-500">⚡</span> {s}
                        </li>
                    ))}
                </ul>
             </div>
          </div>

          {/* Copywriting */}
          <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                ✍️ AI 投放文案生成
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {strategy.adCopyVariations.map((copy, i) => (
                     <div key={i} className="bg-white/10 p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-copy" onClick={() => navigator.clipboard.writeText(copy.headline + "\n" + copy.body)}>
                         <div className="font-bold text-white text-sm mb-2">方案 {i+1}</div>
                         <div className="font-bold text-yellow-400 text-sm mb-1">"{copy.headline}"</div>
                         <div className="text-xs leading-relaxed opacity-80">{copy.body}</div>
                     </div>
                 ))}
             </div>
          </div>

          {/* Risk */}
          {risk.riskScore > 0 && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-4">
                  <div className="text-2xl">🛡️</div>
                  <div>
                      <div className="font-bold text-red-800 text-sm">风控提示 (Risk Score: {risk.riskScore})</div>
                      <div className="text-xs text-red-600">{risk.flags.join(', ')}</div>
                  </div>
              </div>
          )}

        </div>
      </div>
    </div>
  );
};
