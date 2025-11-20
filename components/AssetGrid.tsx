
import React, { useState, useMemo } from 'react';
import { Asset, GameGenre, HookType, VisualStyle, GameProject, PerformanceLevel } from '../types';
import { useAssets } from '../context/AssetContext';

interface AssetGridProps {
  assets: Asset[];
  onSelect: (asset: Asset) => void;
  onOpenDetail: (asset: Asset) => void;
  selectedAssetId?: string;
}

export const AssetGrid: React.FC<AssetGridProps> = ({ assets, onSelect, onOpenDetail, selectedAssetId }) => {
  const { updateAssetProject, updateAssetPerformance } = useAssets();
  
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedHook, setSelectedHook] = useState<string | null>(null);
  
  // View Mode State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Stats for Filter Counts
  const counts = useMemo(() => {
    const pCount: Record<string, number> = {};
    const gCount: Record<string, number> = {};
    const hCount: Record<string, number> = {};
    let total = 0;
    assets.forEach(a => {
        total++;
        if (a.analysis) {
            const p = a.analysis.project || 'Unknown';
            const g = a.analysis.genre;
            const h = a.analysis.marketing.hookType;
            pCount[p] = (pCount[p] || 0) + 1;
            gCount[g] = (gCount[g] || 0) + 1;
            hCount[h] = (hCount[h] || 0) + 1;
        }
    });
    return { pCount, gCount, hCount, total };
  }, [assets]);

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    if (!asset.analysis) return true; // Show processing
    const matchesSearch = !search || asset.analysis.title.toLowerCase().includes(search.toLowerCase()) || 
                          asset.analysis.tags.some(t => t.includes(search));
    
    const matchesProject = selectedProject === null || asset.analysis.project === selectedProject;
    const matchesGenre = selectedGenre === null || asset.analysis.genre === selectedGenre;
    const matchesHook = selectedHook === null || asset.analysis.marketing.hookType === selectedHook;
    
    return matchesSearch && matchesProject && matchesGenre && matchesHook;
  });

  // Toggle Logic
  const toggleProject = (val: string) => setSelectedProject(prev => prev === val ? null : val);
  const toggleGenre = (val: string) => setSelectedGenre(prev => prev === val ? null : val);
  const toggleHook = (val: string) => setSelectedHook(prev => prev === val ? null : val);

  const activeAsset = assets.find(a => a.id === selectedAssetId);

  const handleYandexSearch = (asset: Asset) => {
      const query = asset.analysis 
        ? `${asset.analysis.genre} ${asset.analysis.tags.slice(0,3).join(' ')} game ad`
        : 'game advertising reference';
      window.open(`https://yandex.com/images/search?text=${encodeURIComponent(query)}`, '_blank');
  };

  return (
    <div className="flex h-full bg-zinc-950">
      
      {/* LEFT SIDEBAR: FILTERS */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-zinc-800 bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800">
           <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">资料库</h2>
           <div 
             className={`flex items-center justify-between text-zinc-300 hover:bg-zinc-800 p-2 rounded cursor-pointer transition-colors ${(!selectedGenre && !selectedHook && !selectedProject) ? 'bg-zinc-800' : ''}`}
             onClick={() => { setSelectedProject(null); setSelectedGenre(null); setSelectedHook(null); }}
           >
              <div className="flex items-center gap-2">
                <span>📂</span>
                <span className="text-sm font-medium">全部文件</span>
              </div>
              <span className="text-xs text-zinc-500">{counts.total}</span>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            
            {/* Projects */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">所属项目 (Project)</h3>
                <div className="space-y-0.5">
                    {Object.values(GameProject).map(proj => (
                        <div 
                            key={proj}
                            onClick={() => toggleProject(proj)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                selectedProject === proj ? 'bg-amber-900/30 text-amber-300 border border-amber-900/50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="opacity-70">🏢</span>
                                <span className="text-sm truncate">{proj.split('(')[0]}</span>
                            </div>
                            <span className="text-[10px] opacity-50">{counts.pCount[proj] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Genres */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">游戏品类 (Genre)</h3>
                <div className="space-y-0.5">
                    {Object.values(GameGenre).map(genre => (
                        <div 
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                selectedGenre === genre ? 'bg-blue-900/30 text-blue-300 border border-blue-900/50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="opacity-70">🎮</span>
                                <span className="text-sm truncate">{genre.split(' ')[0]}</span>
                            </div>
                            <span className="text-[10px] opacity-50">{counts.gCount[genre] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Hooks */}
            <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2">核心钩子 (Hook)</h3>
                <div className="space-y-0.5">
                    {Object.values(HookType).map(hook => (
                        <div 
                            key={hook}
                            onClick={() => toggleHook(hook)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors ${
                                selectedHook === hook ? 'bg-purple-900/30 text-purple-300 border border-purple-900/50' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                            }`}
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="opacity-70">⚡</span>
                                <span className="text-sm truncate">{hook.split('(')[0]}</span>
                            </div>
                            <span className="text-[10px] opacity-50">{counts.hCount[hook] || 0}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* CENTER: MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Toolbar */}
        <div className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/30">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索资产、标签、ID..."
                        className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-md py-1.5 pl-9 pr-4 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 hover:text-zinc-200'}`} 
                  title="List View"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-zinc-700 text-white' : 'hover:bg-zinc-800 hover:text-zinc-200'}`} 
                  title="Grid View"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                    <div className="text-4xl mb-4">🕸️</div>
                    <p>暂无符合条件的资产</p>
                </div>
            ) : viewMode === 'grid' ? (
                // --- GRID VIEW ---
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredAssets.map(asset => (
                        <div 
                            key={asset.id}
                            onClick={() => onSelect(asset)}
                            onDoubleClick={() => onOpenDetail(asset)}
                            className={`group relative aspect-[4/5] rounded-lg overflow-hidden cursor-pointer border transition-all duration-200 ${
                                selectedAssetId === asset.id 
                                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-900/20' 
                                : 'border-zinc-800 hover:border-zinc-600 hover:shadow-md bg-zinc-900'
                            }`}
                        >
                            {/* Processing Overlay */}
                            {asset.status === 'processing' && (
                                <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center flex-col gap-2">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-zinc-300 font-mono">分析中...</span>
                                </div>
                            )}

                            {/* Performance Badge */}
                            {asset.performanceLevel === PerformanceLevel.TOP && (
                                <div className="absolute top-0 left-0 z-10 bg-yellow-500/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                    TOP 👑
                                </div>
                            )}
                            {asset.performanceLevel === PerformanceLevel.STANDARD && (
                                <div className="absolute top-0 left-0 z-10 bg-slate-300/90 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-br-lg shadow-sm">
                                    STD ✅
                                </div>
                            )}

                            {/* Image */}
                            <div className="h-2/3 bg-zinc-800 relative overflow-hidden">
                                <img 
                                    src={asset.url} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    alt={asset.fileName} 
                                />
                                {asset.analysis && (
                                     <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur text-[9px] text-zinc-300 rounded border border-white/10 font-mono truncate max-w-[80px]">
                                        {asset.analysis.project ? asset.analysis.project.split(' ')[0] : 'Other'}
                                     </div>
                                )}
                            </div>

                            {/* Metadata Footer */}
                            <div className="h-1/3 p-3 bg-zinc-900 flex flex-col justify-between">
                                <div>
                                    <div className="text-xs text-zinc-200 font-medium truncate mb-1" title={asset.fileName}>
                                        {asset.analysis?.title || asset.fileName}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                                        <span>{asset.computedMeta.width}x{asset.computedMeta.height}</span>
                                    </div>
                                </div>
                                
                                {asset.analysis && (
                                    <div className="flex gap-1 mt-2 overflow-hidden">
                                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 text-[10px] rounded border border-blue-900/50 truncate">
                                            {asset.analysis.genre.split(' ')[0]}
                                        </span>
                                        <span className="px-1.5 py-0.5 bg-purple-900/30 text-purple-400 text-[10px] rounded border border-purple-900/50 truncate">
                                            {asset.analysis.strategy.score}分
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                // --- LIST VIEW ---
                <div className="space-y-2">
                    {filteredAssets.map(asset => (
                         <div 
                            key={asset.id}
                            onClick={() => onSelect(asset)}
                            onDoubleClick={() => onOpenDetail(asset)}
                            className={`flex items-center p-2 rounded-lg cursor-pointer border transition-all duration-200 hover:bg-zinc-800/50 ${
                                selectedAssetId === asset.id 
                                ? 'bg-zinc-800 border-blue-500/50' 
                                : 'bg-zinc-900 border-zinc-800'
                            }`}
                        >
                            <div className="w-12 h-12 rounded overflow-hidden bg-zinc-800 flex-shrink-0 mr-4 relative">
                                <img src={asset.url} className="w-full h-full object-cover" alt="thumb"/>
                                {asset.performanceLevel === PerformanceLevel.TOP && (
                                    <div className="absolute bottom-0 left-0 w-full h-2 bg-yellow-500"></div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4">
                                    <div className="text-sm text-zinc-200 font-medium truncate">
                                        {asset.analysis?.title || asset.fileName}
                                    </div>
                                    <div className="text-xs text-zinc-500 truncate">{asset.id}</div>
                                </div>
                                <div className="col-span-2">
                                     {asset.analysis && (
                                        <span className="text-xs text-zinc-400 truncate">
                                            {asset.analysis.project ? asset.analysis.project.split(' ')[0] : '-'}
                                        </span>
                                     )}
                                </div>
                                <div className="col-span-2">
                                     {asset.analysis && (
                                        <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded truncate inline-block max-w-full">
                                            {asset.analysis.genre.split(' ')[0]}
                                        </span>
                                     )}
                                </div>
                                <div className="col-span-2">
                                     {asset.analysis && (
                                        <span className="text-xs text-zinc-400 truncate">
                                            {asset.analysis.marketing.hookType.split('(')[0]}
                                        </span>
                                     )}
                                </div>
                                <div className="col-span-2 text-right text-xs text-zinc-500 font-mono">
                                    {asset.computedMeta.width}x{asset.computedMeta.height}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: INSPECTOR */}
      {activeAsset && (
          <div className="w-80 flex-shrink-0 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full animate-in slide-in-from-right duration-200">
              {/* Inspector Header */}
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">检查器</span>
                  <button onClick={() => onOpenDetail(activeAsset)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded transition-colors">
                      全屏详情
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                  {/* Preview */}
                  <div className="aspect-video bg-black/40 rounded border border-zinc-800 overflow-hidden flex items-center justify-center group relative">
                      <img src={activeAsset.url} className="max-w-full max-h-full" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                          <span className="text-white text-xs bg-black/60 px-2 py-1 rounded">双击查看详情</span>
                      </div>
                  </div>

                  {/* Manual Classification Controls */}
                  <div className="space-y-4 p-3 bg-zinc-800/30 rounded border border-zinc-800">
                      <div className="space-y-1">
                          <label className="text-xs text-zinc-500">所属项目 (Manual Correction)</label>
                          <select 
                            className="w-full bg-zinc-900 text-zinc-300 text-xs border border-zinc-700 rounded p-1.5 focus:outline-none focus:border-blue-500"
                            value={activeAsset.analysis?.project || GameProject.OTHER}
                            onChange={(e) => updateAssetProject(activeAsset.id, e.target.value as GameProject)}
                          >
                             {Object.values(GameProject).map(p => (
                                 <option key={p} value={p}>{p}</option>
                             ))}
                          </select>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs text-zinc-500">数据表现 (Labeling)</label>
                          <select 
                            className="w-full bg-zinc-900 text-zinc-300 text-xs border border-zinc-700 rounded p-1.5 focus:outline-none focus:border-blue-500"
                            value={activeAsset.performanceLevel || PerformanceLevel.UNRATED}
                            onChange={(e) => updateAssetPerformance(activeAsset.id, e.target.value as PerformanceLevel)}
                          >
                             {Object.values(PerformanceLevel).map(p => (
                                 <option key={p} value={p}>{p}</option>
                             ))}
                          </select>
                      </div>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-2">
                      <label className="text-xs text-zinc-500">文件名</label>
                      <div className="text-sm text-zinc-200 break-all">{activeAsset.fileName}</div>
                  </div>

                   {/* Tags */}
                   {activeAsset.analysis && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500">AI 标签</label>
                            <div className="flex flex-wrap gap-1.5">
                                {activeAsset.analysis.tags.slice(0,8).map(tag => (
                                    <span key={tag} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded border border-zinc-700">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-zinc-500">复刻配方</label>
                            <div className="p-3 bg-zinc-800/50 rounded border border-zinc-700 text-xs text-zinc-300 leading-relaxed">
                                <div className="mb-1"><span className="text-zinc-500">公式:</span> {activeAsset.analysis.strategy.replicationTemplate?.visualFormula}</div>
                                <div><span className="text-zinc-500">钩子:</span> {activeAsset.analysis.strategy.replicationTemplate?.hookBlueprint}</div>
                            </div>
                        </div>
                    </>
                   )}
                   
                   {/* Colors & Similar Search */}
                   <div className="space-y-3">
                       <div className="flex justify-between items-center">
                           <label className="text-xs text-zinc-500">色彩分布</label>
                           <div className="flex h-2 w-20 rounded overflow-hidden">
                               {activeAsset.computedMeta.dominantColors.map((c,i) => (
                                   <div key={i} style={{backgroundColor: c, flex: 1}} />
                               ))}
                           </div>
                       </div>
                       
                       <button 
                        onClick={() => handleYandexSearch(activeAsset)}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-300 transition-colors"
                       >
                         <span className="text-red-500 font-bold">Y</span>
                         <span>在 Yandex 上搜相似图</span>
                       </button>
                   </div>

                   {/* Notes */}
                   <div className="space-y-2 pt-4 border-t border-zinc-800">
                      <div className="flex justify-between">
                         <label className="text-xs text-zinc-500">备注</label>
                         <span className="text-xs text-blue-500 cursor-pointer hover:underline">编辑</span>
                      </div>
                      <div className="h-20 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-500">
                         {activeAsset.notes || "暂无..."}
                      </div>
                   </div>

              </div>
          </div>
      )}
    </div>
  );
};