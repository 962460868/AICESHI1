import React from 'react';
import { Asset, VisualAnalysis, MarketingAnalysis, CreativeStrategy } from '../types';

interface AssetDetailProps {
  asset: Asset;
  onBack: () => void;
}

export const AssetDetail: React.FC<AssetDetailProps> = ({ asset, onBack }) => {
  if (!asset.analysis) return <div>加载中...</div>;

  const { analysis } = asset;
  const visual = (analysis.visual || {}) as Partial<VisualAnalysis>;
  const marketing = (analysis.marketing || {}) as Partial<MarketingAnalysis>;
  const strategy = (analysis.strategy || {}) as Partial<CreativeStrategy>;
  const risk = analysis.risk || { riskScore: 0, flags: [], platformCompliance: '未知' };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-30">
        <div className="flex items-center gap-4">
            <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 transition-colors"
            >
            ← 返回图库
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
            <h2 className="text-xl font-bold text-slate-900">{analysis.title}</h2>
            <div className="flex gap-2 text-xs text-slate-500">
                <span>{new Date(asset.uploadDate).toLocaleDateString()}</span>
                <span>·</span>
                <span>{analysis.genre}</span>
            </div>
            </div>
        </div>
        <div className="flex gap-3">
             <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 shadow-sm transition-all">
                导出 PDF 报告
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image & Tags (4 Columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
            <img src={asset.url} alt="Asset" className="w-full h-auto object-contain" />
          </div>

          {/* Tags Cloud */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">AI 智能标签</h3>
            <div className="flex flex-wrap gap-2">
                {analysis.tags?.map((tag, i) => (
                    <span key={i} className="inline-flex flex-col text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                        <span className="text-slate-400 mb-0.5">{tag.category}</span>
                        <span className="text-slate-700 font-bold">{tag.value}</span>
                    </span>
                ))}
            </div>
          </div>
          
          {/* Risk Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-900">风控检测</h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    risk.riskScore > 50 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                    {risk.riskScore > 50 ? '高风险' : '安全'}
                </div>
             </div>
             <div className="space-y-3">
                 <div className="flex justify-between text-sm">
                     <span className="text-slate-500">违规指数</span>
                     <span className="font-bold">{risk.riskScore}/100</span>
                 </div>
                 <div className="flex justify-between text-sm">
                     <span className="text-slate-500">平台通过率</span>
                     <span className="font-bold">{risk.platformCompliance}</span>
                 </div>
                 {risk.flags && risk.flags.length > 0 && (
                     <div className="mt-2 p-3 bg-red-50 rounded-lg text-xs text-red-600 border border-red-100">
                         <strong>警告项：</strong> {risk.flags.join('、')}
                     </div>
                 )}
             </div>
          </div>
        </div>

        {/* Right Column: Deep Analysis (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Creative Director Insight (The "Brain") */}
          <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="text-9xl">🧠</span>
             </div>
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-slate-900">AI 创意总监·洞察报告</h3>
                    <div className="flex flex-col items-end">
                        <span className="text-sm text-slate-500">推荐指数</span>
                        <span className="text-4xl font-black text-blue-600">{strategy.score}<span className="text-lg text-slate-400">/100</span></span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white/80 p-4 rounded-xl border border-green-100">
                        <h4 className="text-green-700 font-bold mb-2 flex items-center">
                            <span className="mr-2">👍</span> 亮点优势
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                            {strategy.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                    <div className="bg-white/80 p-4 rounded-xl border border-red-100">
                        <h4 className="text-red-700 font-bold mb-2 flex items-center">
                            <span className="mr-2">👎</span> 待优化/风险
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                             {strategy.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg shadow-blue-200">
                    <h4 className="font-bold mb-2 flex items-center text-blue-100">
                         💡 专家优化建议
                    </h4>
                    <div className="space-y-2">
                        {strategy.improvementTips?.map((tip, i) => (
                            <div key={i} className="flex gap-2 items-start text-sm">
                                <span className="bg-blue-500 w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i+1}</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>

          {/* 2. Marketing & Copywriting (The "Pen") */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
                ✍️ 营销策略 & 文案生成
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="space-y-4">
                     <div>
                         <div className="text-xs text-slate-400 uppercase font-bold mb-1">核心钩子 (Hook)</div>
                         <div className="text-lg font-semibold text-slate-800">{marketing.hookType}</div>
                     </div>
                     <div>
                         <div className="text-xs text-slate-400 uppercase font-bold mb-1">情绪触发 (Emotion)</div>
                         <div className="text-slate-700">{marketing.emotionalTrigger}</div>
                     </div>
                     <div>
                         <div className="text-xs text-slate-400 uppercase font-bold mb-1">目标受众 (Target)</div>
                         <div className="text-slate-700">{marketing.targetAudience}</div>
                     </div>
                     <div>
                         <div className="text-xs text-slate-400 uppercase font-bold mb-1">价值主张 (Value)</div>
                         <div className="text-slate-700">{marketing.valueProposition}</div>
                     </div>
                 </div>
                 
                 {/* Generated Copy */}
                 <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-slate-300">
                     <h4 className="text-slate-500 text-xs font-bold uppercase mb-4">AI 推荐广告文案</h4>
                     <div className="space-y-4">
                         {strategy.adCopyVariations?.map((copy, i) => (
                             <div key={i} className="bg-white p-3 rounded border border-slate-200 shadow-sm">
                                 <div className="font-bold text-slate-800 mb-1 text-sm">{copy.headline}</div>
                                 <div className="text-slate-600 text-xs leading-relaxed">{copy.body}</div>
                             </div>
                         ))}
                     </div>
                 </div>
             </div>
          </div>

          {/* 3. Visual Deep Dive (The "Eye") */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
             <h3 className="text-xl font-bold text-slate-900 mb-6">👁️ 视觉叙事拆解</h3>
             <div className="space-y-6">
                 <div className="bg-slate-50 p-4 rounded-xl">
                     <span className="text-xs text-slate-400 uppercase font-bold">场景叙事</span>
                     <p className="text-slate-700 mt-1 leading-relaxed">{visual.sceneDescription}</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div>
                         <span className="text-xs text-slate-400 uppercase font-bold">构图法</span>
                         <div className="text-slate-800 font-medium mt-1">{visual.composition}</div>
                     </div>
                     <div>
                         <span className="text-xs text-slate-400 uppercase font-bold">光影氛围</span>
                         <div className="text-slate-800 font-medium mt-1">{visual.lighting}</div>
                     </div>
                     <div>
                         <span className="text-xs text-slate-400 uppercase font-bold">视觉动线</span>
                         <div className="text-slate-800 font-medium mt-1 text-sm">{visual.visualHierarchy}</div>
                     </div>
                 </div>

                 <div>
                     <span className="text-xs text-slate-400 uppercase font-bold">色彩心理学</span>
                     <div className="flex gap-4 mt-2">
                        {visual.colorPalette?.map((color, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg shadow-sm border border-slate-100" style={{backgroundColor: color}}></div>
                                <span className="text-xs font-mono text-slate-500">{color}</span>
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
          </div>

          {/* 4. Variant & Replication (The "Future") */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Variant Ideas */}
             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="font-bold text-slate-900 mb-4">🧪 A/B 测试方向</h3>
                 <div className="space-y-3">
                     {strategy.variantIdeas?.map((idea, i) => (
                         <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100 text-sm">
                             <span className="text-purple-600">↳</span>
                             <span className="text-slate-700">{idea}</span>
                         </div>
                     ))}
                 </div>
             </div>

             {/* SD Prompt */}
             <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl shadow-lg">
                 <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                    🎨 Midjourney 复刻指令
                    <button 
                        onClick={() => navigator.clipboard.writeText(analysis.replicationPrompt)}
                        className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded transition-colors"
                    >
                        复制
                    </button>
                 </h3>
                 <div className="bg-black/30 p-3 rounded-lg text-xs font-mono leading-relaxed h-32 overflow-y-auto text-slate-400">
                     {analysis.replicationPrompt}
                 </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};