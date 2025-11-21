
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Asset, GameProject, PerformanceLevel } from '../types';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  updateAssetProject: (id: string, project: GameProject) => void;
  updateAssetPerformance: (id: string, performance: PerformanceLevel) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ci_hub_assets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAssets(parsed);
      } catch (e) {
        console.error("Failed to load assets from storage", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    if (assets.length > 0) {
        localStorage.setItem('ci_hub_assets', JSON.stringify(assets));
    }
  }, [assets]);

  const addAsset = (asset: Asset) => {
    setAssets(prev => {
      // STRICT DE-DUPLICATION: Check if ID already exists
      const existsById = prev.some(a => a.id === asset.id);
      if (existsById) {
        return prev.map(a => a.id === asset.id ? asset : a);
      }
      
      // Secondary check: Filename duplication
      const existsByName = prev.some(a => a.fileName === asset.fileName && a.status === 'completed');
      if (existsByName) return prev;

      return [asset, ...prev];
    });
  };

  const updateAsset = (asset: Asset) => {
    setAssets(prev => {
      const exists = prev.some(a => a.id === asset.id);
      if (!exists) return [asset, ...prev];
      return prev.map(a => a.id === asset.id ? asset : a);
    });
  };

  const updateAssetProject = (id: string, project: GameProject) => {
    setAssets(prev => prev.map(a => {
        if (a.id === id && a.analysis) {
            return { ...a, analysis: { ...a.analysis, project } };
        }
        return a;
    }));
  };

  const updateAssetPerformance = (id: string, performance: PerformanceLevel) => {
    setAssets(prev => prev.map(a => {
        if (a.id === id) {
            return { ...a, performanceLevel: performance };
        }
        return a;
    }));
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, updateAssetProject, updateAssetPerformance }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};
