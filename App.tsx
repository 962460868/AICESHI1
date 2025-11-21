
import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ViewState, Asset } from './types';
import { AssetProvider, useAssets } from './context/AssetContext';
import { UploadArea } from './components/UploadArea';
import { AssetGrid } from './components/AssetGrid';
import { AssetDetail } from './components/AssetDetail';
import { TrendDashboard } from './components/TrendDashboard';
import { ArtTools } from './components/ArtTools';

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

  const handleSelectAssetForInspector = (asset: Asset) => {
    setSelectedAsset(asset);
  };

  const handleOpenFullDetail = (asset: Asset) => {
    setSelectedAsset(asset);
    setView(ViewState.DETAILS);
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.UPLOAD:
        return (
          <div className="max-w-5xl mx-auto pt-8 h-full overflow-y-auto">
            <div className="mb-8 px-4">
               <h2 className="text-2xl font-bold text-white">素材导入</h2>
               <p className="text-zinc-400 mt-1">上传游戏广告创意，AI 将自动进行深度结构化拆解。</p>
            </div>
            <UploadArea onAssetProcessed={handleAssetProcessed} />
          </div>
        );
      case ViewState.GALLERY:
        return (
           <div className="h-full w-full">
            <AssetGrid 
              assets={assets} 
              onSelect={handleSelectAssetForInspector} 
              onOpenDetail={handleOpenFullDetail}
              selectedAssetId={selectedAsset?.id}
            />
           </div>
        );
      case ViewState.TRENDS:
        return (
           <div className="max-w-7xl mx-auto pt-8 px-8 h-full overflow-y-auto">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-white">趋势洞察</h2>
               <p className="text-zinc-400 mt-1">基于库内资产的 AI 聚合分析与机会点挖掘。</p>
            </div>
            <TrendDashboard assets={assets} />
           </div>
        );
      case ViewState.ART_TOOLS:
        // Use h-full to ensure ArtTools takes up all available space for internal scrolling
        // The container logic for scrolling is handled INSIDE ArtTools
        return (
            <div className="h-full w-full overflow-hidden">
                <ArtTools />
            </div>
        );
      case ViewState.DETAILS:
        if (!selectedAsset) return <div className="text-white p-8">未选择资产</div>;
        return (
           <div className="max-w-7xl mx-auto pt-6 px-6 h-full overflow-y-auto pb-10">
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
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-100 overflow-hidden">
      <Navbar currentView={currentView} setView={(view) => {
          setView(view);
          if(view !== ViewState.DETAILS && view !== ViewState.GALLERY) setSelectedAsset(null);
      }} />
      {/* Main container must be flex-col and h-full to allow children to fill height */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
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
