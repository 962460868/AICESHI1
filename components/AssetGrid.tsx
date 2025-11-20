import React, { useState, useMemo } from 'react';
import { Asset } from '../types';

interface AssetGridProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets, onSelect }) => {
  const [filterGenre, setFilterGenre] = useState('全部');
  const [search, setSearch] = useState('');

  const genres = useMemo(() => {
    const g = new Set(assets.map(a => a.analysis?.genre).filter(Boolean));
    return ['全部', ...Array.from(g)];
  }, [assets]);

  const filteredAssets = assets.filter(asset => {
    if (filterGenre !== '全部' && asset.analysis?.genre !== filterGenre) return false;
    if (search && !asset.analysis?.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-xl border border-slate-200 sticky top-4 z-20 shadow-sm">
        <div className="flex gap-4 items-center flex-1">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="搜索标题、标签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 text-slate-900 pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 w-64 transition-all"
            />
          </div>
          
          <select 
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            className="bg-slate-50 text-slate-900 px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer"
          >
            {genres.map(g => <option key={g as string} value={g as string}>{g}</option>)}
          </select>
        </div>
        
        <div className="text-slate-500 text-sm self-center font-medium bg-slate-100 px-3 py-1 rounded-full">
          共 {filteredAssets.length} 个资产
        </div>
      </div>

      {/* Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-32 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="text-4xl mb-4">📭</div>
          <p>暂无素材，请先上传！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map(asset => (
            <div 
              key={asset.id}
              onClick={() => onSelect(asset)}
              className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Image container */}
              <div className="aspect-[16/9] overflow-hidden bg-slate-100 relative border-b border-slate-100">
                {asset.status === 'processing' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-sm">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                     <span className="text-xs text-blue-600 font-medium">AI 分析中...</span>
                  </div>
                )}
                <img 
                  src={asset.url} 
                  alt={asset.fileName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {asset.analysis && (
                   <div className="absolute top-2 left-2 bg-white/90 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm border border-slate-100">
                     {asset.analysis.genre}
                   </div>
                )}
                {asset.analysis?.strategy?.score && (
                    <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-md shadow-sm text-white
                        ${asset.analysis.strategy.score >= 80 ? 'bg-green-500' : asset.analysis.strategy.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                        {asset.analysis.strategy.score}分
                    </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {asset.status === 'processing' ? (
                   <div className="space-y-2">
                       <div className="h-4 bg-slate-100 rounded w-3/4 animate-pulse"></div>
                       <div className="h-3 bg-slate-100 rounded w-1/2 animate-pulse"></div>
                   </div>
                ) : asset.analysis ? (
                  <>
                    <h3 className="font-bold text-slate-800 truncate mb-2" title={asset.analysis.title}>
                        {asset.analysis.title}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                       {/* Hook Type Tag */}
                       <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium border border-blue-100">
                         {asset.analysis.marketing?.hookType || '未知钩子'}
                       </span>
                       {/* Style Tag */}
                       <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium border border-purple-100">
                         {asset.analysis.style}
                       </span>
                    </div>
                  </>
                ) : (
                  <h3 className="text-red-500 text-sm font-medium">分析失败</h3>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};