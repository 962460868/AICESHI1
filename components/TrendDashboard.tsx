
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Asset, GameGenre } from '../types';

interface TrendDashboardProps {
  assets: Asset[];
}

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ assets }) => {
  
  const validAssets = assets.filter(a => a.analysis);

  // 1. Hook Stats
  const hookCounts = validAssets.reduce<Record<string, number>>((acc, curr) => {
    const hook = curr.analysis?.marketing?.hookType || 'Unknown';
    // Clean up the name (remove brackets)
    const cleanName = hook.split('(')[0];
    acc[cleanName] = (acc[cleanName] || 0) + 1;
    return acc;
  }, {});

  const hookData = Object.entries(hookCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // 2. Genre Stats
  const genreData = Object.values(GameGenre).map(genre => {
      const count = validAssets.filter(a => a.analysis?.genre === genre).length;
      return { name: genre.split(' ')[0], value: count };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  if (validAssets.length < 2) {
      return (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-xl">
              <span className="text-4xl mb-4">📊</span>
              <p>素材样本不足</p>
              <p className="text-sm mt-2">请上传至少 2 张素材以生成聚类分析报表。</p>
          </div>
      )
  }

  return (
    <div className="space-y-8">
      
      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase">Top 1 品类</div>
              <div className="text-2xl font-black text-slate-900 mt-2">{genreData[0]?.name || '-'}</div>
              <div className="text-xs text-slate-400 mt-1">占比 {((genreData[0]?.value || 0)/validAssets.length*100).toFixed(0)}%</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase">Top 1 钩子策略</div>
              <div className="text-2xl font-black text-blue-600 mt-2">{hookData[0]?.name || '-'}</div>
              <div className="text-xs text-slate-400 mt-1">出现 {hookData[0]?.value} 次</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase">资产总数</div>
              <div className="text-2xl font-black text-purple-600 mt-2">{validAssets.length}</div>
              <div className="text-xs text-slate-400 mt-1">趋势样本</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Hook Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">🔥 热门钩子策略 (Hook)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hookData} layout="vertical" margin={{left: 20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Genre Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">🎮 品类构成分析</h3>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  paddingAngle={5}
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-400 text-sm font-bold">
                    {validAssets.length} Assets
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
              {genreData.slice(0,4).map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                      {g.name}
                  </div>
              ))}
          </div>
        </div>

      </div>
      
      {/* Intelligent Insight */}
      <div className="bg-indigo-900 text-indigo-100 p-8 rounded-3xl shadow-lg">
          <h3 className="text-xl font-bold text-white mb-4">🧠 AI 趋势洞察总结</h3>
          <div className="space-y-4 text-sm leading-relaxed opacity-90">
              <p>
                  当前素材库主要集中在 <strong>{genreData[0]?.name}</strong> 品类，
                  最常用的营销钩子是 <strong>{hookData[0]?.name}</strong>。
              </p>
              <p>
                  {hookData.length > 2 && hookData[0].value > hookData[1].value * 2 
                    ? "⚠️ 警告：钩子类型过于单一，可能导致受众疲劳，建议尝试第二梯队的策略进行 A/B 测试。" 
                    : "✅ 策略分布相对均衡，素材多样性良好。"
                  }
              </p>
              {/* Mocked Recommendation Logic */}
              <div className="bg-white/10 p-4 rounded-xl border border-white/10 mt-4">
                  <span className="font-bold text-yellow-400 block mb-2">🚀 下一步行动建议:</span>
                  <ul className="list-disc list-inside space-y-1">
                      <li>尝试制作 3 个使用 "{hookData.length > 1 ? hookData[1].name : 'Fail Run'}" 钩子的新素材。</li>
                      <li>补充更多 "{Object.values(GameGenre).find(g => !genreData.find(d => g.includes(d.name)))?.split(' ')[0]}" 品类素材以拓宽分析视野。</li>
                  </ul>
              </div>
          </div>
      </div>

    </div>
  );
};
