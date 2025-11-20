
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Asset, GameGenre } from '../types';
import { performClustering } from '../services/clusteringService';

interface TrendDashboardProps {
  assets: Asset[];
}

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ assets }) => {
  
  const validAssets = assets.filter(a => a.analysis && a.embedding);

  // Perform K-Means Clustering
  const clusters = useMemo(() => {
    return performClustering(validAssets, 3); // Find 3 main patterns
  }, [validAssets]);

  // Extract common genre/hook for each cluster
  const clusterReports = clusters.map((cluster, i) => {
    const genres = cluster.assets.map(a => a.analysis!.genre);
    const hooks = cluster.assets.map(a => a.analysis!.marketing.hookType);
    const topGenre = genres.sort((a,b) => genres.filter(v => v===a).length - genres.filter(v => v===b).length).pop();
    const topHook = hooks.sort((a,b) => hooks.filter(v => v===a).length - hooks.filter(v => v===b).length).pop();
    
    return {
      id: i + 1,
      count: cluster.assets.length,
      topGenre,
      topHook,
      sampleAsset: cluster.assets[0]
    };
  });

  // Basic Stats
  const hookCounts = validAssets.reduce<Record<string, number>>((acc, curr) => {
    const hook = curr.analysis?.marketing?.hookType || 'Unknown';
    const cleanName = hook.split('(')[0];
    acc[cleanName] = (acc[cleanName] || 0) + 1;
    return acc;
  }, {});
  const hookData = Object.entries(hookCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (validAssets.length < 3) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-zinc-500 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl">
              <span className="text-4xl mb-4">🧬</span>
              <p>需要更多数据进行聚类</p>
              <p className="text-sm mt-2">目前素材库样本不足 (需要至少 3 张已完成 Embedding 计算的素材)。</p>
          </div>
      )
  }

  return (
    <div className="space-y-8 text-zinc-200">
      
      {/* Clustering Insight Card */}
      <div className="bg-gradient-to-r from-indigo-900 to-blue-900 text-white p-8 rounded-3xl shadow-xl border border-white/5">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            🧬 AI 视觉聚类发现 (Visual Clustering)
            <span className="text-xs bg-white/10 border border-white/10 px-2 py-1 rounded font-normal text-indigo-200">基于 CLIP-like Embeddings</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {clusterReports.map(c => (
              <div key={c.id} className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-indigo-200">创意簇 #{c.id}</span>
                  <span className="text-xs bg-indigo-600 px-2 py-0.5 rounded text-white font-mono">{c.count} items</span>
                </div>
                
                <div className="flex gap-3 mb-4">
                  <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5">
                    <img src={c.sampleAsset?.url} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="text-sm opacity-90 flex flex-col justify-center">
                     <div className="font-bold text-white mb-1">{c.topGenre?.split(' ')[0]}</div>
                     <div className="text-indigo-200 text-xs">{c.topHook?.split('(')[0]}</div>
                  </div>
                </div>

                <div className="text-xs border-t border-white/10 pt-3 text-indigo-300 leading-relaxed">
                   <span className="block mb-1 text-indigo-100 font-semibold">🔥 建议复刻方向:</span>
                   {c.sampleAsset?.analysis?.strategy.replicationTemplate?.visualFormula || "标准化构图 + 强冲突色彩"}
                </div>
              </div>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Hook Distribution */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-100 mb-6">🔥 市场热门钩子 (Hook Market Share)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hookData} layout="vertical" margin={{left: 10}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={90} />
                <Tooltip 
                    cursor={{fill: '#334155', opacity: 0.2}}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px' }} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategic Suggestions */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm flex flex-col justify-center">
           <h3 className="text-lg font-bold text-zinc-100 mb-4">🚀 智能策略建议</h3>
           <div className="space-y-4">
              {clusterReports[0] && (
                <div className="flex gap-4 items-start p-4 bg-green-900/20 border border-green-900/50 rounded-xl text-sm text-green-300">
                  <span className="text-2xl">📈</span>
                  <div>
                    <div className="font-bold mb-1 text-green-200">放大优势</div>
                    当前表现最强的 "簇 #{clusterReports[0].id}" 集中在 
                    <strong> {clusterReports[0].topGenre}</strong> 品类。
                    建议量产 5-10 个基于 <strong>{clusterReports[0].topHook}</strong> 的变体。
                  </div>
                </div>
              )}
               <div className="flex gap-4 items-start p-4 bg-blue-900/20 border border-blue-900/50 rounded-xl text-sm text-blue-300">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <div className="font-bold mb-1 text-blue-200">测试机会</div>
                    检测到素材库缺乏 <strong>{Object.values(GameGenre)[Math.floor(Math.random()*5)]}</strong> 类型的素材。
                    建议补充此类素材以完善数据模型。
                  </div>
                </div>
           </div>
        </div>

      </div>
    </div>
  );
};