import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Asset } from '../types';
import { performClustering } from '../services/clusteringService';
import { generateGameProfiles } from '../services/gameProfileService';

interface TrendDashboardProps {
  assets: Asset[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ assets }) => {
  
  const validAssets = assets.filter(a => a.analysis && a.status === 'completed');
  const gameProfiles = useMemo(() => generateGameProfiles(validAssets), [validAssets]);

  // --- 1. Clustering (Visual + Semantic) ---
  const clusters = useMemo(() => {
    return performClustering(validAssets.filter(a => a.embedding), 3); 
  }, [validAssets]);

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

  // --- 2. Hook Data (Real) ---
  // Aggregate from actual asset analysis data
  const hookCounts = validAssets.reduce((acc, curr) => {
    const hook = curr.analysis?.marketing?.hookType || 'Unknown';
    const cleanName = hook.split('(')[0];
    acc[cleanName] = (acc[cleanName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const hookData = Object.entries(hookCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Number(b.value) - Number(a.value));

  // --- 3. Composition Data (Real) ---
  const compCounts = validAssets.reduce((acc, curr) => {
      const comp = curr.analysis?.visual?.composition || 'Unknown';
      acc[comp] = (acc[comp] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const compData = Object.entries(compCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => Number(b.value) - Number(a.value));


  if (validAssets.length < 1) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-zinc-500 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-xl">
              <span className="text-4xl mb-4">📊</span>
              <p>数据不足，无法生成趋势分析</p>
              <p className="text-sm mt-2">请上传更多素材以激活仪表盘。</p>
          </div>
      )
  }

  return (
    <div className="space-y-8 pb-10 text-zinc-200">
      
      {/* Clustering Insight Card */}
      <div className="bg-gradient-to-r from-indigo-950 to-blue-950 text-white p-6 rounded-3xl shadow-xl border border-blue-900/30">
          <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                    🧬 视觉聚类发现 (Visual Clustering)
                </h3>
                <p className="text-sm text-indigo-200 mt-1">基于 AI Embeddings 的无监督学习聚类，自动发现潜在爆款模式。</p>
            </div>
          </div>
          
          {clusters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {clusterReports.map(c => (
                <div key={c.id} className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:bg-white/5 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-indigo-200">创意簇 #{c.id}</span>
                    <span className="text-xs bg-indigo-600/50 px-2 py-0.5 rounded text-white font-mono">{c.count} Assets</span>
                    </div>
                    
                    <div className="flex gap-3 mb-4">
                    <div className="w-16 h-16 rounded-lg bg-black/40 overflow-hidden shrink-0 border border-white/5">
                        <img src={c.sampleAsset?.url} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div className="text-sm opacity-90 flex flex-col justify-center">
                        <div className="font-bold text-white mb-1 truncate max-w-[120px]">{c.topGenre?.split(' ')[0]}</div>
                        <div className="text-indigo-200 text-xs truncate max-w-[120px]">{c.topHook?.split('(')[0]}</div>
                    </div>
                    </div>

                    <div className="text-xs border-t border-white/10 pt-3 text-indigo-300 leading-relaxed">
                         {c.sampleAsset?.analysis?.strategy.replicationTemplate?.visualFormula || "标准化构图 + 强冲突色彩"}
                    </div>
                </div>
                ))}
            </div>
          ) : (
             <div className="p-8 text-center text-indigo-300/50 border-2 border-dashed border-indigo-900/50 rounded-xl">
                 需要至少 3 个已分析的素材才能激活聚类功能。
             </div>
          )}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Hook Distribution */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
             <span>🔥</span> 核心钩子分布 (Hook Trends)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hookData} layout="vertical" margin={{left: 20, right: 30}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tick={{fill: '#cbd5e1'}} />
                <Tooltip 
                    cursor={{fill: '#334155', opacity: 0.2}}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f1f5f9', borderRadius: '8px' }} 
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20}>
                   {hookData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Composition Analysis */}
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-sm">
           <h3 className="text-lg font-bold text-zinc-100 mb-6 flex items-center gap-2">
             <span>📐</span> 构图偏好 (Composition)
          </h3>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={compData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {compData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#f1f5f9', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#a1a1aa'}} />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Project Profiles Table */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-100">🏆 项目表现概览 (Game Profiles)</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-zinc-950 text-zinc-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">项目名称</th>
                            <th className="p-4 font-medium">素材量</th>
                            <th className="p-4 font-medium">平均 Hook 强度</th>
                            <th className="p-4 font-medium">Top 1 钩子</th>
                            <th className="p-4 font-medium">Top 1 风格</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-zinc-300 divide-y divide-zinc-800">
                        {gameProfiles.map((profile) => (
                            <tr key={profile.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="p-4 font-bold text-white">{profile.id.split('(')[0]}</td>
                                <td className="p-4">
                                    <span className="bg-zinc-800 px-2 py-1 rounded text-xs font-mono">{profile.count}</span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{width: `${profile.avgHookStrength}%`}}></div>
                                        </div>
                                        <span className="text-xs">{profile.avgHookStrength}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-zinc-400">
                                    {profile.topHooks[0] ? profile.topHooks[0].name.split('(')[0] : '-'}
                                </td>
                                <td className="p-4 text-zinc-400">
                                    {profile.topStyles[0] ? profile.topStyles[0].name : '-'}
                                </td>
                            </tr>
                        ))}
                        {gameProfiles.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">暂无数据</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};