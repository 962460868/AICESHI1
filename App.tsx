import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ViewState, Asset } from './types';
import { AssetProvider, useAssets } from './context/AssetContext';
import { UploadArea } from './components/UploadArea';
import { AssetGrid } from './components/AssetGrid';
import { AssetDetail } from './components/AssetDetail';
import { TrendDashboard } from './components/TrendDashboard';

const MainContent: React.FC = () => {
  const [currentView, setView] = useState<ViewState>(ViewState.UPLOAD);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { assets, addAsset, updateAsset } = useAssets();

  const handleAssetProcessed = (asset: Asset) => {
    if (asset.status === 'processing') {
       addAsset(asset);
    } else {
       updateAsset(asset);
    }
  };

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setView(ViewState.DETAILS);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.UPLOAD:
        return (
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-900">素材导入</h2>
               <p className="text-slate-500 mt-1">上传游戏广告创意，AI 将自动进行深度结构化拆解。</p>
            </div>
            <UploadArea onAssetProcessed={handleAssetProcessed} />
            
            {/* Mini Gallery Preview */}
            {assets.length > 0 && (
               <div className="mt-16 pt-8 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">最近上传</h3>
                  <div className="opacity-60 pointer-events-none grayscale">
                     <AssetGrid assets={assets.slice(0, 4)} onSelect={() => {}} />
                  </div>
               </div>
            )}
          </div>
        );
      case ViewState.GALLERY:
        return (
           <div className="max-w-7xl mx-auto">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-900">资产数据库</h2>
               <p className="text-slate-500 mt-1">支持多维度筛选、搜索和管理的智能创意库。</p>
            </div>
            <AssetGrid assets={assets} onSelect={handleSelectAsset} />
           </div>
        );
      case ViewState.TRENDS:
        return (
           <div className="max-w-6xl mx-auto">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-900">趋势洞察</h2>
               <p className="text-slate-500 mt-1">基于库内资产的 AI 聚合分析与机会点挖掘。</p>
            </div>
            <TrendDashboard assets={assets} />
           </div>
        );
      case ViewState.DETAILS:
        if (!selectedAsset) return <div>未选择资产</div>;
        return (
           <div className="max-w-6xl mx-auto">
             <AssetDetail 
                asset={selectedAsset} 
                onBack={() => setView(ViewState.GALLERY)} 
             />
           </div>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Navbar currentView={currentView} setView={(view) => {
          setView(view);
          if(view !== ViewState.DETAILS) setSelectedAsset(null);
      }} />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {renderContent()}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AssetProvider>
      <MainContent />
    </AssetProvider>
  );
};

export default App;