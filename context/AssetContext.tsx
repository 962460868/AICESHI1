import React, { createContext, useContext, useState, useEffect } from 'react';
import { Asset } from '../types';

interface AssetContextType {
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ci_hub_assets');
    if (saved) {
      try {
        setAssets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load assets", e);
      }
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('ci_hub_assets', JSON.stringify(assets));
  }, [assets]);

  const addAsset = (asset: Asset) => {
    setAssets(prev => {
      // Simple de-duplication logic based on filename (In real app, use hash)
      const exists = prev.find(a => a.fileName === asset.fileName && a.analysis !== null);
      if (exists) return prev; 
      return [asset, ...prev];
    });
  };

  const updateAsset = (asset: Asset) => {
    setAssets(prev => prev.map(a => a.id === asset.id ? asset : a));
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset }}>
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
