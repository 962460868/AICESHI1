
import React, { useState, useMemo } from 'react';
import { Asset, GameGenre, HookType, VisualStyle } from '../types';

interface AssetGridProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets, onSelect }) => {
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedHooks, setSelectedHooks] = useState<string[]>([]);
  
  // Stats for Filter Counts
  const counts = useMemo(() => {
    const gCount: Record<string, number> = {};
    const hCount: Record<string, number> = {};
    assets.forEach(a => {
        if (a.analysis) {
            const g = a.analysis.genre;
            const h = a.analysis.marketing.hookType;
            gCount[g] = (gCount[g] || 0) + 1;
            hCount[h] = (hCount[h] || 0) + 1;
        }
    });
    return { gCount, hCount };
  }, [assets]);

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    if (!asset.analysis) return false; // hide processing or failed for now in main grid logic
    const matchesSearch = !search || asset.analysis.title.toLowerCase().includes(search.toLowerCase()) || 
                          asset.analysis.tags.some(t => t.includes(search));
    const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(asset.analysis.genre);
    const matchesHook = selectedHooks.length === 0 || selectedHooks.includes(asset.analysis.marketing.hookType);
    
    return matchesSearch && matchesGenre && matchesHook;
  });

  const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
    set(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      
      {/* Sidebar Filters */}
      <div className="w-full lg:w-64 flex-shrink-0 space-y-6 lg:sticky lg:top-0 h-fit overflow-y-auto bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">游戏品类 (Genre)</h3>
          <div className="space-y-2">
            {Object.values(GameGenre).map(genre => (
              <label key={genre} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => toggleFilter(setSelectedGenres, genre)}
                    />
                    <span className={`ml-2 text-sm ${selectedGenres.includes(genre) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {genre.split(' ')[0]}
                    </span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {counts.gCount[genre] || 0}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-slate-100"></div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">核心钩子 (Hook)</h3>
          <div className="space-y-2">
            {Object.values(HookType).map(hook => (
              <label key={hook} className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                        checked={selectedHooks.includes(hook)}
                        onChange={() => toggleFilter(setSelectedHooks, hook)}
                    />
                    <span className={`ml-2 text-sm ${selectedHooks.includes(hook) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {hook.split('(')[0]}
                    </span>
                </div>
                <span className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                    {counts.hCount[hook] || 0}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <span className="text-slate-400">🔎</span>
            <input 
              type="text" 
              placeholder="输入关键词搜索：像素、美女、红色..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-slate-900 placeholder-slate-400"
            />
            <div className="text-xs text-slate-500 font-mono">
                {filteredAssets.length} ITEMS
            </div>
        </div>

        {filteredAssets.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
                没有找到匹配的素材
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssets.map(asset => (
                <div 
                key={asset.id}
                onClick={() => onSelect(asset)}
                className="group relative bg-white rounded-xl overflow-hidden border border-slate-200 cursor-pointer hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                >
                {/* Image Area */}
                <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
                    <img 
                    src={asset.url} 
                    alt={asset.fileName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Computed Badges */}
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        {asset.computedMeta.dominantColors.slice(0,3).map((hex, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white/20 shadow-sm" style={{backgroundColor: hex}} />
                        ))}
                    </div>
                </div>

                {/* Info Area */}
                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-slate-800 truncate flex-1 pr-2" title={asset.analysis?.title}>
                            {asset.analysis?.title}
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {asset.analysis?.strategy.score}分
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100">
                            {asset.analysis?.genre.split(' ')[0]}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 rounded border border-orange-100">
                            {asset.analysis?.marketing.hookType.split('(')[0]}
                        </span>
                    </div>

                    <div className="text-xs text-slate-400 flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                        <span>{asset.computedMeta.width}x{asset.computedMeta.height}</span>
                        <span className="font-mono">{asset.computedMeta.aspectRatio}</span>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
};
