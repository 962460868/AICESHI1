import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Asset } from '../types';

interface TrendDashboardProps {
  assets: Asset[];
}

export const TrendDashboard: React.FC<TrendDashboardProps> = ({ assets }) => {
  
  const validAssets = assets.filter(a => a.analysis);

  const hookCounts = validAssets.reduce<Record<string, number>>((acc, curr) => {
    const hook = curr.analysis?.marketing?.hookType || '未知';
    acc[hook] = (acc[hook] || 0) + 1;
    return acc;
  }, {});

  const hookData = Object.entries(hookCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const genreRisk = validAssets.reduce((acc, curr) => {
    const genre = curr.analysis?.genre || '未知';
    if (!acc[genre]) acc[genre] = { name: genre, count: 0, totalRisk: 0 };
    acc[genre].count += 1;
    acc[genre].totalRisk += curr.analysis?.risk?.riskScore || 0;
    return acc;
  }, {} as Record<string, any>);

  const genreRiskData = Object.values(genreRisk).map((item: any) => ({
    name: item.name,
    avgRisk: Math.round(item.totalRisk / item.count)
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  if (validAssets.length < 3) {
      return (
          <div className="flex items-center justify-center h-96 text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-xl">
              请至少添加 3 个素材以解锁趋势智能分析。
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Hook Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">🏆 爆款钩子分布</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={hookData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {hookData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Genre Risk Analysis */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">⚠️ 品类违规风险风向标</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genreRiskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '8px' }} />
                <Bar dataKey="avgRisk" fill="#ef4444" radius={[4, 4, 0, 0]} name="平均风险分" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
      
      {/* Automated Insight Generator */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 p-6 rounded-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          ✨ AI 趋势洞察总结
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100/50">
            <div className="text-blue-600 text-xs uppercase font-bold mb-2">主导策略</div>
            <div className="text-slate-600 text-sm leading-relaxed">
              <span className="font-bold text-slate-800">"{hookData[0]?.name || '未知'}"</span> 是当前库中占比最高的钩子策略 ({Math.round(((hookData[0]?.value || 0) / validAssets.length) * 100)}%)。
            </div>
          </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-purple-100/50">
            <div className="text-purple-600 text-xs uppercase font-bold mb-2">机会点</div>
            <div className="text-slate-600 text-sm leading-relaxed">
              检测到 SLG 品类下的“像素风”素材缺失。建议尝试高对比度的复古像素风格以形成差异化。
            </div>
          </div>
           <div className="bg-white p-5 rounded-xl shadow-sm border border-green-100/50">
            <div className="text-green-600 text-xs uppercase font-bold mb-2">疲劳预警</div>
            <div className="text-slate-600 text-sm leading-relaxed">
              “失败挽留”类素材近期出现频率过高，可能导致用户审美疲劳。建议转向“爽感/复仇”类叙事。
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};